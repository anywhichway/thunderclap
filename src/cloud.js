/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */
"use strict"
const //uid = require("./uid.js"),
	//create = require("./create.js"),
	//fromSerializable = require("./from-serializable.js"),
	//toSerializable = require("./to-serializable.js"),
	//Entity = require("./entity.js"),
	Schema = require("./schema.js"),
	User = require("./user.js"),
	//functions = require("../functions.js").browser,
	//when = require("../when.js").browser;
	//Thunderclap = require("../thunderclap.js"),
	hashPassword = require("./hash-password.js"),
	toSerializable = require("./to-serializable"),
	Thunderhead = require("./thunderhead.js"),
	dboPassword = require("../keys.js").dboPassword,
	secure = require("./secure.js");

/*const thunderclapjs = `(function() 
	{ 
		${uid+""};
		${create+""};
		${fromSerializable+""};
		${toSerializable+""};
		${Entity+""};
		${Schema+""}; 
		${User+""};
		const functions = ${JSON.stringify(functions,(key,val) => (typeof val === 'function') ? '' + val : val)};
		const when = ${JSON.stringify(when,(key, val) => (typeof val === 'function') ? '' + val : val)};
		${Thunderclap+""};
		window.Schema = Schema; 
		window.User = User; 
		window.Thunderclap = Thunderclap; 
	}).call(this)`;*/

//const thunderclapjs = Thunderclap+"";

let thunderhead;
addEventListener('fetch', event => {
	// if on localhost, use something like kv-store as a simulator
	const request = event.request,
		dbo = new User("dbo",{"#":"User@dbo",roles:{dbo:true}});
	request.URL = new URL(request.url);
	thunderhead = new Thunderhead({request,namespace:NAMESPACE,dbo});
	setInterval(() => {
		thunderhead.resetCache();
	},5000)
	event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
	const {request,response} = event;
	
	let body = "Not Found",
		status = 404;
	//if(request.URL.pathname==="/thunderclap.js") {
	//	return new Response(thunderclapjs);
	//}
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
		let dbo = await thunderhead.cache.get("User@dbo");
		/*return new Response(JSON.stringify([dbo]),{
			headers:
			{
				"Content-Type":"text/plain",
				"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			}
		});*/
		if(!dbo) {
			Object.assign(thunderhead.dbo,await hashPassword(dboPassword,1000));
			dbo = await thunderhead.putItem(thunderhead.dbo);
			/*return new Response(JSON.stringify([dbo]),{
				headers:
				{
					"Content-Type":"text/plain",
					"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
				}
			});*/
		}
		let userschema = await thunderhead.getSchema(User);
		body = decodeURIComponent(request.URL.search.replace(/\+/g,"%20"));
		const command = JSON.parse(body.substring(1)),
			fname = command[0],
			args = command.slice(1);
		/*return new Response(JSON.stringify(fname + " " + thunderhead[fname]),{
			status: 200,
			headers:
			{
				"Content-Type":"text/plain",
				"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			}
		});*/
		/*const value = await NAMESPACE.get(...args)
		  if (value === null) {
		    return new Response("Value not found", {status: 404})
		  }
		  return new Response(JSON.stringify(value));*/
		if(thunderhead[fname]) {
			if(fname==="createUser") {
				request.user = thunderhead.dbo;
			} else {
				// add user to request instead of passing in options?
				const userName = request.headers.get("X-Auth-Username"),
					password = request.headers.get("X-Auth-Password"),
					user = await thunderhead.authUser(userName,password); // thunderhead.dbo;
				if(!user) {
					return new Response("null",{
						status: 401,
						headers:
						{
							"Content-Type":"text/plain",
							"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
						}
					});
				}
				request.user = Object.freeze(user);
			}
			//Object.freeze(request);
			const secured = await secure.call(thunderhead,{key:`Function@.${fname}`,action:"execute",data:args,user:request.user,request});
			if(!secured.data || secured.removed.length>0) {
				return new Response(JSON.stringify(secured),{
					status: 403,
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
					}
				});
			}
			return thunderhead[fname](...args)
			.then((result) => {
				const type = typeof(result);
				if(result && type==="object" && result instanceof Error) {
					return new Response(JSON.stringify(result.errors ? result.errors.map(error => error+"") : result+""),
						{
							status:422,
							headers:
							{
								"Content-Type":"text/plain",
								"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
							}
						});
				}
				const data = toSerializable(result,true);
				//const response = new Response(JSON.stringify(result));
				//response.body.pipeTo(writable);
				event.waitUntil(Promise.all(thunderhead.cache.promises));
				return new Response(JSON.stringify(data),{
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
					}
				});
			})
			.catch((e) => { throw e; });
			//return new Response(readable,
			//	{
			//		headers:
			//		{
			//			"Content-Type":"text/plain",
			//			"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			//		}
			//	}
			//)
		}  else {
			status = 404;
			body = "404 - Not Found";
		}
	} catch(e) {
		body = JSON.stringify(`${body}\n${e+""}\n${e.stack}`);
		status = 500;
	}
	//return fetch(request);
	return new Response(JSON.stringify(body),
			{
				status,
				headers:
				{
					"Content-Type":"text/plain",
					"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
				}
			}
	);
	return response;
}
