(function() {
	/*
	Server Side Public License
	VERSION 1, OCTOBER 16, 2018
	Copyright AnyWhichWay, LLC 2019
	 */
	"use strict"
	const uid = require("./uid.js"),
		isSoul = require("./is-soul.js"),
		toClassName = require("./to-class-name.js"),
		joqular = require("./joqular.js"),
		hashPassword = require("./hash-password.js"),
		secure = require("./secure.js"),
		trigrams = require("./trigrams.js"),
		tokenize = require("./tokenize.js"),
		stopwords = require("./stopwords.js"),
		stemmer = require("./stemmer.js"),
		on = require("./on.js")("cloud"),
		fromSerializable = require("./from-serializable.js"),
		sendMail = require("./sendmail.js"),
		User = require("./user.js"),
		Schema = require("./schema.js"),
		Position = require("./position.js"),
		Coordinates = require("./coordinates.js"),
		Cache = require("./cache.js"),
		Edge = require("./edge.js"),
		when = require("../when.js").cloud,
		functions = require("../functions.js").cloud,
		classes = require("../classes.js"),
		keys = require("../keys.js");
	
	const hexStringToUint8Array = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

	class Thunderhead {
		constructor({namespace,request,dbo,refresh=5000}) {
			this.ctors = {};
			this.request = request;
			this.dbo = dbo;
			this.cache = new Cache({namespace});
			this.register(Array);
			this.register(Date);
			this.register(URL);
			this.register(User);
			this.register(Schema);
			this.register(Position);
			this.register(Coordinates);
			Object.keys(classes).forEach((cname) => this.register(classes[cname]));
			require("./cloudflare-kv-extensions")(this);
			joqular.db = this;
			namespace.keys = this.keys;
			setInterval(() => {
				this.cache = new Cache({namespace});
			},refresh);
		}
		async add(path,data,options={}) {
			const edge = await this.get(path);
			return edge.add(data,options);
		}
		async addRoles(userName,roles=[]) {
			if(roles.length>=0) {
				const user = await this.getUser(userName);
				if(user) {
					user.roles || (user.roles={});
					roles.forEach((role) => user.roles[role]=true);
					secure.mapRoles(user);
					return this.putItem(user,{patch:true});
				}
			}
		}
		async authUser(userName,password) {
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			return this.dbo;
			const user = await this.getUser(userName);
			request.user = authed;
			if(user && user.salt && user.hash===(await hashPassword(password,1000,hexStringToUint8Array(user.salt))).hash) {
				secure.mapRoles(user);
				return user;
			}
		}
		async changePassword(userName,password,oldPassword) {
			const authed = this.request.user;
			let user = await this.authUser(userName,oldPassword);
			if(authed.userName===userName && !user) {
				return false;
			}
			if(user || authed.roles.dbo) {
				if(!password) {
					password = Math.random().toString(36).substr(2,10);
				}
				if(!user) {
					user = await this.getUser(userName);
					if(!user) return;
				}
				Object.assign(user,await hashPassword(password,1000));
				await this.putItem(user);
				return password;
			}
		}
		async createUser(userName,password,extras={}) {
			let user = new User(userName);
			Object.assign(user,await hashPassword(password,1000));
			["hash","salt","password","roles"].forEach((key) => delete extras[key]);
			Object.assign(user,extras);
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			user = await this.putItem(user);
			request.user = authed;
			return user;
		}
		async delete(path) {
			path = ["","e"].concat(Array.isArray(path) ? path : path.split("."));
			const edge = new Edge({db:this,path});
			return edge.delete();
		}
		async deleteUser(userName) {
			const user = await this.getUser(userName);
			if(user) {
				return this.removeItem(user);
			}
			return true;
		}
		async get(key) {
			return (new Edge({db:this})).get(key);
		}
		async getItem(key) {
			const request = this.request,
				user = request.user;
			let data = await this.cache.get(key);
			if(data!=null) {
				const action = "read";
				if(isSoul(data["#"],false)) {
					const key = `${data["#"].split("@")[0]}@`,
						secured = await secure.call(this,{key,action,data,request,user});
					data = secured.data;
				}
				const secured = await secure.call(this,{key,action,data,request,user});
				data = secured.data;
			}
			return data==null ? undefined : data;
		}
		async getSchema(cname) {
			if(this.ctors[cname]) {
				return this.ctors[cname].schema;
			}
		}
		async getUser(userName) {
			return (await this.query({User:{userName}},{limit:1}))[0];
		}
		async index(data,options={},parentPath="",parentId) {
			const type = typeof(data);
			if(data && type==="object") {
				const id = parentId||data["#"];
				if(!parentId) {
					parentPath = `!${toClassName(id)}`;
				}
				if(id) {
					for(const key in data) {
						if(!options.schema || !options.schema[key] || !options.schema[key].noindex) {
							const value = data[key],
							type = typeof(value),
							keypath = `${parentPath}!${key}`;
							this.cache.put("!p"+keypath,1);
							if(value && type==="object") {
								await this.index(value,options,keypath,id);
							} else if(type==="string") {
								if(value.includes(" ")) {
									let count = 0;
									const grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)).map((token) => stemmer(token)));
									for(const gram of grams) {	
										this.cache.put(`!o${keypath}!${gram}!${id}`,1,options)	
									}
								}
								if(value.length<=64) {
									const valuekey = `${JSON.stringify(value)}`;
									this.cache.put(`!v${keypath}!${valuekey}`,1);
									this.cache.put(`!o${keypath}!${valuekey}!${id}`,1,options);
								}
							} else {
								const valuekey = `${JSON.stringify(value)}`;
								this.cache.put(`!v${keypath}!${valuekey}`,1);
								this.cache.put(`!o${keypath}!${valuekey}!${id}`,1,options);
							}
						}
					}
				}
			}
		}
		async put(data,options={}) {
			const edge = new Edge({db:this});
			//for(const key in data) {
			//	await (await edge.get(key)).put(data[key],options);
			//}
			edge.put(data);
		}
		async putItem(object,options={}) {
			const request = this.request,
				user = request.user,
				patch = options.patch;
			if(!object || typeof(object)!=="object") {
				const error = new Error();
				error.errors = [new Error(`Attempt to put a non-object: ${object}`)];
				return error;
			}
			object = Object.assign({},object);
			let id = object["#"];
			if(!id) {
				id = object["#"]  = `${object.constructor.name}@${uid()}`;
			}
			const cname = toClassName(id),
				key =`${cname}@`;
			await on.call(this,{key,when:"before",action:"write",data:object,request,user});
			let schema = await this.getSchema(cname);
			if(schema) {
				options.schema = schema = new Schema(cname,schema);
				const errors = await schema.validate(object,this);
				if(errors.length>0) {
					const error = new Error();
					error.errors = errors;
					return error;
				}
			}
			let original,
				{data,removed} = await secure.call(this,{key,action:"write",data:object,request,user});
			if(data) {
				original = await this.getItem(id);
				data = await this.setItem(id,data,options,true);
			}
			if(!data) {
				const error = new Error();
				error.errors = [new Error(`Denied 'set' for ${id}`)];
				return error;
			}
			const matches = when.reduce((accum,item) => {
				if(joqular.matches(item.when,object)) {
					accum.push(item);
				}
				return accum;
			},[]);
			for(const match of matches) {
				if(match.transform) {
					data = await match.transform.call(this,{data,pattern:match.when,request,user});
				}
			}
			let changes;
			if(original) {
				if(removed) {
					removed.forEach((key) => {
						if(original[key]!==undefined) {
							try {
								data[key] = original[key];
							} catch(e) {
								;
							}
						}
					});
				}
				for(const property of Object.keys(original)) {
					const value = data[property],
						oldValue = original[property];
					if(value!==oldValue) {
						// need to add code to unindex the changes from original
						// update({user,data,property,value,oldValue,request})
						changes || (changes = {});
						changes[property] = oldValue;
					}
				}
				if(changes) {
					changes["#"] = data["#"];
					await on.call(this,{key:id,when:"before",action:"update",data,changes,request,user});
					await this.unindex(changes);
				}
			}
			await this.index(data,options);
			const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
			if(changes) {
				await on.call(this,{key:id,when:"after",action:"update",data:frozen,changes,request,user});
			}
			await on.call(this,{key:id,when:"after",action:"write",data:frozen,request,user});
			for(const match of matches) {
				if(match.call) {
					await match.call(this,data,match.when);
				}
			}
			return data;
		}
		async query(pattern,{partial,filter,limit}={}) {
			let results = [];
			for(const cname in pattern) {
				if(cname==="_") {
					for(const cname of ["Object"].concat(Object.keys(this.ctors))) {
						results = results.concat(await this.queryAux(pattern["_"],{partial,filter,limit:limit-results.length},`!${cname}`,cname))
					}
				} else {
					for(const cname in pattern) {
						results = results.concat(await this.queryAux(pattern[cname],{partial,filter,limit:limit-results.length},`!${cname}`,cname))
					}
				}
			}
			return results;
		}
		async queryAux(pattern,{partial,filter,limit}={},parentPath="",cname,recursing) {
			let ids,
				count = 0,
				results = [],
				keys,
				top;
			//"!p!edge" p = property index
			//'!p!edge!edge
			//'!v!edge!"\value\" v = value index
			//"!o!edge!"\value\"!id o = object index
			const request = this.request,
				user = request.user;
			for(const key in pattern) {
				const keytest = joqular.toTest(key,true,{cname,parentPath,property:key}),
					value = pattern[key],
					type = typeof(value);
				if(keytest) { // if key can be converted to a test, assemble matching keys
					keys = [];
					const edges = await this.cache.keys(`!p${parentPath}!`);
					for(const edge of edges) {
						const [_0,_1,_2,key] = edge.split("!"); // should be based on parentPath
						if(keytest(key)) {
							keys.push(key)
						}
					}
					if(keys.length===0) {
						return [];
					}
				} else { // else key list is just the literal key
					keys = [key];
				}
				for(const key of keys) {
					const keypath = `${parentPath}!${key}`,
						securepath = keypath.replace(/\!/g,".").substring(1);
					if(value && type==="object") {
						const valuecopy = Object.assign({},value);
						let predicates;
						for(let [predicate,pvalue] of Object.entries(value)) {
							if(predicate==="$return") continue;
							const test = joqular.toTest(predicate);
							if(predicate==="$search") {
								predicates = true;
								const value = Array.isArray(pvalue) ? pvalue[0] : pvalue,
									grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)).map((token) => stemmer(token))),
									matchlevel = Array.isArray(pvalue) && pvalue[1] ? pvalue[1] * grams.length : .8;
								let testids = {}, count = 0;
								for(const gram of grams) {
									count++;
									const gkeys = await this.cache.keys(`!o${keypath}!${gram}!`);
									for(const gkey of gkeys) {
										const id = gkey.substring(gkey.lastIndexOf("!")+1);
										if(!filter || filter(id)) {
											if(testids[id]) {
												testids[id].sum++;
												testids[id].avg = testids[id].sum / count;
											} else {
												const {data,removed} = await secure.call(this,{key:`${toClassName(id)}@`,action:"read",data:{[key]:value},request,user});
												if(data && removed.length===0) {
													testids[id] = {sum:1};
											    } else {
											    	testids[id] = {sum:-Infinity};
											    }
											}
										}
									}
								}
								if(!ids) {
									ids = {};
									count = 0;
									for(const id in testids) {
										if(testids[id].avg>=matchlevel) {
											ids[id] = true;
											count++;
										}
									}
									if(count===0) {
										return [];
									}
								} else {
									for(const id in ids) {
										if(!testids[id] || testids[id].avg<=matchlevel) { //  !secured[id] && 
											delete ids[id];
											count--;
											if(count<=0) {
												return [];
											}
										}
									}
								}
							} else if(test) {
								predicates = true;
								const ptype = typeof(pvalue);
								if(ptype==="string") {
									if(pvalue.startsWith("Date@")) {
										pvalue = new Date(parseInt(pvalue.split("@")[1]));
									}
								}
								delete valuecopy[predicate];
								const secured = {},
									testids = {},
									keys = await this.cache.keys(`!v${keypath}!`); // all the values for a key
								if(keys.length===0) {
									this.cache.delete(`!p${keypath}`); // clean-up index, there are no values for property
									return [];
								}
								for(const key of keys) {
									const parts = key.split("!"), // offset should be based on parentPath length, not end
										rawvalue =  parts.pop(), 
										value = fromSerializable(JSON.parse(rawvalue),this.ctors);
									parts[1] = "o";
									const path = parts.join("!");
									if(await test.call(this,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
										const keys = await this.cache.keys(`${path}!${rawvalue}!`);
										for(const key of keys) {
											const id = key.substring(key.lastIndexOf("!")+1);
											if(!filter || filter(id)) {
												const {data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value},request,user});
												if(data && removed.length===0) {
													testids[id] = true;
											    }
											}
										}
									}
								}
								if(!ids) {
									ids = Object.assign({},testids);
									count = Object.keys(ids).length;
									if(count===0) {
										return [];
									}
								} else {
									for(const id in ids) {
										if(!secured[id] && !testids[id]) { //  
											delete ids[id];
											count--;
											if(count<=0) {
												return [];
											}
										}
									}
								}
							}
						} 
						if(!predicates){ // matching a nested object
							const childids = await this.queryAux(value,{partial},keypath,cname,true);
							if(childids.length===0) {
								return [];
							}
							if(!ids) {
								ids = Object.assign({},childids);
								count = Object.keys(ids).length;
								if(count===0) {
									return [];
								}
							} else {
								for(const id in ids) {
									if(!childids[id]) { //  
										delete ids[id];
										count--;
										if(count<=0) {
											return [];
										}
									}
								}
							}
						}
					} else {
						const valuekey = JSON.stringify(value),
							secured = {},
							testids = {}, 
							keys = await this.cache.keys(`!o${keypath}!${valuekey}!`);
						if(keys.length===0) {
							this.cache.delete(`!v${keypath}!${valuekey}`); // clean-up index, there are no objects with value
							return [];
						}
						for(const key of keys) {
							const id = key.substring(key.lastIndexOf("!")+1);
							if(!filter ||filter(id)) {
								const {data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value},request,user});
								if(data && removed!==data && removed.length===0) {
									testids[id] = true;
							    }
							}
						}
						if(!ids) {
							ids = Object.assign({},testids);
							count = Object.keys(ids).length;
							if(count===0) {
								return [];
							}
						} else {
							for(const id in ids) {
								if(!secured[id] && !testids[id]) { // 
									ids[id] = null;
									count--;
									if(count<=0) {
										return [];
									}
								}
							}
						}
					}
				}
			}
			if(ids) {
				if(!recursing) {
					for(const id in ids) {
						if(id) {
							const object = await this.getItem(id);
							if(object && (!filter || filter(object))) {
								if(partial) {
									for(const key in object) {
										if(pattern[key]===undefined && key!=="#" && key!=="^") {
											delete object[key];
										}
									}
								}
								results.push(object);
								if(limit && results.length>=limit) {
									break;
								}
							}
						}
					}
					return results;
				}
				return ids;
			}
			return [];
		}
		register(ctor) {
			if(ctor.name && ctor.name!=="anonymous") {
				this.ctors[ctor.name] = ctor;
			}
		}
		async remove(path,data) {
			const edge = await this.get(path);
			return await edge.remove(data);
		}
		async removeItem(keyOrObject) {
			const type = typeof(keyOrObject),
				request = this.request,
				user = request.user;
			if(keyOrObject && type==="object") {
				keyOrObject = keyOrObject["#"];
			}
			if(keyOrObject) {
				const value = await this.getItem(keyOrObject);
				if(value===undefined) {
					return true;
				}
				const action = "write",
					key = isSoul(keyOrObject) ? `${keyOrObject.split("@")[0]}@` : null;
				if(key) {
					if(!(await on.call(this,{key,when:"before",action:"remove",data:value,object:value,request,user}))) {
						return false;
					}
				}
				if(!(await on.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,object:value,request,user}))) {
					return false;
				}
				const {data,removed} = await secure.call(this,{key:keyOrObject,action,data:value,documentOnly:true,request,user});
				if(data && removed.length===0) {
					await this.cache.delete(keyOrObject);
					const frozen = value && typeof(value)==="object" ? Object.freeze(value) : value;
					if(key) {
						await this.unindex(value);
						await on.call(this,{key,when:"after",action:"remove",data:frozen,request,user});
					}
					await on.call(this,{key:keyOrObject,when:"after",action:"remove",data:frozen,request,user});
					return true;
				}
			}
			return false;
		}
		async removeRoles(userName,roles=[]) {
			if(roles.length>=0) {
				const user = await this.getUser(userName);
				if(user) {
					user.roles || (user.roles={});
					roles.forEach((role) => delete user.roles[role]);
					return this.putItem(user,{patch:true});
				}
			}
		}
		async resetPassword(userName,method="email") {
			
		}
		async sendMail(config) {
			const email = this.request.user.email;
			if(!email) {
				return;
			}
			config.from = email;
			return sendMail(config);
		}
		async setItem(key,data,options={},secured) {
			const request = this.request,
				user = request.user,
				action = "write";
			if(!secured && key[0]!=="!") {
				await on.call(this,{key,when:"before",action,data,request,user});
				const secured = await secure.call(this,{key,action,data,request,user});
				if(secured.removed===data || secured.removed.length>0) {
					return;
				}
				data = secured.data;
				if(data && typeof(data)==="object") {
					const key = isSoul(data["#"],false) ? data["#"].split("@")[0] : "Object",
						secured = await secure.call(this,{key,action,data,request,user});
					data = secured.data;
				}
			}
			if(data!==undefined) {
				await this.cache.put(key,data,options);
				const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
				await on.call(this,{key,when:"after",action,data:frozen,request,user});
			}
			return data;
		}
		async updateUser(userName,properties={}) {
			const authed = this.request.user;
			let user = await this.authUser(userName,oldPassword);
			if(authed.userName===userName && !user) {
				return false;
			}
			["hash","salt","password","roles"].forEach((key) => delete properties[key]);
			user = await this.getUser(userName);
			Object.assign(user,properties);
			await this.putItem(user);
			return user;
		}
		async unindex(object,parentPath="",parentId) {
			const id = parentId||object["#"];
			if(!parentId) {
				parentPath = `!${toClassName(id)}`;
			}
			if(object && typeof(object)==="object" && id) {
				for(const key in object) {
					if(key==="#") {
						continue;
					}
					const value = object[key],
						keypath = `${parentPath}!${key}`;
					if(value && typeof(value)==="object") {
						if(value["#"]) {
							await this.unindex(value);
						}
						await this.unindex(value,keyPath,id);
					} else {
						if(type==="string") {
							if(value.includes(" ")) {
								let count = 0;
								const grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)).map((token) => stemmer(token)));
								for(const gram of grams) {
									this.cache.delete(`!o${keypath}!${gram}!${id}`,1)	
								}
							}
							if(value.length<64) {
								this.cache.delete(`!o${keypath}!${JSON.stringify(value)}!${id}`);
							}
						} else {
							this.cache.delete(`!o${keypath}!${JSON.stringify(value)}!${id}`);
						}
					}
				}
			}
		}
		async unique(id,property,value) {
			const parts = id.split("@"),
				cname = parts[0];
			if(parts.length===1) {
				const results = await this.query({[cname]:{[property]:value}});
				return results.length===0
			}
			const results = await this.query({[cname]:{[property]:value}});
			return results.length===0 || (results.length===1 && results[0]["#"]===id);
		}
		async value(path,data,options={}) {
			path = Array.isArray(path) ? path : path.split(".");
			const edge = await (new Edge({db:this})).get(path);
			return arguments.length>1 ? edge.value(data,options) : edge.value();
		}
	}
	// add developer defined functions to Thunderhead
	const predefined = Object.keys(Object.getOwnPropertyDescriptors(Thunderhead.prototype));
	Object.keys(functions).forEach((fname) => {
		if(!predefined.includes(fname)) {
			const f = async (...args) => functions[fname].call(this,...args);
			Object.defineProperty(Thunderhead.prototype,fname,{configurable:true,value:f})
		}
	});
	module.exports = Thunderhead;
}).call(this);