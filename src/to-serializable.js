(function() {
	"use strict"
	const toSerializable = (data,copy) => {
		const type = typeof(data),
			clone = copy && data && type==="object" ? Array.isArray(data) ? [] : {} : data;
		if(data===undefined || type==="Undefined") {
			return "@undefined";
		}
		if(data===Infinity) {
			return "@Infinity";
		}
		if(data===-Infinity) {
			return "@-Infinity";
		}
		if(type==="number" && isNaN(data)) {
			return "@NaN";
		}
		if(data && type==="object") {
			if(data instanceof Date) {
				return `Date@${data.getTime()}`;
			}
			Object.keys(data).forEach((key) => {
				clone[key] = toSerializable(data[key],copy);
			});
			if(data["^"]) {
				clone["^"] = toSerializable(data["^"],copy);
			}
		}
		return clone;
	};
	module.exports = toSerializable;
}).call(this);