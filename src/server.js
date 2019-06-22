/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

const uuid4 = require("./uuid4.js"),
	isSoul = require("./is-soul.js"),
	joqular = require("./joqular.js"),
	secure = require("./secure.js"),
	Schema = require("./schema.js"),
	User = require("./user.js"),
	hashPassword = require("./hash-password.js");

const hexStringToUint8Array = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

let thunderclap;
addEventListener('fetch', event => {
	const db = NAMESPACE,
		request = event.request;
	thunderclap = joqular.db = {
		async authUser(userName,password,options) {
			const user = (await this.query({userName},false,options))[0];
			if(user && user.salt && user.hash===(await hashPassword(password,1000,hexStringToUint8Array(user.salt))).hash) {
				secure.mapRoles(user);
				return user;
			}
		},
		async createUser(userName,password,options) {
			const user = new User(userName);
			Object.assign(user,await hashPassword(password,1000));
			return this.putItem(user,options);
		},
		async getItem(key,options={}) {
			let data = await db.get(key);
			if(data) {
				data = JSON.parse(data);
				if(key[0]!=="!") {
					if(isSoul(data["#"],false)) {
						const cname = data["#"].split("@")[0],
							secured = await secure(`${cname}@`,"read",options.user,data,request);
						data = secured.data;
					}
					const secured = await secure(key,"read",options.user,data,request);
					data = secured.data;
				}
			}
			return data==null ? undefined : data;
		},
		async getSchema(ctor,options) {
			const data = await db.get(`Schema@${ctor.name||ctor}`);
			if(data) {
				return new Schema(ctor.name||ctor,JSON.parse(data));
			}
		},
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
								root[key] = 0;
								changed++;
							}
							let node = await this.getItem(path,options);
							if(!node) {
								root[key]++;
								changed++;
								node = {};
							}
							node[valuekey] || (node[valuekey] = {__keyCount__:0});
							if(!node[valuekey][id]) {
								node[valuekey][id] = true;
								node[valuekey].__keyCount__++;
								await this.setItem(path,node,options);
							}
						}
					}
				}
			}
			return changed;
		},
		async keys(lastKey) {
			return db.getKeys(lastKey)
		},
		async putItem(object,options={}) {
			let id = object["#"];
			if(!id) {
				id = object["#"]  = `${object.constructor.name}@${uuid4()}`;
			}
			const cname = id.split("@")[0];
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
			const {data,removed} = await secure(`${cname}@`,"write",options.user,object,request),
				root = (await this.getItem("!",{user:thunderclap.dbo})) || {},
				original = await this.getItem(id,{user:this.dbo});
			if(!data) {
				const error = new Error();
				error.errors = [new Error(`Denied 'write' for ${id}`)];
				return error;
			}
			if(original && removed) {
				removed.forEach((key) => {
					if(original[key]!==undefined) {
						data[key] = original[key];
					}
				});
			}
			// need to add code to unindex the changes from original
			const count = await this.index(data,root,options);
			if(count) {
				await this.setItem("!",root,{user:thunderclap.dbo});
			}
			await this.setItem(id,data,options,true);
			return object;
		},
		async query(pattern,partial,options={}) {
			let ids,
				count = 0,
				results = [],
				keys;
			const user = options.user,
				root = await this.getItem("!",{user:thunderclap.dbo});
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
						const node = await this.getItem(`!${key}`,{user:thunderclap.dbo});
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
										for(const valuekey in node) {
											let value = JSON.parse(valuekey);
											if(typeof(value)==="string" && value.startsWith("Date@")) {
												value = new Date(parseInt(value.split("@")[1]));
											}
											if(await test.call(node,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
												// disallow index use by unauthorized users at document && property level
												for(const id in node[valuekey]) {
													const cname = id.split("@")[0],
														{data,removed} = await secure(`${cname}@`,"read",user,{[key]:value},request);
													if(data==null || removed.length>0) {
														delete node[valuekey][id];
														secured[id] = true;
													}
												}
												Object.assign(testids,node[valuekey]);
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
											{data,removed} = await secure(`${cname}@`,"read",user,{[key]:value},request);
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
			//results.push(keys)
			return results;
		},
		register(ctor) {
			if(ctor.name && ctor.name!=="anonymous") {
				this.ctors[ctor.name] = ctor;
			}
		},
		async removeItem(keyOrObject,options={}) {
			const type = typeof(keyOrObject)==="object";
			if(keyOrObject && type==="object") {
				keyOrObject = keyOrObject["#"];
			} 
			if(keyOrObject) {
				const root = type==="object" ? await this.getItem("!",{user:thunderclap.dbo}) : null,
					object = root ? await this.getItem(keyOrObject,options) : null;
				if(object) {
					const cname = keyOrObject.split("@")[0],
						{data} = await secure(`${cname}@`,"write",options.user,object,request,true);
					if(data) {
						await db.delete(keyOrObject);
						if(await this.unindex(object,root,options)) {
							await this.setItem("!",root,{user:thunderclap.dbo});
						}
					}
				} else {
					const {data} = await secure(keyOrObject,"write",options.user,"dummy",request,true);
					if(data==="dummy") {
						await db.delete(keyOrObject);
					}
				}
			}
		},
		async setItem(key,data,options,secured) {
			if(!secured && key[0]!=="!") {
				const secured = await secure(key,"write",options.user,data,request);
				data = secured.data;
				if(data && typeof(data)==="object") {
					const key = isSoul(data["#"],false) ? data["#"].split("@")[0] : "Object",
						secured = await secure(key,"write",options.user,data,request);
					data = secured.data;
				}
			}
			if(data!==undefined) {
				await db.put(key,JSON.stringify(data));
			}
			return data;
		},
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
								node[valuekey].__keyCount__--;
								if(!node[valuekey].__keyCount__) {
									delete node[valuekey];
									root[key]--;
									count++;
								}
								await this.setItem(path,node,options);
							}
						}
					}
				}
			}
			return count;
		}
	};
	thunderclap.ctors = [];
	thunderclap.register(Object);
	thunderclap.register(Array);
	thunderclap.register(Date);
	thunderclap.register(URL);
	thunderclap.register(User);
	thunderclap.register(Schema);
	thunderclap.dbo =  new User("dbo",{"#":"User@dbo",roles:{dbo:true}}); // should get pwd during build
	
	request.URL = new URL(request.url);
	event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
	let body = "Not Found",
		status = 404;
	if(request.URL.pathname!=="/db.json") {
		return fetch(request);
	}
	if(request.method==="OPTIONS") {
		return new Response(null,{
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "X-Auth-Username,X-Auth-Password",
				"Access-Control-Allow-Methods": "GET, OPTIONS"
			}
		})
	}
	try {
		let dbo = await thunderclap.getItem("User@dbo",{user:thunderclap.dbo});
		if(!dbo) {
			Object.assign(thunderclap.dbo,await hashPassword("dbo",1000));
			dbo = await thunderclap.putItem(thunderclap.dbo,{user:thunderclap.dbo});
		}
		/*const dbo1 = await thunderclap.getItem("User@dbo",{user:thunderclap.dbo});
		return new Response(JSON.stringify([dbo,dbo1]),{
			headers:
			{
				"Content-Type":"text/plain",
				"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			}
		});*/
		//let userschema = await thunderclap.getSchema(User);
		//if(!userschema) {
		//const userschema = await thunderclap.putItem(new Schema(User),{user:thunderclap.dbo});
		//}
		body = decodeURIComponent(request.URL.search);
		const command = JSON.parse(body.substring(1)),
			fname = command.shift(),
			args = command;
		if(thunderclap[fname]) {
			if(fname==="createUser") {
				args.push({user:thunderclap.dbo});
			} else {
				const userName = request.headers.get("X-Auth-Username"),
					password = request.headers.get("X-Auth-Password"),
					user = await thunderclap.authUser(userName,password,{user:thunderclap.dbo}); // thunderclap.dbo;
				if(!user) {
					return new Response(null,{
						status: 403,
						headers:
						{
							"Content-Type":"text/plain",
							"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
						}
					});
				}
				args.push({user});
			}
			return thunderclap[fname](...args)
			.then((result) => {
				const type = typeof(result),
					options = args.pop();
				if(result===undefined) result = "@undefined";
				else if(result===Infinity) result = "@Infinity";
				else if(result===-Infinity) result = "@-Infinity";
				else if(type==="number" && isNaN(result)) result = "@NaN";
				else if(result && type==="object") {
					if(result instanceof Date) {
						result = `@Date${result.getTime()}`;
					}
					if(result instanceof Error) {
						return new Response(JSON.stringify(result.errors.map(error => error+"")),
							{
								status:422,
								headers:
								{
									"Content-Type":"text/plain",
									"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
								}
							});
					}
				}
				//const response = new Response(JSON.stringify(result));
				//response.body.pipeTo(writable);
				return new Response(JSON.stringify(result),{
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
					}
				});
			});
			//return new Response(readable,
			//	{
			//		headers:
			//		{
			//			"Content-Type":"text/plain",
			//			"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			//		}
			//	}
			//)
		}
	} catch(e) {
		body = JSON.stringify(e+body);
		status = 500;
	}
	//return fetch(request);
	const response = new Response(body,
			{
				headers:
				{
					"Status": status,
					"Content-Type":"text/plain",
					"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
				}
			}
	);
	return response;
}
