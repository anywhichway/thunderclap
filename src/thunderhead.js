(function() {
	const uid = require("./uid.js"),
		isSoul = require("./is-soul.js"),
		joqular = require("./joqular.js"),
		hashPassword = require("./hash-password.js"),
		secure = require("./secure.js"),
		respond = require("./respond.js")("cloud"),
		User = require("./user.js"),
		Schema = require("./schema.js"),
		when = require("../when.js").cloud,
		functions = require("../functions.js").cloud,
		keys = require("../keys.js");
	
	const hexStringToUint8Array = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

	class Thunderhead {
		constructor({namespace,request,dbo}) {
			this.ctors = {};
			this.request = request;
			this.namespace = namespace;
			this.dbo = dbo;
			this.register(Array);
			this.register(Date);
			this.register(URL);
			this.register(User);
			this.register(Schema);
			require("./cloudflare-kv-extensions")(this);
			//Object.defineProperty(this,"keys",{configurable:true,writable:true,value:keys});
			
		}
		async authUser(userName,password) {
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			//return this.dbo;
			const user = (await this.query({userName},false))[0];
			request.user = authed;
			if(user && user.salt && user.hash===(await hashPassword(password,1000,hexStringToUint8Array(user.salt))).hash) {
				secure.mapRoles(user);
				return user;
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
		async get(key) {
			return this.getItem(key);
		}
		async getItem(key) {
			let data = await this.namespace.get(key);
			if(data) {
				data = JSON.parse(data);
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
			let data = await this.namespace.get(`Schema@${ctor.name||ctor}`);
			if(data) {
				data = JSON.parse(data);
				const secured = await secure.call(this,{key:"Schema",action:"read",data});
				if(secured.data) {
					return new Schema(ctor.name||ctor,data);
				}
			}
		}
		async index(data,root,options={},recursing) {
			let rootchanged;
			if(data && typeof(data)==="object" && data["#"]) {
				const id = data["#"];
				for(const key in data) {
					if(key!=="#" && (!options.schema || !options.schema[key] || !options.schema[key].noindex)) {
						const value = data[key],
							type = typeof(value);
						if(value && type==="object") {
							rootchanged += await this.index(value,root,options,true);
						} else {
							const valuekey = `${JSON.stringify(value)}`;
							const keypath = `!${key}`;
							if(!root[key]) {
								rootchanged = root[key] = 1;
							}
							let node = await this.namespace.get(keypath);
							if(!node) {
								node = {};
							} else {
								node = JSON.parse(node);
							}
							if(!node[valuekey]) {
								node[valuekey] = 1;
								await this.namespace.put(keypath,JSON.stringify(node));
							}
							
							//await this.namespace.put(`${keypath}!${valuekey}!${id}`,"1");
							 
							const valuepath = `${keypath}!${valuekey}`;
							node = await this.namespace.get(valuepath);
							if(!node) {
								node = {};
							} else {
								node = JSON.parse(node);
							}
							if(!node[id]) {
								node[id] = 1;
								await this.namespace.put(valuepath,JSON.stringify(node))
							}
						}
					}
				}
			}
			return !!rootchanged;
		}
		async put(key,value) {
			return this.put(key,value);
		}
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
			let root = await this.namespace.get("!");
			if(!root) {
				root = {};
			} else {
				root = JSON.parse(root);
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
				await this.namespace.put("!",JSON.stringify(root));
			}
			data = await this.setItem(id,data,options,true);
			if(data!==undefined) {
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
			}
			return data;
		}
		async query(pattern,partial,options={}) {
			let ids,
				count = 0,
				results = [],
				keys,
				saveroot;
			//return [{"test":"test"},this.dbo];
			let root = await this.namespace.get("!");
			if(!root) return results;
			root = JSON.parse(root);
			for(const key in pattern) {
				const keytest = joqular.toTest(key,true),
					value = pattern[key],
					type = typeof(value);
				if(keytest) { // if key can be converted to a test, assemble matching keys
					keys = Object.keys(root).filter((key) => keytest(key));
				} else { // else key list is just the literal key
					keys = [key];
				}
				for(const key of keys) {
					if(root[key]) {
						const keypath = `!${key}`;
						let keynode = await this.namespace.get(keypath);
						if(!keynode) {
							delete root[key];
							saveroot = true;
							continue;
						}
						keynode = JSON.parse(keynode);
						if(value && type==="object") {
							const valuecopy = Object.assign({},value);
							for(let [predicate,pvalue] of Object.entries(value)) {
								if(predicate==="$return") continue;
								const test = joqular.toTest(predicate);
								if(predicate==="$search") {

								} else if(test) {
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
									for(const valuekey in keynode) {
										haskeys = true;
										let value = JSON.parse(valuekey);
										if(typeof(value)==="string" && value.startsWith("Date@")) {
											value = new Date(parseInt(value.split("@")[1]));
										}
										if(await test.call(keynode,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
											// disallow index use by unauthorized users at document && property level
											const valuepath = `${keypath}!${valuekey}`,
												//valuenode = {},
												len = valuepath.length;
											let valuenode = {}, keys, cursor, haskeys;
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
											valuenode = await this.namespace.get(valuepath);
											if(!valuenode) {
												delete keynode[valuekey];
												await this.namespace.put(keypath,JSON.stringify(keynode));
												continue;
											}
											valuenode = JSON.parse(valuenode);
											for(const id in valuenode) {
												haskeys = true;
												const cname = id.split("@")[0],
													{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
												if(data==null || removed.length>0) {
													delete valuenode[id];
													secured[id] = true;
												}
											}
											if(haskeys) {
												Object.assign(testids,valuenode);
											} else {
												this.namespace.delete(valuepath);
											}
										}
									}
									if(!haskeys) {
										delete root[key];
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
						} else {
							const valuekey = JSON.stringify(value);
							if(keynode[valuekey]) {
								// disallow index use by unauthorized users at document && property level
								const secured = {},
									valuepath = `${keypath}!${valuekey}`,
								 	// valuenode = {},
									len = valuepath.length;
								let keys, cursor, haskeys;
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
								let valuenode = await this.namespace.get(valuepath);
								if(!valuenode) {
									delete keynode[valuekey];
									await this.namespace.put(keypath,JSON.stringify(keynode));
									return;
								}
								valuenode = JSON.parse(valuenode);
								for(const id in valuenode) {
									haskeys = true;
									const cname = id.split("@")[0],
										{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
									if(data==null || removed.length>0) {
										delete valuenode[id];
										secured[id] = true;
									}
								}
								if(!haskeys) {
									return [];
								}
								if(!ids) {
									ids = Object.assign({},valuenode);
									count = Object.keys(ids).length;
								} else {
									for(const id in ids) {
										if(!secured[id] && !valuenode[id]) { // 
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
				this.namespace.set("!",JSON.stringify(root));
			}
			if(ids) {
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
						return "bad";
					}
				}
				if(!(await respond.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,object:value}))) {
					return false;
				}
				const {data,removed} = await secure.call(this,{key,action,data:value,documentOnly:true});
				if(data && removed.length===0) {
					await this.namespace.delete(keyOrObject);
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
				await this.namespace.put(key,JSON.stringify(data),options);
				const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
				//await respond.call(this,{key,when:"after",action:"set",data:frozen});
			}
			return data;
		} 
		async unindex(object) {
			if(object && typeof(object)==="object" && object["#"]) {
				const id = object["#"];
				for(const key in object) {
					// just loop through deleting these `${keypath}!${valuekey}!${id}`;
					if(key==="#") {
						continue;
					}
					const value = object[key];
					if(value && typeof(value)==="object") {
						await this.unindex(value);
					} else {
						const valuekey = `${JSON.stringify(value)}`,
							keypath = `!${key}`;
						let keynode = await this.namespace.get(keypath);
						if(keynode) {
							keynode = JSON.parse(keynode);
							if(keynode[valuekey]) {
								const valuepath = `${keypath}!${valuekey}`;
								let valuenode = await this.namespace.get(valuepath);
								if(valuenode) {
									// if we revert to three level index, this needs to be enhanced
									valuenode = JSON.parse(valuenode);
									if(valuenode[id]) {
										delete valuenode[id];
										await this.namespace.put(`${keypath}!${valuekey}`,JSON.stringify(valuenode));
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