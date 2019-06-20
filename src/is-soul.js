(function() {
	const uuid4 = require("./uuid4.js"),
		isSoul = (value,checkUUID=true) => {
			if(typeof(value)==="string") {
				const parts = value.split("@"),
					isnum = !isNaN(parseInt(parts[1]));
				return parts.length===2 && parts[0]!=="" && ((parts[0]==="Date" && isnum) || (parts[0]!=="Date" && (!checkUUID || uuid4.is(parts[1]))));
			}
			return false;
		};
	module.exports = isSoul;
})();

