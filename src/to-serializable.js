(function() {
	const toSerializable = (data) => {
		const type = typeof(data);
		if(data===undefined) {
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
				data[key] = toSerializable(data[key]);
			});
			if(data["^"]) {
				data["^"] = toSerializable(data["^"]);
			}
		}
		return data;
	};
	module.exports = toSerializable;
}).call(this);