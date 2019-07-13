(function() {
	"use strict"
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 !== 0;
}).call(this)