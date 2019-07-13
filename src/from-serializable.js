(function() {
	"use strict"
	const Position = require("./position.js");
	function fromSerializable(data,classes={}) {
		const type = typeof(data);
		if(data==="@undefined") {
			return undefined;
		}
		if(data==="@Infinity") {
			return Infinity;
		}
		if(data==="@-Infinity") {
			return -Infinity;
		}
		if(data==="@NaN") {
			return NaN;
		}
		if(type==="string") {
			if(data.startsWith("Date@")) {
				return new Date(parseInt(data.substring(5)));
			}
			for(const cname in classes) {
				if(data.startsWith(`${cname}@`) && classes[cname].deserialize) {
					return classes[cname].deserialize(data);
				}
			}
		}
		if(data && type==="object") {
			Object.keys(data).forEach((key) => {
				data[key] = fromSerializable(data[key]);
			});
			if(data["^"]) {
				data["^"] = fromSerializable(data["^"]);
			}
		}
		return data;
	}
	module.exports = fromSerializable;
}).call(this);