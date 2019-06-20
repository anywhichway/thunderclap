(function() {
	"use strict"
	const uuid4 = require("./uuid4.js"),
		joqular = require("./joqular.js"),
		Schema = require("./schema.js"),
		User = require("./user.js");
	
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
		async createUser(userName,password) {
			return fetch(`${this.endpoint}?["createUser",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))}]`,{headers:this.headers})
	    	.then((response) => response.json()) // change to text(), try to parse, thow error if can't
	    	.then((data) => this.create(data));
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
			return fetch(`${this.endpoint}?["putItem",${encodeURIComponent(JSON.stringify(data))}]`,{headers:this.headers})
				.then((response) => response.json())
				.then((object) => this.create(object))
		}
		async query(object,verify) {
			return fetch(`${this.endpoint}?["query",${encodeURIComponent(JSON.stringify(object))}]`,{headers:this.headers})
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
			return fetch(`${this.endpoint}?["removeItem",${encodeURIComponent(JSON.stringify(keyOrObject))}]`,{headers:this.headers})
				.then((response) => response.json())
				.then((data) => this.create(data))
		}
		async setItem(key,data) {
			if(data && typeof(data)==="object") {
				this.register(data.constructor);
			}
			return fetch(`${this.endpoint}?["setItem",${encodeURIComponent(JSON.stringify(key))},${encodeURIComponent(JSON.stringify(data))}]`,{headers:this.headers})
				.then((response) => response.json()); 
		}
		async setSchema(className,config) {
			const object = new Schema(className,config);
			return this.putItem(object);
		}
		create(data) {
			const type = typeof(data);
			if(type==="string") {
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
				if(data.startsWith("Date@")) {
					return new Date(parseInt(data.substring(5)));
				}
				return data;
			}
			if(!data || typeof(data)!=="object") return data;
			Object.keys(data).forEach(key => data[key] = this.create(data[key]));
			if(!data["^"]) return data;
			const id = data["#"] || (data["^"] ? data["^"]["#"]||data["^"].id : ""),
				[cname] = id.split("@"),
				ctor = cname ? this.ctors[cname] : null;
			let instance;
			if(ctor) {
				if(ctor.create) {
					instance = ctor.create(data);
				}
				instance = Object.create(ctor.prototype);
				Object.assign(instance,data);
			} else {
				instance = Object.assign({},data);
			}
			const meta = Object.assign({},data["^"]);
			Object.defineProperty(instance,"^",{value:meta});
			Object.defineProperty(instance,"#",{get() { return this["^"]["#"]||this["^"].id; }});
			return instance;
		}
	}
	if(typeof(module)!=="undefined") module.exports = Thunderclap;
	if(typeof(window)!=="undefined") window.Thunderclap = Thunderclap;
}).call(this);
