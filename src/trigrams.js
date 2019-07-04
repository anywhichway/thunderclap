(function() {
	module.exports = function trigrams(tokens) {
		const grams = [],
			str = Array.isArray(tokens) ? tokens.join("") : tokens+"";
		for(let i=0;i<str.length-2;i++) {
			grams.push(str.substring(i,i+3));
		}
		return grams;
	}
}).call(this);