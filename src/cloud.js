/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

const Schema = require("./schema.js"),
	User = require("./user.js"),
	hashPassword = require("./hash-password.js"),
	toSerializable = require("./to-serializable"),
	Thunderhead = require("./thunderhead.js"),
	dboPassword = require("../dbo.js"),
	secure = require("./secure.js");

let thunderhead;
addEventListener('fetch', event => {
	const request = event.request;
	request.URL = new URL(request.url);
	thunderhead = new Thunderhead({request,namespace:NAMESPACE,dbo: new User("dbo",{"#":"User@dbo",roles:{dbo:true}})});
	event.respondWith(handleRequest({request}));
});

async function handleRequest({request,response}) {
	/*const mail = await fetch("https://api.mailgun.net/v3/mailgun.anywhichway.com/messages", {
	  method: "POST",
	  body:encodeURI(
		"from=Excited User <syblackwell@anywhichway.com>&" +
		"to=syblackwell@anywhichway.com&"+
		"subject=Hello&"+
		"text=Testing some Mailgun awesomeness!"
	  ),
	  headers: {
	    Authorization: "Basic YXBpOmM4MDE0N2UzYjhjOTVlNzQ1MmU1YmE5MjUxMWQ0MGFhLTI5Yjc0ODhmLWQwMzI5YWVh",
	    "Content-Type": "application/x-www-form-urlencoded"
	  }
	}).then(async (response) => `${response.ok} ${response.status} ${JSON.stringify(await response.json())}`)
	.catch((e) => e.message+'Err');
	return new Response(JSON.stringify(mail),{
		headers:
		{
			"Content-Type":"text/plain",
			"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
		}
	});*/
	
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
		let dbo = await thunderhead.namespace.get("User@dbo");
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
		if(!userschema) {
			request.user = thunderhead.dbo;
			const userschema = await thunderhead.putItem(new Schema(User));
			request.user = undefined;
		}
		body = decodeURIComponent(request.URL.search);
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
			if(fname!=="createUser") {
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
			const secured = await secure.call(thunderhead,{key:fname,action:"execute",data:args});
			if(!secured.data || secured.removed.length>0) {
				return new Response("null",{
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
				const data = toSerializable(result,true);
				//const response = new Response(JSON.stringify(result));
				//response.body.pipeTo(writable);
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
