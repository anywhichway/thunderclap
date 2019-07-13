(function() {
	"use strict"
	const Entity = require("./entity.js"),
		Position = require("./position.js");
	class Coordinates extends Entity {
		constructor(coords) {
			super();
			Object.assign(this,coords);
		}
	}
	Coordinates.create = async (coords) => {
		if(coords) {
			return new Coordinates(coords);
		}
		const position = await Position.create();
		return new Coordinates(position.coords);
	}
	Coordinates.schema = {
		latitude: {required:true, type: "number"},
		longitude: {required:true, type: "number"}
	}
	module.exports = Coordinates;
}).call(this);