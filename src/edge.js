(function() {
	const uid = require("./uid.js"),
		isSoul = require("./is-soul.js");
	
	function Edge({db,parent,path=["","e"]}) {
		Object.defineProperty(this,"db",{enumerable:false,value:db});
		this.parent = parent;
		this.path = path;
	}
	Edge.prototype.delete = async function() {
		const keys = await this.db.keys(this.path.join("!"));
		if(keys.length===0 || keys[0]==="") {
			return 0;
		}
		await this.db.removeItem(this.path.join("!"))
		return this.db.clear(this.path.join("!"));
	}
	Edge.prototype.get = function(path) {
		const parts = Array.isArray(path) ? path : path.split(".");
		let parent = this,
			part;
		path = this.path.slice();
		while(part = parts.shift()) {
			path.push(part);
			parent = new Edge({db:this.db,parent,path:path.slice()});
		}
		return parent;
	}
	Edge.prototype.put = async function(data,options={}) {
		let node = this,
			type = typeof(data);
		if(data && type==="object") {
			const id = data["#"];
			// add id if not present?
			// when here?
			// transform here
			// validate here
			// secure here
			// on here
			if(id) { // if putting a first class object, reset to root
				const cname = id.split("@")[0];
				node = await (await this.db.get(`${cname}@`)).get(id);
			}
			for(const key in data) {
				const value = data[key];
				if(value && value["#"]) {
					await this.db.put(value,options.expireRelated ? options : {});
				} else {
					//if(value && typeof(value)==="object") {
					//	value["#"] = `${value.constructor.name}@${uid()}`
					//}
					const child = await node.get(key);
					await child.put(value,options);
				}
			}
		} else {
			this.value(data,options);
		}
		return data;
	}
	Edge.prototype.restore = async function(data) {
		if(typeof(data)!=="string") {
			const path = this.path.slice();
			path.shift(); // remove ""
			if(path[0].endsWith("@")) {
				path.splice(1,1); // remove id;
			}
			// security here using edge path
			return data;
		}
		const cname = data.split("@")[0];
		if(cname) {
			const keys = await this.db.keys(`!e!${cname}@!${data}!`),
				object = {};
			for(const key of keys) {
				const parts = key.split("!"),
					value = await this.db.cache.get(key);
				let node = object;
				parts.shift(); // remove ""
				parts.splice(1,1); // remove id
				const vpath = parts.slice();
				parts.shift(); // remove class
				while(parts.length>1) { // walk down the object
					const property = parts.shift(),
					node = node[property];
				}
				node[parts[0]] = value;
			}
			return object;
		}
		return data;
	}
	Edge.prototype.value = async function(value,options={}) {
		if(arguments.length>0) {
			const vpath = this.path.slice();
			vpath.shift(); // remove ""
			if(vpath[0].endsWith("@")) {
				vpath.splice(0,1); //remove id
			}
			// transform here
			// validate here
			// secure here
			return this.db.cache.put(this.path.join("!"),value,options)
		}
		return await this.restore(await this.db.cache.get(this.path.join("!")));
	}
	module.exports = Edge;
}).call(this)