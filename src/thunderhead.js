(function() {
	const uuid4 = require("./uuid4.js"),
		isSoul = require("./is-soul.js"),
		joqular = require("./joqular.js"),
		hashPassword = require("./hash-password.js"),
		secure = require("./secure.js"),
		respond = require("./respond.js"),
		functions = require("../functions.js"),
		User = require("./user.js"),
		Schema = require("./schema.js");
	
	const hexStringToUint8Array = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

	class Thunderhead {
		constructor({namespace,request,dbo}) {
			this.ctors = {};
			this.request = request;
			this.namespace = namespace;
			this.dbo = dbo;
			this.register(Object);
			this.register(Array);
			this.register(Date);
			this.register(URL);
			this.register(User);
			this.register(Schema);
		}
		async authUser(userName,password,options) {
			const user = (await this.query({userName},false,options))[0];
			if(user && user.salt && user.hash===(await hashPassword(password,1000,hexStringToUint8Array(user.salt))).hash) {
				secure.mapRoles(user);
				return user;
			}
		}
		async createUser(userName,password,options={}) {
			const user = new User(userName);
			Object.assign(user,await hashPassword(password,1000));
			return this.putItem(user,options);
		}
		async getItem(key,{user}={}) {
			let data = await this.namespace.get(key);
			if(data) {
				data = JSON.parse(data);
				if(key[0]!=="!") {
					const action = "read",
						request = this.request;
					if(isSoul(data["#"],false)) {
						const key = `${data["#"].split("@")[0]}@`,
							secured = await secure({key,action,user,data,request});
						data = secured.data;
					}
					const secured = await secure({key,action,user,data,request});
					data = secured.data;
				}
			}
			return data==null ? undefined : data;
		}
		async getSchema(ctor,options) {
			const data = await this.namespace.get(`Schema@${ctor.name||ctor}`);
			if(data) {
				return new Schema(ctor.name||ctor,JSON.parse(data));
			}
		}
		async index(data,root,options={},recursing) {
			let changed = 0;
			if(data && typeof(data)==="object" && data["#"]) {
				const id = data["#"];
				for(const key in data) {
					if(!options.schema || !options.schema[key] || !options.schema[key].noindex) {
						const value = data[key],
							type = typeof(value);
						if(value && type==="object") {
							changed += await this.index(value,root,options,true);
						} else {
							const valuekey = `${JSON.stringify(value)}`,
								path = `!${key}`;
							if(!root[key]) {
								root[key] = true;
								changed++;
							}
							let node = await this.getItem(path,options);
							if(!node) {
								changed++;
								node = {};
							}
							node[valuekey] || (node[valuekey] = {}); // __keyCount__:0
							if(!node[valuekey][id]) {
								node[valuekey][id] = true;
								//node[valuekey].__keyCount__++;
								await this.setItem(path,node,options);
							}
						}
					}
				}
			}
			return changed;
		}
		async keys(lastKey) {
			return this.namespace.getKeys(lastKey)
		}
		async putItem(object,options={}) {
			if(!object || typeof(object)!=="object") {
				const error = new Error();
				error.errors = [new Error(`Attempt to put a non-object: ${object}`)];
				return error;
			}
			let id = object["#"];
			if(!id) {
				id = object["#"]  = `${object.constructor.name}@${uuid4()}`;
			}
			const cname = id.split("@")[0],
				key =`${cname}@`,
				user = options.user,
				request = this.request;
			await respond.call(this,{key,when:"before",action:"put",data:object,user,request});
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
			const {data,removed} = await secure.call(this,{key,action:"write",user,data:object,request});
			if(!data) {
				const error = new Error();
				error.errors = [new Error(`Denied 'write' for ${id}`)];
				return error;
			}
			const root = (await this.getItem("!",{user:this.dbo})) || {},
				original = await this.getItem(id,{user:this.dbo});
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
						await respond.call(this,{key,when:"before",action:"update",data,property,value,oldValue,user,request});
					}
				}
			}
			const count = await this.index(data,root,options);
			if(count) {
				await this.setItem("!",root,{user:this.dbo});
			}
			await this.setItem(id,data,options,true);
			for(const property of Object.keys(original||{})) {
				const value = data[property],
					oldValue = original[property];
				if(value!==oldValue) {
					setTimeout(() => {
						respond.call(this,{key,when:"after",action:"update",data,property,value,oldValue,user,request});
					});
				}
			}
			setTimeout(() => {
				respond.call(this,{key,when:"after",action:"put",data,user:options.user,request});
			});
			return data;
		}
		async query(pattern,partial,options={}) {
			let ids,
				count = 0,
				results = [],
				keys,
				saveroot;
			//return [{"test":"test"},this.dbo];
			const user = options.user,
				root = await this.getItem("!",{user:this.dbo});
			if(!root) return results;
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
						const node = await this.getItem(`!${key}`,{user:this.dbo});
						if(!node) {
							delete root[key];
							saveroot = true;
							continue;
						}
						if(node) {
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
										for(const valuekey in node) {
											haskeys = true;
											let value = JSON.parse(valuekey);
											if(typeof(value)==="string" && value.startsWith("Date@")) {
												value = new Date(parseInt(value.split("@")[1]));
											}
											if(await test.call(node,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
												// disallow index use by unauthorized users at document && property level
												for(const id in node[valuekey]) {
													const cname = id.split("@")[0],
														{data,removed} = await secure({key:`${cname}@`,action:"read",user,data:{[key]:value},request:this.request});
													if(data==null || removed.length>0) {
														delete node[valuekey][id];
														secured[id] = true;
													}
												}
												Object.assign(testids,node[valuekey]);
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
												if(!secured[id] && !testids[id]) {
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
								if(node[valuekey]) {
									// disallow index use by unauthorized users at document && property level
									const secured = {};
									for(const id in node[valuekey]) {
										const cname = id.split("@")[0],
											{data,removed} = await secure({key:`${cname}@`,action:"read",user,data:{[key]:value},request:this.request});
										if(data==null || removed.length>0) {
											delete node[valuekey][id];
											secured[id] = true;
										}
									}
									if(!ids) {
										ids = Object.assign({},node[valuekey]);
										count = Object.keys(ids).length;
									} else {
										for(const id in ids) {
											if(!secured[id] && !node[valuekey][id]) {
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
			}
			if(saveroot) {
				this.setItem("!",root,{user:this.dbo});
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
		async removeItem(keyOrObject,options={}) {
			const type = typeof(keyOrObject)==="object";
			if(keyOrObject && type==="object") {
				keyOrObject = keyOrObject["#"];
			} 
			if(keyOrObject) {
				const value = await this.getItem(keyOrObject,options),
					root = type==="object" ? await this.getItem("!",{user:this.dbo}) : null,
					action = "write",
					user = options.user,
					request = this.request;
				if(value===undefined) {
					return true;
				}
				if(root) {
					const key = `${keyOrObject.split("@")[0]}@`;
					await respond.call(this,{key,when:"before",action:"remove",data:value,user,request});
					await respond.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,user,request});
					const {secured} = await secure({key,action,user,data:value,request,documentOnly:true});
					if(secured) {
						await this.namespace.delete(keyOrObject);
						if(await this.unindex(value,root,options)) {
							await this.setItem("!",root,{user:this.dbo});
						}
						respond.call(this,{key,when:"after",action:"remove",data:value,user,request});
						respond.call(this,{key:keyOrObject,when:"after",action:"remove",data:value,user,request});
						return true;
					}
					return false;
				} else {
					await respond.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,user,request});
					const {data} = await secure({key:keyOrObject,action,user,data:value,request,documentOnly:true});
					if(data===value) {
						await this.namespace.delete(keyOrObject);
						respond.call(this,{key:keyOrObject,when:"after",action:"remove",data:value,user,request});
						return true;
					}
					return false;
				}
			}
			return false;
		}
		async setItem(key,data,{user}={},secured) {
			if(!secured && key[0]!=="!") {
				const action = "write",
					request = this.request,
					secured = await secure({key,action,user,data,request});
				data = secured.data;
				if(data && typeof(data)==="object") {
					const key = isSoul(data["#"],false) ? data["#"].split("@")[0] : "Object",
						secured = await secure({key,action,user,data,request});
					data = secured.data;
				}
			}
			if(data!==undefined) {
				await this.namespace.put(key,JSON.stringify(data));
			}
			return data;
		}
		async unindex(object,options,root={}) {
			let count = 0;
			if(object && typeof(object)==="object" && object["#"]) {
				const id = object["#"];
				for(const key in object) {
					if(root[key]) {
						const value = object[key];
						if(value && typeof(value)==="object") {
							count += await this.unindex(value,options,root);
						} else {
							const valuekey = `${JSON.stringify(value)}`,
								path = `!${key}`,
								node = await this.getItem(path,options);
							if(node[valuekey] && node[valuekey][id]) {
								delete node[valuekey][id];
								count++;
								/*node[valuekey].__keyCount__--;
								if(!node[valuekey].__keyCount__) {
									delete node[valuekey];
									root[key]--;
									count++;
								}*/
								await this.setItem(path,node,options);
							}
						}
					}
				}
			}
			return count;
		}
	}
	const predefined = Object.keys(Object.getOwnPropertyDescriptors(Thunderhead.prototype));
	Object.keys(functions).forEach((fname) => {
		if(!predefined.includes(fname)) {
			const f = async (...args) => functions[fname].call(this.request,...args);
			Object.defineProperty(Thunderhead.prototype,fname,{configurable:true,value:f})
		}
	});
	module.exports = Thunderhead;
}).call(this);