(function() {
	/*
	Server Side Public License
	VERSION 1, OCTOBER 16, 2018
	Copyright AnyWhichWay, LLC 2019
	 */
	const uid = require("./uid.js"),
		isSoul = require("./is-soul.js"),
		joqular = require("./joqular.js"),
		hashPassword = require("./hash-password.js"),
		secure = require("./secure.js"),
		//stemmer = require("./stemmer.js"),
		trigrams = require("./trigrams.js"),
		tokenize = require("./tokenize.js"),
		stopwords = require("./stopwords.js"),
		respond = require("./respond.js")("cloud"),
		User = require("./user.js"),
		Schema = require("./schema.js"),
		Position = require("./position.js"),
		Coordinates = require("./coordinates.js"),
		Cache = require("./cache.js"),
		when = require("../when.js").cloud,
		functions = require("../functions.js").cloud,
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
			require("./cloudflare-kv-extensions")(this);
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
				return "fail";
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
		async delete(key,options) {
			return this.removeItem(key,options);
		}
		//async get(key,options) {
			//return this.get(key,options);
		//}
		async getItem(key,options) {
			let data = await this.cache.get(key,options);
			if(data!==null) {
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
		async index(data,root,options={},parentPath="",parentId) {
			const type = typeof(data);
			let rootchanged;
			if(data && type==="object") {
				const id = parentId||data["#"]; // also need to index for # in case nested and id'd
				if(id) {
					for(const key in data) {
						if(key!=="#" && (!options.schema || !options.schema[key] || !options.schema[key].noindex)) {
							const value = data[key],
								type = typeof(value);
							const keypath = `${parentPath}!${key}`;
							if(!root.edges[key]) {
								rootchanged = root.edges[key] = 1;
							}
							let node = await this.cache.get(keypath);
							if(!node) {
								node = {edges:{},trigrams:{},values:{},ids:{}};
							}
							if(value && type==="object") {
								if(await this.index(value,node,{},keypath,id)) {
									this.cache.put(keypath,node)
								}
							} else {
								let longstring,
									newgrams;
								if(type==="string" && value.includes(" ")) {
									let count = 0;
									const grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)));
									for(const gram of grams) {
										if(!node.trigrams[gram]) {
											node.trigrams[gram] = 1;
											newgrams = true;
										}
										const valuepath = `${keypath}!${gram}`;
										let leaf = await this.cache.get(valuepath);
										if(!leaf) {
											leaf = {edges:{},trigrams:{},values:{},ids:{}};
										}
										if(!leaf.ids[id]) {
											leaf.ids[id] = 1;
											this.cache.put(valuepath,leaf);
											newgrams = true;
										}
									}
									if(newgrams) {
										newgrams = this.cache.put(keypath,node);
									}
									if(value.length>64) {
										longstring = true;
									}
								} 
								if(!longstring) { // not an indexed string > 64 char
									const valuekey = `${JSON.stringify(value)}`;
									if(!node.values[valuekey]) {
										node.values[valuekey] = 1;
										if(newgrams) {
											await newgrams;
										}
										this.cache.put(keypath,node);
									}
									
									//await this.namespace.put(`${keypath}!${valuekey}!${id}`,"1");
									 
									const valuepath = `${keypath}!${valuekey}`;
									let leaf = await this.cache.get(valuepath);
									if(!leaf) {
										leaf = {edges:{},trigrams:{},values:{},ids:{}};
									}
									if(!leaf.ids[id]) {
										leaf.ids[id] = 1;
										this.cache.put(valuepath,leaf)
									}
								}
							}
						}
					}
				}
			}
			return !!rootchanged;
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
			let {data,removed} = await secure.call(this,{key,action:"write",data:object});
			if(data) {
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
			let root = await this.cache.get("!");
			if(!root) {
				root = {edges:{},trigrams:{},values:{},ids:{}};
			}
			const original = await this.getItem(id);
			let changes;
			if(original) {
				if(removed) {
					removed.forEach((key) => {
						if(original[key]!==undefined) {
							data[key] = original[key];
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
			const changed = await this.index(data,root,options);
			if(changed) {
				this.cache.put("!",root);
			}
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
				keys,
				saveroot,
				root = await this.cache.get(parentPath||"!");
			if(!root) {
				return [];
			}
			//return [{"test":"test"},this.dbo];
			for(const key in pattern) {
				const keytest = joqular.toTest(key,true),
					value = pattern[key],
					type = typeof(value);
				if(keytest) { // if key can be converted to a test, assemble matching keys
					keys = Object.keys(root.edges).filter((key) => keytest(key));
				} else { // else key list is just the literal key
					keys = [key];
				}
				for(const key of keys) {
					//return [pattern];
					if(root.edges[key]) {
						const keypath = `${parentPath}!${key}`,
							securepath = keypath.replace(/\!/g,".").substring(1);
						let keynode = await this.cache.get(keypath);
						if(!keynode) {
							delete root.edges[key];
							saveroot = true;
							continue;
						}
						//return [keynode]
						if(value && type==="object") {
							const valuecopy = Object.assign({},value);
							let predicates;
							for(let [predicate,pvalue] of Object.entries(value)) {
								if(predicate==="$return") continue;
								const test = joqular.toTest(predicate);
								if(predicate==="$search") {
									predicates = true;
									const value = Array.isArray(pvalue) ? pvalue[0] : pvalue,
										tokens = tokenize(value).filter((token) => !stopwords.includes(token)),
										grams = trigrams(tokens),
										matchlevel = Array.isArray(pvalue) && pvalue[1] ? pvalue[1] * keys.length : .8;
									let testids;
									for(const gram of grams) {
										if(keynode.trigrams[gram]) {
											const valuepath = `${keypath}!${gram}`;
											let leaf = await this.cache.get(valuepath);
											if(leaf) {
												if(!testids) {
													testids = leaf.ids;
												} else {
													for(const id in leaf) {
														if(testids[id]) {
															testids[id] = testids[id] + 1;
														}
													}
												}
											}
										}
									}
									if(testids) {
										ids = {};
										for(const id in testids) {
 											if(testids[id]>=matchlevel) {
 												ids[id] = true;
 											}
										}
									} else {
										return [];
									}
								} else if(test) {
									predicates = true;
									const ptype = typeof(pvalue);
									if(ptype==="string") {
										if(pvalue.startsWith("Date@")) {
											pvalue = new Date(parseInt(pvalue.split("@")[1]));
										}
									}
									let testids = {};
									delete valuecopy[predicate];
									const secured = {};
									let haskeys;
									//return [pattern,predicate,pvalue,keynode]
									for(const valuekey in keynode.values) {
										haskeys = true;
										let value = JSON.parse(valuekey);
										if(typeof(value)==="string" && value.startsWith("Date@")) {
											value = new Date(parseInt(value.split("@")[1]));
										}
										if(await test.call(this,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
											// disallow index use by unauthorized users at document && property level
											const valuepath = `${keypath}!${valuekey}`,
												//valuenode = {},
												len = valuepath.length;
											let valuenode = {}, keys, cursor, haskeys;
											// used for different indexing approach
											/*do {
												keys = await this.keys(valuepath+"!",{cursor});
												cursor = keys.pop();
												for(const key of keys) {
													const id = key.substring(len),
														cname = id.split("@")[0],
														{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
													if(data && removed.length===0) {
														valuenode[id] = true;
											 			haskeys = true;
												    }
												}
											} while(keys.length>0 && cursor);*/
											valuenode = await this.cache.get(valuepath);
											if(!valuenode) {
												delete keynode.values[valuekey];
												this.cache.put(keypath,keynode);
												continue;
											}
											for(const id in valuenode.ids) {
												haskeys = true;
												const cname = id.split("@")[0],
													{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[securepath]:value}});
												if(data==null || removed.length>0) {
													delete valuenode.id[id];
													secured[id] = true;
												}
											}
											if(haskeys) {
												Object.assign(testids,valuenode.ids);
											} else {
												this.cache.delete(valuepath);
											}
										}
									}
									if(!haskeys) {
										delete root.edges[key];
										saveroot = true;
										break;
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
							const valuekey = JSON.stringify(value);
							if(keynode.values[valuekey]) {
								// disallow index use by unauthorized users at document && property level
								const secured = {},
									valuepath = `${keypath}!${valuekey}`,
								 	// valuenode = {},
									len = valuepath.length;
								let keys, cursor, haskeys;
								// used for different indexing approach
								/*do {
									keys = await this.keys(valuepath+"!",{cursor});
									cursor = keys.pop();
									for(const key of keys) {
										const id = key.substring(len),
											cname = id.split("@")[0],
											{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
										if(data && removed.length===0) {
											valuenode[id] = true;
								 			haskeys = true;
									    }
									}
									break;
								} while(keys.length>0 && cursor);*/
								let valuenode = await this.cache.get(valuepath);
								if(!valuenode) {
									delete keynode.values[valuekey];
									this.cache.put(keypath,keynode);
									return;
								}
								for(const id in valuenode.ids) {
									haskeys = true;
									const cname = id.split("@")[0],
										{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[securepath]:value}});
									if(data==null || removed.length>0) {
										delete valuenode.ids[id];
										secured[id] = true;
									}
								}
								if(!haskeys) {
									return [];
								}
								if(!ids) {
									ids = Object.assign({},valuenode.ids);
									count = Object.keys(ids).length;
								} else {
									for(const id in ids) {
										if(!secured[id] && !valuenode.ids[id]) { // 
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
				}
			}
			if(saveroot) {
				this.cache.set("!",JSON.stringify(root));
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
		async removeItem(keyOrObject,options) {
			const type = typeof(keyOrObject);
			if(keyOrObject && type==="object") {
				keyOrObject = keyOrObject["#"];
			}
			if(keyOrObject) {
				const value = await this.getItem(keyOrObject,options);
				if(value===undefined) {
					return true;
				}
				const action = "write",
					key = isSoul(keyOrObject) ? `${keyOrObject.split("@")[0]}@` : null;
				if(key) {
					if(!(await respond.call(this,{key,when:"before",action:"remove",data:value,object:value}))) {
						return "bad";
					}
				}
				if(!(await respond.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,object:value}))) {
					return false;
				}
				const {data,removed} = await secure.call(this,{key,action,data:value,documentOnly:true});
				if(data && removed.length===0) {
					await this.cache.delete(keyOrObject,options);
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
				this.cache.put(key,data,options);
				const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
				//await respond.call(this,{key,when:"after",action:"set",data:frozen});
			}
			return data;
		} 
		async unindex(object,parentPath="",parentId) {
			// need to enhance to unindex full-text
			const id = parentId||object["#"];
			if(object && typeof(object)==="object" && id) {
				for(const key in object) {
					// just loop through deleting these `${keypath}!${valuekey}!${id}`;
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
						const valuekey = `${JSON.stringify(value)}`;
						let keynode = await this.cache.get(keypath);
						if(keynode) {
							if(keynode[valuekey]) {
								const valuepath = `${keypath}!${valuekey}`;
								let leaf = await this.cache.get(valuepath);
								if(leaf) {
									// if we revert to three level index, this needs to be enhanced
									if(leaf.ids[parentId]) {
										delete leaf.ids[parentId];
										this.cache.put(valuepath,leaf);
									}
								}
							}
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