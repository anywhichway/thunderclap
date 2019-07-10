(function() {
	const Coordinates = require("./coordinates.js");
	class Position {
		constructor({coords,timestamp}) {
			const {latitude,longitude,altitude,accuracy,altitudeAccuracy,heading} = coords;
			this.coords = {
				latitude,longitude,altitude,accuracy,altitudeAccuracy,heading	
			};
			if(timestamp) {
				this.timestamp = timestamp;
			}
		}
	}
	Position.create = async ({coords,timestamp=Date.now()}={}) => {
		if(coords) {
			return new Position({coords:new Coordinates(coords),timestamp})
		}
		return new Promise((resolve,reject) => {
			navigator.geolocation.getCurrentPosition(
					(position) => {
						resolve(new Position(position));
					},
					(err) => { 
						reject(err); 
					});
		});
	}
	module.exports = Position;
}).call(this);