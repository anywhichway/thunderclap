(function() {
	const uuid4 = require("./uuid4.js");
	
	class Entity {
		constructor(config) {
			Object.assign(this,config);
			let id = this["#"];
			if(!id) {
				id = `${this.constructor.name}@${uuid4()}`;
			}
			const meta = {"#":id};
			Object.defineProperty(this,"^",{value:meta});
			Object.defineProperty(this,"#",{enumerable:true,get() { return this["^"]["#"]||this["^"].id; }});
		}
	}
	module.exports = Entity;
}).call(this);