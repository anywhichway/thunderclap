(function() {
	"use strict"
	const fromSerializable = require("./from-serializable.js");
	async function create(data,ctors={}) {
		const type = typeof(data);
		if(type==="string") {
			return fromSerializable(data);
		}
		if(!data || typeof(data)!=="object") return data;
		for(const key in data) {
			data[key] = await create(data[key],ctors)
		}
		const id = data["#"] || (data["^"] ? data["^"]["#"]||data["^"].id : ""),
			cname = typeof(id)==="string" ? id.split("@")[0] : null,
			ctor = cname ? ctors[cname] : null;
		if(!ctor) {
			return data;
		}
		let instance;
		if(ctor.name!=="Object" && ctor.create) {
			instance = await ctor.create(data);
		} else {
			instance = Object.create(ctor.prototype);
			Object.assign(instance,data);
		}
		if(!instance["^"]) {
			const meta = {id};
			Object.defineProperty(instance,"^",{value:meta});
		}
		try {
			Object.defineProperty(instance,"#",{enumerable:true,get() { return this["^"]["#"]||this["^"].id; }});
		} catch(e) {
			// ignore if already defined
		}
		return instance;
	}
	module.exports = create;
}).call(this);