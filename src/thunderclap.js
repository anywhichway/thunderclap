(function() {
	"use strict"
	const uuid4 = require("./uuid4.js"),
		joqular = require("./joqular.js"),
		Schema = require("./schema.js"),
		User = require("./user.js");
	
	var fetch;
	if(typeof(fetch)==="undefined") {
		fetch = require("node-fetch");
	}
	
	const fromSerializable = (data) => {
			const type = typeof(data);
			if(data==="@undefined") {
				return undefined;
			}
			if(data==="@Infinity") {
				return Infinity;
			}
			if(data==="@-Infinity") {
				return -Infinity;
			}
			if(data==="@NaN") {
				return NaN;
			}
			if(type==="string") {
				if(data.startsWith("Date@")) {
					return new Date(parseInt(data.substring(5)));
				}
			}
			if(data && type==="object") {
				Object.keys(data).forEach((key) => {
					data[key] = fromSerializable(data[key]);
				});
				if(data["^"]) {
					data["^"] = fromSerializable(data["^"]);
				}
			}
			return data;
		},
		toSerializable = (data) => {
			const type = typeof(data);
			if(data===undefined) {
				return "@undefined";
			}
			if(data===Infinity) {
				return "@Infinity";
			}
			if(data===-Infinity) {
				return "@-Infinity";
			}
			if(type==="number" && isNaN(data)) {
				return "@NaN";
			}
			if(data && type==="object") {
				if(data instanceof Date) {
					return `Date@${data.getTime()}`;
				}
				Object.keys(data).forEach((key) => {
					data[key] = toSerializable(data[key]);
				});
				if(data["^"]) {
					data["^"] = toSerializable(data["^"]);
				}
			}
			return data;
		};
	
	// "https://cloudworker.io/db.json";
	//"https://us-central1-reasondb-d3f23.cloudfunctions.net/query/";
	class Thunderclap  {
		constructor({endpoint,user,headers={}}) {
			this.ctors = {};
			this.endpoint = endpoint;
			this.headers = Object.assign({},headers);
			this.headers["X-Auth-Username"] = user.username;
			this.headers["X-Auth-Password"] = user.password;
			this.register(Schema);
			this.register(User);
		}
		async createUser(userName,password,reAuth) {
			return fetch(`${this.endpoint}?["createUser",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))}]`,{headers:this.headers})
	    	.then((response) => response.json()) // change to text(), try to parse, thow error if can't
	    	.then((data) => this.create(data))
	    	.then((user) => {
	    		if(reAuth || !this.headers["X-Auth-Username"]) {
	    			this.headers["X-Auth-Username"] = user.username;
	    			this.headers["X-Auth-Password"] = user.password;
	    		}
	    		return user;
	    	});
		}
		async getItem(key) {
		    return fetch(`${this.endpoint}?["getItem",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => this.create(data));
		}
		async getSchema(className) {
		    return fetch(`${this.endpoint}?["getSchema",${encodeURIComponent(JSON.stringify(className))}]`,{headers:this.headers})
		    	.then((response) => response.json())
		    	.then((data) => this.create(data));
		}
		async keys(lastKey) {
			return fetch(`${this.endpoint}?["keys",${encodeURIComponent(JSON.stringify(lastKey))}]`,{headers:this.headers})
	    		.then((response) => response.json())
		}
		async putItem(object) {
			this.register(object.constructor);
			const data = Object.assign({},object);
			let id = data["#"];
			if(!id) {
				id = data["#"]  = `${object.constructor.name}@${uuid4()}`;
			}
			const cname = id.split("@")[0];
			let schema = await this.getSchema(cname);
			if(schema) {
				schema = new Schema(cname,schema);
				const errors = await schema.validate(object,this);
				if(errors.length>0) {
					const error = new Error();
					error.errors = errors;
					throw error;
				}
			}	
			return fetch(`${this.endpoint}?["putItem",${encodeURIComponent(JSON.stringify(toSerializable(data)))}]`,{headers:this.headers})
				.then((response) => response.json())
				.then((object) => this.create(object))
		}
		async query(object,{verify,partial}={}) {
			return fetch(`${this.endpoint}?["query",${encodeURIComponent(JSON.stringify(toSerializable(object)))},${partial||false}]`,{headers:this.headers})
	    		.then((response) => response.json())
	    		.then((objects) => objects.map((object) => this.create(object)))
	    		.then((objects) => verify ? objects.filter((result) => joqular.matches(object,result)!==undefined) : objects);
		}
		register(ctor) {
			if(ctor.name && ctor.name!=="anonymous") {
				this.ctors[ctor.name] = ctor;
			}
		}
		async removeItem(keyOrObject) {
			return fetch(`${this.endpoint}?["removeItem",${encodeURIComponent(JSON.stringify(toSerializable(keyOrObject)))}]`,{headers:this.headers})
				.then((response) => response.json())
				.then((data) => this.create(data))
		}
		async setItem(key,data) {
			if(data && typeof(data)==="object") {
				this.register(data.constructor);
			}
			return fetch(`${this.endpoint}?["setItem",${encodeURIComponent(JSON.stringify(key))},${encodeURIComponent(JSON.stringify(toSerializable(data)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => this.create(data));
		}
		async setSchema(className,config) {
			const object = new Schema(className,config);
			return this.putItem(object);
		}
		create(data) {
			const type = typeof(data);
			if(type==="string") {
				return fromSerializable(data);
			}
			if(!data || typeof(data)!=="object") return data;
			Object.keys(data).forEach(key => data[key] = this.create(data[key]));
			const id = data["#"] || (data["^"] ? data["^"]["#"]||data["^"].id : ""),
				[cname] = id.split("@"),
				ctor = cname ? this.ctors[cname] : null;
			if(!ctor) {
				return data;
			}
			let instance;
			if(ctor.create) {
				instance = ctor.create(data);
			} else {
				instance = Object.create(ctor.prototype);
				Object.assign(instance,data);
			}
			if(!instance["^"]) {
				const meta = Object.assign({},data["^"]);
				Object.defineProperty(instance,"^",{value:meta});
			}
			try {
				Object.defineProperty(instance,"#",{get() { return this["^"]["#"]||this["^"].id; }});
			} catch(e) {
				// ignore if already defined
			}
			return instance;
		}
	}
	if(typeof(module)!=="undefined") module.exports = Thunderclap;
	if(typeof(window)!=="undefined") window.Thunderclap = Thunderclap;
}).call(this);
