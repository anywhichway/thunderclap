(function() {
	"use strict"
	module.exports = function uid() { return Date.now().toString(36) +  Math.random().toString(36).substr(2,9); }
}).call(this)