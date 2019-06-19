const uuid4 = require("./uuid4.js"),
	isSoul = require("./is-soul.js"),
	joqular = require("./joqular.js"),
	secure = require("./secure.js"),
	Schema = require("./schema.js"),
	User = require("./user.js");


let thunderdb;
addEventListener('fetch', event => {
	const db = NAMESPACE;
		thunderdb = {
			async getItem(key,options={}) {
				let data = await db.get(key);
				if(data) {
					data = JSON.parse(data);
					if(key[0]!=="!") {
						if(isSoul(data["#"],false)) {
							const cname = data["#"].split("@")[0],
								secured = await secure(cname,"read",options.user,data);
							data = secured.data;
						}
						const secured = await secure(key,"read",options.user,data);
						data = secured.data;
					}
				}
				return data;
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
			async query(object,options={}) {
				let ids,
					count = 0;
					results = [];
				const root = await this.getItem("!",options);
				if(!root) return results;
				for(const key in object) {
					const keytest = joqular.toTest(key,true);
					let keys;
					if(keytest) { // if key can be converted to a test, assemble matching keys
						keys = Object.keys(root).filter((key) => keytest(key));
					} else { // else key list is just the literal key
						keys = [key];
					}
					for(const key of keys) {
						if(root[key]) {
							const node = await this.getItem(`!${key}`,options);
							if(node) {
								const value = object[key],
									type = typeof(value);
								if(value && type==="object") {
									const valuecopy = Object.assign({},value);
									for(const [predicate,pvalue] of Object.entries(value)) {
										if(predicate==="$return") continue;
										const test = joqular.toTest(predicate);
										if(predicate==="$search") {

										} else if(test) {
											let testids = {};
											delete valuecopy[predicate];
											for(const valuekey in node) {
												if(await test.call(node,JSON.parse(valuekey),...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
													// disallow index use by unauthorized users at document && property level
													for(const id in node[valuekey]) {
														const cname = id.split("@")[0],
															{data,removed} = await secure(cname,"read",options.user,{[key]:true});
														if(!data || removed.length>0) {
															delete node[valuekey][id];
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
													if(!testids[id]) {
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
										for(const id in node[valuekey]) {
											const cname = id.split("@")[0],
												{data,removed} = await secure(cname,"read",options.user,{[key]:true});
											if(!data || removed.length>0) {
												delete node[valuekey][id];
											}
										}
										if(!ids) {
											ids = Object.assign({},node[valuekey]);
											count = Object.keys(ids).length;
										} else {
											for(const id in ids) {
												if(!node[valuekey][id]) {
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
					if(!ids) { // if no ids after first loop, then no matches
						return [];
					}
				}
				if(ids) {
					for(const id in ids) {
						const object = await this.getItem(id,options);
						if(object) {
							results.push(object);
						}
					}
				}
				return results;
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
				const {data,removed} = await secure(cname,"write",options.user,object),
					root = (await this.getItem("!",options)) || {},
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
					await this.setItem("!",root,options);
				}
				await this.setItem(id,data,options,true);
				return object;
			},
			async removeItem(keyOrObject,options) {
				const type = typeof(keyOrObject)==="object";
				if(keyOrObject && type==="object") {
					keyOrObject = keyOrObject["#"];
				} 
				if(keyOrObject) {
					const root = type==="object" ? await this.getItem("!",options) : null,
						object = root ? await this.getItem(keyOrObject,options) : null;
					await db.delete(keyOrObject);
					if(await this.unindex(object,root,options)) {
						await this.setItem("!",root,options);
					}
				}
			},
			async setItem(key,data,options,patched) {
				if(!patched && key[0]!=="!") {
					const secured = await secure(key,"write",options.user,data);
					data = secured.data;
				}
				if(data===undefined) {
					await db.removeItem(key,options);
				} else {
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
	thunderdb.dbo =  new User("dbo",{"#":"User@dbo",roles:{dbo:true}}); // should get pwd during build
	event.request.URL = new URL(event.request.url);
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	let body = "Not Found",
		status = 404;
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
		//let userschema = await thunderdb.getSchema(User);
		//if(!userschema) {
		const userschema = await thunderdb.putItem(new Schema(User));
		//}
		let dbo = await thunderdb.getItem("User@dbo",{user:thunderdb.dbo});
		if(!dbo) {
			await thunderdb.putItem(dbouser,{user:thunderdb.dbo});
		}
		body = decodeURIComponent(request.URL.search);
		const command = JSON.parse(body.substring(1)),
			fname = command.shift(),
			args = command;
		if(thunderdb[fname]) {
			const userName = request.headers.get("X-Auth-Username"),
				password = request.headers.get("X-Auth-Password"),
				user = userName ? (await thunderdb.query({userName},{user:thunderdb.dbo}))[0] : null; // should do an instanceof check against id
			//const {readable,writable} = new TransformStream();
			if(!user) {
				return new Response(null,{
					status: 403,
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": "*", //'${request.URL.protocol}//${request.URL.hostname}'
						"Access-Control-Allow-Headers": "*"
					}
				});
			}
			return thunderdb[fname](args[0],{user})
			.then((result) => {
				const type = typeof(result),
					options = args.pop();
				if(result===undefined) result = "@undefined";
				else if(result===Infinity) result = "@Infinity";
				else if(result===-Infinity) result = "@-Infinity";
				else if(type==="number" && isNaN(result)) result = "@NaN";
				else if(result && type==="object") {
					if(result instanceof Date) {
						result = `@Date${result.timestamp}`;
					}
					if(result instanceof Error) {
						return new Response(JSON.stringify(result.errors.map(error => error+"")),
							{
								status:422,
								headers:
								{
									"Content-Type":"text/plain",
									"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
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
						"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
					}
				});
			});
			//return new Response(readable,
			//	{
			//		headers:
			//		{
			//			"Content-Type":"text/plain",
			//			"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
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
					"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
				}
			}
	);
	return response;
}
