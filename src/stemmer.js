(function() {
	"use strict"
	// stemmer from https://github.com/words/stemmer MIT License, Titus Wormer
	/* Character code for `y`. */
	var CC_Y = 'y'.charCodeAt(0);

	/* Standard suffix manipulations. */
	var step2list = {
	  ational: 'ate',
	  tional: 'tion',
	  enci: 'ence',
	  anci: 'ance',
	  izer: 'ize',
	  bli: 'ble',
	  alli: 'al',
	  entli: 'ent',
	  eli: 'e',
	  ousli: 'ous',
	  ization: 'ize',
	  ation: 'ate',
	  ator: 'ate',
	  alism: 'al',
	  iveness: 'ive',
	  fulness: 'ful',
	  ousness: 'ous',
	  aliti: 'al',
	  iviti: 'ive',
	  biliti: 'ble',
	  logi: 'log'
	};

	var step3list = {
	  icate: 'ic',
	  ative: '',
	  alize: 'al',
	  iciti: 'ic',
	  ical: 'ic',
	  ful: '',
	  ness: ''
	};

	/* Consonant-vowel sequences. */
	var consonant = '[^aeiou]';
	var vowel = '[aeiouy]';
	var consonantSequence = '(' + consonant + '[^aeiouy]*)';
	var vowelSequence = '(' + vowel + '[aeiou]*)';

	var MEASURE_GT_0 = new RegExp(
	  '^' + consonantSequence + '?' + vowelSequence + consonantSequence
	);

	var MEASURE_EQ_1 = new RegExp(
	  '^' + consonantSequence + '?' + vowelSequence + consonantSequence +
	  vowelSequence + '?$'
	);

	var MEASURE_GT_1 = new RegExp(
	  '^' + consonantSequence + '?' +
	  '(' + vowelSequence + consonantSequence + '){2,}'
	);

	var VOWEL_IN_STEM = new RegExp(
	  '^' + consonantSequence + '?' + vowel
	);

	var CONSONANT_LIKE = new RegExp(
	  '^' + consonantSequence + vowel + '[^aeiouwxy]$'
	);

	/* Exception expressions. */
	var SUFFIX_LL = /ll$/;
	var SUFFIX_E = /^(.+?)e$/;
	var SUFFIX_Y = /^(.+?)y$/;
	var SUFFIX_ION = /^(.+?(s|t))(ion)$/;
	var SUFFIX_ED_OR_ING = /^(.+?)(ed|ing)$/;
	var SUFFIX_AT_OR_BL_OR_IZ = /(at|bl|iz)$/;
	var SUFFIX_EED = /^(.+?)eed$/;
	var SUFFIX_S = /^.+?[^s]s$/;
	var SUFFIX_SSES_OR_IES = /^.+?(ss|i)es$/;
	var SUFFIX_MULTI_CONSONANT_LIKE = /([^aeiouylsz])\1$/;
	var STEP_2 = new RegExp(
	  '^(.+?)(ational|tional|enci|anci|izer|bli|alli|entli|eli|ousli|' +
	  'ization|ation|ator|alism|iveness|fulness|ousness|aliti|iviti|' +
	  'biliti|logi)$'
	);
	var STEP_3 = /^(.+?)(icate|ative|alize|iciti|ical|ful|ness)$/;
	var STEP_4 = new RegExp(
	  '^(.+?)(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ou|ism|ate|' +
	  'iti|ous|ive|ize)$'
	);

	/* Stem `value`. */
	module.exports = function stemmer(value) {
	  var firstCharacterWasLowerCaseY;
	  var match;

	  value = String(value).toLowerCase();

	  /* Exit early. */
	  if (value.length < 3) {
	    return value;
	  }

	  /* Detect initial `y`, make sure it never matches. */
	  if (value.charCodeAt(0) === CC_Y) {
	    firstCharacterWasLowerCaseY = true;
	    value = 'Y' + value.substr(1);
	  }

	  /* Step 1a. */
	  if (SUFFIX_SSES_OR_IES.test(value)) {
	    /* Remove last two characters. */
	    value = value.substr(0, value.length - 2);
	  } else if (SUFFIX_S.test(value)) {
	    /* Remove last character. */
	    value = value.substr(0, value.length - 1);
	  }

	  /* Step 1b. */
	  if (match = SUFFIX_EED.exec(value)) {
	    if (MEASURE_GT_0.test(match[1])) {
	      /* Remove last character. */
	      value = value.substr(0, value.length - 1);
	    }
	  } else if ((match = SUFFIX_ED_OR_ING.exec(value)) && VOWEL_IN_STEM.test(match[1])) {
	    value = match[1];

	    if (SUFFIX_AT_OR_BL_OR_IZ.test(value)) {
	      /* Append `e`. */
	      value += 'e';
	    } else if (SUFFIX_MULTI_CONSONANT_LIKE.test(value)) {
	      /* Remove last character. */
	      value = value.substr(0, value.length - 1);
	    } else if (CONSONANT_LIKE.test(value)) {
	      /* Append `e`. */
	      value += 'e';
	    }
	  }

	  /* Step 1c. */
	  if ((match = SUFFIX_Y.exec(value)) && VOWEL_IN_STEM.test(match[1])) {
	    /* Remove suffixing `y` and append `i`. */
	    value = match[1] + 'i';
	  }

	  /* Step 2. */
	  if ((match = STEP_2.exec(value)) && MEASURE_GT_0.test(match[1])) {
	    value = match[1] + step2list[match[2]];
	  }

	  /* Step 3. */
	  if ((match = STEP_3.exec(value)) && MEASURE_GT_0.test(match[1])) {
	    value = match[1] + step3list[match[2]];
	  }

	  /* Step 4. */
	  if (match = STEP_4.exec(value)) {
	    if (MEASURE_GT_1.test(match[1])) {
	      value = match[1];
	    }
	  } else if ((match = SUFFIX_ION.exec(value)) && MEASURE_GT_1.test(match[1])) {
	    value = match[1];
	  }

	  /* Step 5. */
	  if (
	    (match = SUFFIX_E.exec(value)) &&
	    (MEASURE_GT_1.test(match[1]) || (MEASURE_EQ_1.test(match[1]) && !CONSONANT_LIKE.test(match[1])))
	  ) {
	    value = match[1];
	  }

	  if (SUFFIX_LL.test(value) && MEASURE_GT_1.test(value)) {
	    value = value.substr(0, value.length - 1);
	  }

	  /* Turn initial `Y` back to `y`. */
	  if (firstCharacterWasLowerCaseY) {
	    value = 'y' + value.substr(1);
	  }

	  return value;
	}
			
}).call(this);
