/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

const Schema = require("./schema.js"),
	User = require("./user.js"),
	hashPassword = require("./hash-password.js"),
	Database = require("./database.js"),
	dboPassword = require("../dbo.js");

let thunderclap;
addEventListener('fetch', event => {
	const namespace = NAMESPACE,
		request = event.request;
	request.URL = new URL(request.url);
	thunderclap = new Database({request,namespace,dbo: new User("dbo",{"#":"User@dbo",roles:{dbo:true}})});
	event.respondWith(handleRequest(request));
});

async function handleRequest(request) {
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
		let dbo = await thunderclap.getItem("User@dbo",{user:thunderclap.dbo});
		if(!dbo) {
			Object.assign(thunderclap.dbo,await hashPassword(dboPassword,1000));
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
				const type = typeof(result);
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
