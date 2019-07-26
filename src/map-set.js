(function() {
	"use strict";
	const uid = require("./uid.js");
	class MapSet {
		constructor({id,set}={}) {
			if(!id) {
				id = `MapSet@${uid()}`;
			}
			Object.assign(this,{"#":id,set:Array.from(set)});
		}
	}
	MapSet.create = (config) => {
		const set = new Set(config.set||[]);
		set["#"] = config["#"];
		return set;
	}
	module.exports = MapSet;
}).call(this);