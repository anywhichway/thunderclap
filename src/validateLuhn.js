// https://en.wikipedia.org/wiki/Luhn_algorithm
(function() {
	"use strict"
	module.exports = function validateLuhn(value) {
	    var nCheck = 0, nDigit = 0, bEven = false;
	    value = value.replace(/\D/g, '');

	    for (var n = value.length - 1; n >= 0; n--) {
	        var cDigit = value.charAt(n);
	        nDigit = parseInt(cDigit, 10);

	        if (bEven) {
	            if ((nDigit *= 2) > 9) {
	                nDigit -= 9;
	            }
	        }

	        nCheck += nDigit;
	        bEven = !bEven;
	    }
	    return (nCheck % 10) === 0;
	}
}).call(this);
