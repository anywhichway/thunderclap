(function() {
	"use strict"
	const Entity = require("./entity.js"),
		Coordinates = require("./coordinates.js");
	class Position extends Entity {
		constructor({coords,timestamp}) {
			super();
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
	Position.schema = {
		coords: {required:true, type: "object"},
		timestamp: {required:true, type:"number"}
	}
	module.exports = Position;
}).call(this);