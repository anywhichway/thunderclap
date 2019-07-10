(function() {
	const Position = require("./position.js");
	class Coordinates {
		constructor(coords) {
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
	module.exports = Coordinates;
}).call(this);