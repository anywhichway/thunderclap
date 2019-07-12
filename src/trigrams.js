(function() {
	module.exports = function trigrams(tokens) {
		const grams = [];
		tokens = Array.isArray(tokens) ? tokens : [tokens];
		tokens.forEach((str) => {
			for(let i=0;i<str.length-2;i++) {
				grams.push(str.substring(i,i+3));
			}
		})
		return grams;
	}
}).call(this);