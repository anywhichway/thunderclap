(function() {
	const fromSerializable = require("./from-serializable.js"),
		create = (data,ctors={}) => {
			const type = typeof(data);
			if(type==="string") {
				return fromSerializable(data);
			}
			if(!data || typeof(data)!=="object") return data;
			Object.keys(data).forEach(key => data[key] = create(data[key]));
			const id = data["#"] || (data["^"] ? data["^"]["#"]||data["^"].id : ""),
				cname = typeof(id)==="string" ? id.split("@")[0] : null,
				ctor = cname ? ctors[cname] : null;
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
	module.exports = create;
}).call(this);