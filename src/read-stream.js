(function() {
	"use strict"
	const readStream = async (stream,callback) => {
		const reader = stream.getReader();
		return reader.read().then(function process({done,value}) {
			if(done) return;
		 	callback(value)
			return reader.read().then(process);
		})
	}
	module.exports = readStream;
}).call(this)