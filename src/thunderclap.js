/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

(function() {
	"use strict"
	const uid = require("./uid.js"),
		joqular = require("./joqular.js"),
		toSerializable = require("./to-serializable.js"),
		create = require("./create.js"),
		Schema = require("./schema.js"),
		User = require("./user.js"),
		Position = require("./position.js"),
		Coordinates = require("./coordinates.js"),
		when = require("../when.js").browser,
		functions = require("../functions.js").browser,
		classes = require("../classes.js");
		
	var fetch;
	if(typeof(fetch)==="undefined") {
		fetch = require("node-fetch");
	}
	
	// "https://cloudworker.io/db.json";
	//"https://us-central1-reasondb-d3f23.cloudfunctions.net/query/";
	class Thunderclap  {
		constructor({endpoint,user,headers}={}) {
			this.ctors = {};
			this.schema = {};
			this.endpoint = endpoint;
			this.headers = Object.assign({},headers);
			this.headers["X-Auth-Username"] = user ? user.username : "anonymous";
			this.headers["X-Auth-Password"] = user ? user.password : "";
			this.register(Array);
			this.register(Date);
			this.register(URL);
			this.register(User);
			this.register(Schema);
			this.register(Position);
			this.register(Coordinates);
			Object.keys(classes).forEach((cname) => this.register(classes[cname]));
			Object.keys(functions).forEach((key) => {
				if(this[key]) {
					throw new Error(`Attempt to redefine Thunderclap function: ${key}`);
				}
				const f = async (...args) => {
					const signature = [key];
					for(let i=0;i<functions[key].length;i++) {
						signature.push(encodeURIComponent(JSON.stringify(toSerializable(arg[i]))))
					}
					return fetch(`${this.endpoint}/db.json?${JSON.stringify(signature)}`,{headers:this.headers})
		    			.then((response) => response.json())
		    			.then((data) => create(data,this.ctors))
				}
				Object.defineProperty(this,key,{enumerable:false,configurable:true,writable:true,value:f})
			})
		}
		async clear(key="") {
			return fetch(`${this.endpoint}/db.json?["clear",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async changePassword(userName,password="",oldPassword="") {
			return fetch(`${this.endpoint}/db.json?["changePassword",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))},${encodeURIComponent(JSON.stringify(oldPassword))}]`,{headers:this.headers})
	    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors))
		    	.then((password) => {
		    		if(password && this.headers["X-Auth-Username"]===userName) {
		    			this.headers["X-Auth-Password"] = password;
		    		}
		    		return password;
		    	});
		}
		async createUser(userName,password,reAuth) {
			return fetch(`${this.endpoint}/db.json?["createUser",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		    	.then((user) => {
		    		if(reAuth || !this.headers["X-Auth-Username"]) {
		    			this.headers["X-Auth-Username"] = user.username;
		    			this.headers["X-Auth-Password"] = user.password;
		    		}
		    		return user;
		    	});
		}
		async entries(prefix="",options={}) {
			return fetch(`${this.endpoint}/db.json?["entries"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.json());
		}
		async getItem(key) {
		    return fetch(`${this.endpoint}/db.json?["getItem",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async getSchema(className) {
		    return fetch(`${this.endpoint}/db.json?["getSchema",${encodeURIComponent(JSON.stringify(className))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async hasKey(key) {
			if(key) {
				return fetch(`${this.endpoint}/db.json?["hasKey",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
	    			.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
	    			.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
	    			.then((data) => create(data,this.ctors))
			}
			return false;
		}
		async keys(prefix="",options={}) {
			return fetch(`${this.endpoint}/db.json?["keys"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async putItem(object,options={}) {
			this.register(object.constructor);
			let data = Object.assign({},object),
				id = data["#"];
			if(!id) {
				id = data["#"]  = `${object.constructor.name}@${uid()}`;
			}
			const cname = id.split("@")[0];
			let schema = this.schema[cname];
			if(!schema) {
				this.schema[cname] = schema = await this.getSchema(cname) || "anonymous";
			}
			if(schema && schema!=="anonymous") {
				schema = new Schema(cname,schema);
				const errors = await schema.validate(object,this);
				if(errors.length>0) {
					const error = new Error();
					error.errors = errors;
					throw error;
				}
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
			if(!data || typeof(data)!=="object") {
				return;
			}
			const result = fetch(`${this.endpoint}/db.json?["putItem",${encodeURIComponent(JSON.stringify(toSerializable(data)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((object) => create(object,this.ctors));
			for(const match of matches) {
				if(match.call) {
					data = await match.call.call(this,await result,match.when);
				}
			}
			return result;
		}
		async query(object,{validate,partial,limit}={}) {
			const options = partial||limit ? {partial,limit} : {};
			return fetch(`${this.endpoint}/db.json?["query",${encodeURIComponent(JSON.stringify(toSerializable(object)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
	    		.then((response) => {
	    			if(response.status===200) {
	    				return response.text();
	    			}
	    			throw new Error(`Request failed: ${response.status}`) 
	    		})
		    	.then((data) => JSON.parse(data.replace(/\%20/g," ")))
	    		.then((objects) => create(objects,this.ctors))
	    		.then((objects) => validate ? objects.filter((result) => joqular.matches(object,result)!==undefined) : objects);
		}
		register(ctor,name=ctor.name) {
			if(typeof(ctor)==="string") {
				name = ctor;
				ctor = Function(`return ${ctor}`);
			} else {
				name = ctor.name;
			}
			if(name && name!=="anonymous") {
				Thunderclap[name] = ctor;
				return this.ctors[name] = ctor;
			}
		}
		async removeItem(keyOrObject) {
			return fetch(`${this.endpoint}/db.json?["removeItem",${encodeURIComponent(JSON.stringify(toSerializable(keyOrObject)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async setItem(key,data,options={}) {
			if(data && typeof(data)==="object") {
				this.register(data.constructor);
			}
			return fetch(`${this.endpoint}/db.json?["setItem",${encodeURIComponent(JSON.stringify(key))},${encodeURIComponent(JSON.stringify(toSerializable(data)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => create(data,this.ctors));
		}
		async setSchema(className,config) {
			const object = new Schema(className,config);
			return this.putItem(object);
		}
		async unique(objectOrIdOrCname,property,value="") {
			objectOrIdOrCname = typeof(objectOrIdOrCname)==="string" ? objectOrIdOrCname : objectOrIdOrCname["#"];
			if(!objectOrIdOrCname) {
				return false;
			}
			return fetch(`${this.endpoint}/db.json?["unique",${encodeURIComponent(JSON.stringify(objectOrIdOrCname))},${encodeURIComponent(JSON.stringify(property))},${encodeURIComponent(JSON.stringify(value))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async values(prefix="",options={}) {
			return fetch(`${this.endpoint}/db.json?["values"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
	}
	
	if(typeof(module)!=="undefined") module.exports = Thunderclap;
	if(typeof(window)!=="undefined") window.Thunderclap = Thunderclap;
}).call(this);
