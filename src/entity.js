(function() {
	const uid = require("./uid.js");
	
	class Entity {
		constructor(config) {
			Object.assign(this,config);
			let id = this["#"];
			if(!id) {
				id = `${this.constructor.name}@${uid()}`;
			}
			const meta = {"#":id};
			Object.defineProperty(this,"^",{value:meta});
			try {
				Object.defineProperty(this,"#",{enumerable:true,get() { return this["^"]["#"]||this["^"].id; }});
			} catch(e) {
				;
			}
		}
	}
	module.exports = Entity;
}).call(this);