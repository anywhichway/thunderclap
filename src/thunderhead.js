(function() {
	/*
	Server Side Public License
	VERSION 1, OCTOBER 16, 2018
	Copyright AnyWhichWay, LLC 2019
	 */
	"use strict"
	const uid = require("./uid.js"),
		isSoul = require("./is-soul.js"),
		joqular = require("./joqular.js"),
		hashPassword = require("./hash-password.js"),
		secure = require("./secure.js"),
		trigrams = require("./trigrams.js"),
		tokenize = require("./tokenize.js"),
		stopwords = require("./stopwords.js"),
		stemmer = require("./stemmer.js"),
		respond = require("./respond.js")("cloud"),
		fromSerializable = require("./from-serializable.js"),
		User = require("./user.js"),
		Schema = require("./schema.js"),
		Position = require("./position.js"),
		Coordinates = require("./coordinates.js"),
		Cache = require("./cache.js"),
		when = require("../when.js").cloud,
		functions = require("../functions.js").cloud,
		classes = require("../classes.js"),
		keys = require("../keys.js");
	
	
	const hexStringToUint8Array = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

	class Thunderhead {
		constructor({namespace,request,dbo,refresh=5000}) {
			this.ctors = {};
			this.request = request;
			//this.namespace = namespace;
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
			},refresh)
			//Object.defineProperty(this,"keys",{configurable:true,writable:true,value:keys});
		}
		async authUser(userName,password) {
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			return this.dbo;
			const user = (await this.query({userName},false))[0];
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
					user = (await this.query({userName},false))[0];
					if(!user) return;
				}
				Object.assign(user,await hashPassword(password,1000));
				await this.putItem(user);
				return password;
			}
		}
		async createUser(userName,password) {
			let user = new User(userName);
			Object.assign(user,await hashPassword(password,1000));
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			user = await this.putItem(user);
			request.user = authed;
			return user;
		}
		async delete(key) {
			return this.removeItem(key);
		}
		//async get(key,options) {
			//return this.get(key,options);
		//}
		async getItem(key) {
			let data = await this.cache.get(key);
			if(data!=null) {
				const action = "read";
				if(isSoul(data["#"],false)) {
					const key = `${data["#"].split("@")[0]}@`,
						secured = await secure.call(this,{key,action,data});
					data = secured.data;
				}
				const secured = await secure.call(this,{key,action,data});
				data = secured.data;
			}
			return data==null ? undefined : data;
		}
		async getSchema(ctor) {
			let data = await this.cache.get(`Schema@${ctor.name||ctor}`);
			if(data) {
				const secured = await secure.call(this,{key:"Schema",action:"read",data});
				if(secured.data) {
					return new Schema(ctor.name||ctor,data);
				}
			}
		}
		async index(data,options={},parentPath="",parentId) {
			const type = typeof(data);
			if(data && type==="object") {
				const id = parentId||data["#"]; // also need to index for # in case nested and id'd
				if(id) {
					for(const key in data) {
						if(key!=="#" && (!options.schema || !options.schema[key] || !options.schema[key].noindex)) {
							const value = data[key],
								type = typeof(value);
							const keypath = `${parentPath}!${key}`;
							this.cache.put("!p"+keypath,1);
							let node;
							if(value && type==="object") {
								await this.index(value,options,keypath,id);
							} else {
								if(type==="string") {
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
		}
		//async put(key,value) {
		//	return this.put(key,value);
		//}
		async putItem(object,options={}) {
			if(!object || typeof(object)!=="object") {
				const error = new Error();
				error.errors = [new Error(`Attempt to put a non-object: ${object}`)];
				return error;
			}
			let id = object["#"];
			if(!id) {
				id = object["#"]  = `${object.constructor.name}@${uid()}`;
			}
			const cname = id.split("@")[0],
				key =`${cname}@`;
			await respond.call(this,{key,when:"before",action:"put",data:object});
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
				{data,removed} = await secure.call(this,{key,action:"write",data:object});
			if(data) {
				original = await this.getItem(id);
				data = await this.setItem(id,data,options,true);
			}
			if(!data) {
				const error = new Error();
				error.errors = [new Error(`Denied 'write' for ${id}`)];
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
					data = await match.transform.call(this,data,match.when);
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
					await respond.call(this,{key:id,when:"before",action:"update",data,changes});
				}
			}
			
			await this.index(data,options);
			const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
			if(changes) {
				await respond.call(this,{key:id,when:"after",action:"update",data:frozen,changes});
			}
			await respond.call(this,{key:id,when:"after",action:"put",data:frozen});
			for(const match of matches) {
				if(match.call) {
					await match.call(this,data,match.when);
				}
			}
			return data;
		}
		async query(pattern,partial,options={},parentPath="") {
			let ids,
				count = 0,
				results = [],
				keys;
			//"!p!edge"
			//'!p!edge!edge
			//'!t!edge!trigram|id
			//"!o!edge!"\value\"!id
			for(const key in pattern) {
				const keytest = joqular.toTest(key,true),
					value = pattern[key],
					type = typeof(value);
				if(keytest) { // if key can be converted to a test, assemble matching keys
					keys = [];
					const edges = await this.cache.keys(`!p${parentPath}!`);
					for(const edge of edges) {
						const [_1,_2,key] = edge.split("!"); // should be based on parentPath
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
										const id = gkey.split("!").pop();
										if(testids[id]) {
											testids[id].sum++;
											testids[id].avg = testids[id].sum / count;
										} else {
											const cname = id.split("@")[0],
												{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
											if(data && removed.length===0) {
												testids[id] = {sum:1};
										    } else {
										    	testids[id] = {sum:-Infinity};
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
									keys = await this.cache.keys(`!v${keypath}!`);
								if(keys.length===0) {
									await this.cache.delete(`!p${keypath}`);
									return [];
								}
								for(const key of keys) {
									const parts = key.split("!"), // offset should be based on parentPath length, not end
										rawvalue = parts.pop(),
										value = fromSerializable(JSON.parse(rawvalue),this.ctors);
									if(await test.call(this,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
										const keys = await this.cache.keys(`!o${keypath}!${rawvalue}`);
										for(const key of keys) {
											const parts = key.split("!"),
												id = parts.pop(),
												cname = id.split("@")[0],
												{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
											if(data && removed.length===0) {
												testids[id] = true;
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
							const childids = await this.query(value,partial,options,keypath);
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
							valuepath = `${keypath}!${valuekey}`,
							objectpath = `!o${valuepath}!`,
							testids = {}, 
							keys = await this.cache.keys(objectpath);
						if(keys.length===0) {
							await this.cache.delete(`!v${keypath}!${valuekey}`); // should we actually do this?
							return [];
						}
						for(const key of keys) {
							const id = key.split("!").pop(),
								cname = id.split("@")[0],
								{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
							if(data && removed.length===0) {
								testids[id] = true;
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
			}
			if(ids) {
				if(parentPath) {
					return ids;
				}
				for(const id in ids) {
					const object = await this.getItem(id,options);
					if(object) {
						if(partial) {
							for(const key in object) {
								if(pattern[key]===undefined && key!=="#" && key!=="^") {
									delete object[key];
								}
							}
						}
						results.push(object);
					}
				}
			}
			return results;
		}
		register(ctor) {
			if(ctor.name && ctor.name!=="anonymous") {
				this.ctors[ctor.name] = ctor;
			}
		}
		async removeItem(keyOrObject) {
			const type = typeof(keyOrObject);
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
					if(!(await respond.call(this,{key,when:"before",action:"remove",data:value,object:value}))) {
						return false;
					}
				}
				if(!(await respond.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,object:value}))) {
					return false;
				}
				const {data,removed} = await secure.call(this,{key,action,data:value,documentOnly:true});
				if(data && removed.length===0) {
					await this.cache.delete(keyOrObject);
					const frozen = value && typeof(value)==="object" ? Object.freeze(value) : value;
					if(key) {
						await this.unindex(value);
						await respond.call(this,{key,when:"after",action:"remove",data:frozen});
					}
					await respond.call(this,{key:keyOrObject,when:"after",action:"remove",data:frozen});
					return true;
				}
			}
			return false;
		}
		async setItem(key,data,options={},secured) {
			if(!secured && key[0]!=="!") {
				const action = "write";
				await respond.call(this,{key,when:"before",action:"set",data});
				const secured = await secure.call(this,{key,action,data});
				data = secured.data;
				if(data && typeof(data)==="object") {
					const key = isSoul(data["#"],false) ? data["#"].split("@")[0] : "Object",
						secured = await secure.call(this,{key,action,data});
					data = secured.data;
				}
			}
			if(data!==undefined) {
				await this.cache.put(key,data,options);
				const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
				//await respond.call(this,{key,when:"after",action:"set",data:frozen});
			}
			return data;
		} 
		async unindex(object,parentPath="",parentId) {
			const id = parentId||object["#"];
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
								const valuekey = `${JSON.stringify(value)}`;
								this.cache.delete(`!o${keypath}!${valuekey}!${id}`);
							}
						} else {
							const valuekey = `${JSON.stringify(value)}`;
							this.cache.delete(`!o${keypath}!${valuekey}!${id}`);
						}
					}
				}
			}
		}
	}
	const predefined = Object.keys(Object.getOwnPropertyDescriptors(Thunderhead.prototype));
	Object.keys(functions).forEach((fname) => {
		if(!predefined.includes(fname)) {
			const f = async (...args) => functions[fname].call(this,...args);
			Object.defineProperty(Thunderhead.prototype,fname,{configurable:true,value:f})
		}
	});
	module.exports = Thunderhead;
}).call(this);