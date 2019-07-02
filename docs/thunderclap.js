/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 24);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const uuid4 = __webpack_require__(1);
	
	class Entity {
		constructor(config) {
			Object.assign(this,config);
			let id = this["#"];
			if(!id) {
				id = `${this.constructor.name}@${uuid4()}`;
			}
			const meta = {"#":id};
			Object.defineProperty(this,"^",{value:meta});
			try {
				Object.defineProperty(this,"#",{enumerable:true,get() { return this["^"]["#"]||this["^"].id; }});
			} catch(e) {
				;
			}
		}
	}
	module.exports = Entity;
}).call(this);

/***/ }),
/* 1 */
/***/ (function(module, exports) {

(function() {
	const uuid4 = () => {
    //// return uuid of form xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    let uuid = '', ii;
    for (ii = 0; ii < 32; ii += 1) {
      switch (ii) {
      case 8:
      case 20:
        uuid += '-';
        uuid += (Math.random() * 16 | 0).toString(16);
        break;
      case 12:
        uuid += '-';
        uuid += '4';
        break;
      case 16:
        uuid += '-';
        uuid += (Math.random() * 4 | 8).toString(16);
        break;
      default:
        uuid += (Math.random() * 16 | 0).toString(16);
      }
    }
    return uuid;
  }
	uuid4.is = (value) => /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value)
	module.exports = uuid4;
}).call(this);

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const Entity = __webpack_require__(0);
	
	class Schema extends Entity {
		constructor(ctor,config=ctor.schema) {
			config["#"] || (config["#"] = `Schema@${ctor.name||ctor}`);
			super(config);
		}
		async validate(object,db) {
			const errors = [];
			for(const key of Object.keys(this)) {
				if(key!=="^") {
					const validation = this[key];
					if(validation && typeof(validation)==="object") {
						for(const validationkey of Object.keys(validation)) {
							if(typeof(Schema.validations[validationkey])!=="function") {
								errors.push(new TypeError(`'${validationkey}' is not an available validation`));
							} else {
								if(key==="*") {
									for(const key of Object.keys(object)) {
										await Schema.validations[validationkey](validation[validationkey],object,key,object[key],errors,db);
									}
								} else {
									await Schema.validations[validationkey](validation[validationkey],object,key,object[key],errors,db);	
								}
													
							}
						}
					}
				}
			}
			return errors;
		}
		static create(config) {
			const cname = config["#"].split("@")[1];
			return new Schema(cname,config);
		}
	}
	Schema.validations = {
			noindex() {
				// just a dummy function so it looks like a validation, used by other code to flag non-indexed properties
			},
			required(constraint,object,key,value,errors) {
				if(constraint && value==null) {
					errors.push(new TypeError(`'${key}' is required`));
				}
			},
			type(constraint,object,key,value,errors) {
				const type = typeof(value);
				if(value!=null && type!==constraint) {
					errors.push(new TypeError(`'${key}' expected type '${constraint}' not '${type}'`));
				}
			},
			async unique(constraint,object,key,value,errors,db) {
				if(constraint) {
					const node = await db.getItem(`!${key}`),
						valuekey = JSON.stringify(value);
					if(value!==undefined && node && node[valuekey] && node[valuekey].__keyCount__ && !node[valuekey][object["#"]]) {
						errors.push(new TypeError(`'${key}' value '${value}' must be unique`));
					}
				}
			}
	}
	module.exports = Schema;
})();

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const Entity = __webpack_require__(0);
	
	class User extends Entity {
		constructor(userName,config) {
			super(config);
			this.userName = userName;
			if(!this.roles) {
				this.roles = {};
			}
			this.roles.user = true;
		}
		static create(config) {
			return new User(config.userName,config);
		}
	}
	User.schema = {
		userName: {required:true, type: "string", unique:true},
		roles: {type: "object"}
	}
	module.exports = User;
})();

/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const uuid4 = __webpack_require__(1),
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



/***/ }),
/* 5 */
/***/ (function(module, exports) {

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
				try {
					clone[key] = toSerializable(data[key],copy);
				} catch (e) {
					;
				}
			});
			if(data["^"]) {
				try {
					clone["^"] = toSerializable(data["^"],copy);
				} catch(e) {
					;
				}
			}
		}
		return clone;
	};
	module.exports = toSerializable;
}).call(this);

/***/ }),
/* 6 */
/***/ (function(module, exports) {

(function() {
	module.exports = () => Date.now().toString(36) +  Math.random().toString(36).substr(2,9);
}).call(this)

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const soundex = __webpack_require__(8),
		isSoul = __webpack_require__(4),
		isInt = __webpack_require__(9),
		isFloat = __webpack_require__(10),
		joqular = {
			$(a,f) {
				f = typeof(f)==="function" ? f : !this.options.inline || new Function("return " + f)();
				if(typeof(f)!=="function") return;
				const original = JSON.stringify(a),
					result = f.call(undefined,a);
				if(JSON.stringify(a)!==original) throw new Error("function call by $test has illegal side effect");
				return result;
			},
			$_() {
				return true;
			},
			$and(a,...tests) {
				const resolve = (a,pname,value) => joqular[pname] ? joqular[pname](a,value) : false;
				return tests.every(test => Object.keys(test).every(pname => resolve(a,pname,test[pname])));
			},
			$or(a,...tests) {
				const resolve = (a,pname,value) => joqular[pname] ? joqular[pname](a,value) : false;
				return tests.some(test => Object.keys(test).some(pname => resolve(a,pname,test[pname])));
			},
			$xor(a,...tests) {
				let found = 0;
				const resolve = (a,pname,value) => joqular[pname] ? joqular[pname](a,value) : false;
				for(const test of tests) {
					for(const pname in test) {
						if(resolve(a,pname,test[pname])) found++;
						if(found>1) return false;
					}
				}
				return found===1;
			},
			$not(a,tests) {
				const resolve = (a,pname,value) => joqular[pname](a,value),
					pnames = Object.keys(tests);
				return !pnames.every(pname => resolve(a,pname,tests[pname]));
			},
			$lt(a,b) { 
				return a < b; 
			},
			$lte(a,b) { 
				return a <= b; 
			},
			$eq(a,b,depth,unordered) {
				deepEqual(test,value,depth,unordered);
			},
			$eeq(a,b) { 
				return a === b; 
			},
			$eq(a,b) { 
				return a == b; 
			},
			$neq(a,b) { 
				return a != b; 
			},
			$neeq(a,b) { 
				return a !== b; 
			},
			$gte(a,b) { 
				return a >= b; 
			},
			$gt(a,b) { 
				return a > b; 
			},
			$near(n,target,range) {
				let f = (n,target,range) => n >= target - range && n <= target + range;
				if(typeof(range)==="string") {
					if(range.endsWith("%")) {
						f = (n,target,range) => n >= (target - Math.abs(range * target)) && n <= (target + Math.abs(range * target));
					}
					range = parseFloat(range);
				}
				if(typeof(range)==="number") {
					let ntype = typeof(n),
						ttype = typeof(target);
					if(n && ntype==="object" && target && ttype==="object" && n instanceof Date && target instanceof Date) {
						n = n.getTime();
						target = target.getTime();
						ntype = "number";
						ttype = "number";
					}
					if(ntype==="number" && ttype==="number") {
						return f(n,target,range)
					}
				}
				return false;
			},
			$between(a,lo,hi,inclusive=true) { 
				if(inclusive) return (a>=lo && a<=hi) || (a>=hi && a <=lo);
				return (a>lo && a<hi) || (a>hi && a<lo);
			},
			$outside(a,lo,hi) { 
				return !joqular.$between(a,lo,hi,true);
			},
			$in(a,array) {
				return array.includes(a);
			},
			$nin(a,array) {
				return !array.includes(a);
			},
			$includes(array,b) {
				return array.includes(b);
			},
			$excludes(array,b) {
				return !array.includes(b);
			},
			$intersects(a,b) {
				return Array.isArray(a) && Array.isArray(b) && intersection(a,b).length>0;
			},
			$disjoint(a,b) {
				return !this.$intersects(a,b);
			},
			$matches(a,b,flags) {
				b = b && typeof(b)==="object" && b instanceof RegExp ? b : new RegExp(b,flags);
				return b.test(a);
			},
			$typeof(a,b) {
				return typeof(a)===b;
			},
			$instanceof(a,b) {
				let ctor,
					cname;
				if(isSoul(a,false)) {
					cname = a.split("@")[0];
					if(cname===b) {
						return true;
					}
					ctor = joqular.db && joqular.db.ctors ? joqular.db.ctors[cname] : null;
				}
				if(cname===b) {
					return true;
				}
				b = typeof(b)==="string" && joqular.db && joqular.db.ctors ? joqular.db.ctors[b] : b;
				a = ctor ? Object.create(ctor.prototype) : a;
				return a && typeof(a)==="object" && b && typeof(b)==="function" && a instanceof b;
			},
			async $isArray() { 
				const	edges = [];
				for(const key in this.edges) {
					if(key.startsWith("Array@") && isSoul(key)) {
						edges.push(await getNextEdge(this,key,false));
					}
				}
				if(edges.length>0) {
					this.yield = edges;
					return true;
				}
			},
			$isCreditCard(a) {
				//  Visa || Mastercard || American Express || Diners Club || Discover || JCB 
				return (/^(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}| 3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/m).test(a) && validateLuhn(a);
			},
			$isEmail(a) {
				return !/(\.{2}|-{2}|_{2})/.test(a) && /^[a-z0-9][a-z0-9-_\.]+@[a-z0-9][a-z0-9-]+[a-z0-9]\.[a-z]{2,10}(?:\.[a-z]{2,10})?$/i.test(a);
			},
			$isEven(a) {
				return a % 2 === 0;
			},
			$isFloat(a) {
				return isFloat(a);
			},
			$isIPAddress(a) {
				return (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/m).test(a);
			},
			$isInt(a) {
				return isInt(a);
			},
			$isNaN(a) { 
				return isNaN(a); 
			},
			$isOdd(a) {
				return typeof(a)==="number" && !isNaN(a) && a % 2 !== 0;
			},
			$isSSN(a) {
				return /^\d{3}-?\d{2}-?\d{4}$/.test(a);
			},
			$echoes(a,b) { 
				return soundex(a)===soundex(b); 
			},
			$search(a,b) {
				return true;
			},
			$stemSearch(_,phrase) {
				const tokens = arguments[2];
				tokens.trigrams = [];
				return joqular.$search.call(this,phrase,tokens);
			},
			$self(f) {
				return f(this._value);
			},
			$valid(data,validations) {
				return true;
				return Object.keys(validations).every(validationKey => {
					const valid = joqular[validationKey](this,validations[validationKey]);
					//if(joqular.matches(validations,data)) {
					//	return true;
					//}
					if(valid) return true;
					throw(new TypeError(`failed validation ${validationKey} for ${data && typeof(data)==="object" ? JSON.stringify(data) : data}`));
				})
			},
			$date(a,b){ 
				if(typeof(a)==="number") { a = new Date(a); } 
				if(typeof(b)==="number") { b = new Date(b); }; 
				if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) {
					return a.getDate()===b.getDate();
				}
			},
			$day(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getDay()===b.getDay(); },
			$fullYear(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getFullYear()===b.getFullYear(); },
			$hours(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getHours()===b.getHours(); },
			$milliseconds(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getMilliseconds()===b.getMilliseconds(); },
			$minutes(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getMinutes()===b.getMinutes(); },
			$month(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getMonth()===b.getMonth(); },
			$seconds(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getSeconds()===b.getSeconds(); },
			$time(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getTime()===b.getTime(); },
			$UTCDate(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCDate()===b.getUTCDate(); },
			$UTCDay(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCDay()===b.getUTCDay(); },
			$UTCFullYear(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCFullYear()===b.getUTCFullYear(); },
			$UTCHours(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCHours()===b.getUTCHours(); },
			$UTCSeconds(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCSeconds()===b.getUTCSeconds(); },
			$UTCMilliseconds(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCMilliseconds()===b.getUTCMilliseconds(); },
			$UTCMinutes(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCMinutes()===b.getUTCMinutes(); },
			$UTCMonth(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getUTCMonth()===b.getUTCMonth(); },
			$year(a,b){ if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getYear()===b.getYear(); },
			matches(query,data,context,matched={}) {
				return query===data ? data : (query && typeof(query)==="object" && Object.keys(query).every((key)=> {
					const value = query[key],
						type = typeof(value),
						keytest = this.toTest(key,true);
					if(!data || typeof(data)!=="object") {
						return typeof(keytest)==="function" ? keytest.call(context,data,value) : query===data;
					}
					if(value && type==="object" && data && typeof(data)==="object" && value.$return) {
						data = data.constructor.create ? data.constructor.create(context) : Object.assign(Object.create(data.constructor.prototype),data);
					}
					const keys = keytest ? Object.keys(data).filter(key => keytest.call(context,key)) : [key];
					return keys.some((key) => {
						if(type==="function") {
							return value(data);
						}
						if(value && type==="object") {
							const entries = Object.entries(value);
							return entries.every(([ekey,evalue]) => {
									if(ekey==='$return') {
										if(typeof(evalue)==="function") {
											data[key] = evalue(context[key]);
											return true;
										}
										if(type==="object" && Object.keys(evalue).every((key) => ["configurable","enumerable","writable","get","set","value"].includes(key))) {
												Object.defineProperty(data,key,Object.assign(evalue.get ? {} : {value:context[key]},evalue));
												return true;
										}
										data[key] = evalue && typeof(evalue)==="object" ? Object.assign({},evalue) : evalue;
										return true;
									}
									const test = this.toTest(ekey);
									if(test) {
										if(test.call(context,data[key],...(Array.isArray(evalue) ? evalue : [evalue]))) {
											matched[key] = data[key];
											return true;
										}
									}
									if(data[key]!==undefined) {
										const child = {},
										value = data[key][ekey];
										if(this.matches(evalue,value,data[key],child)) {
											data[key][ekey] = value && typeof(value)==="object" ? child : value;
											return true;
										}
									}
							})
						}
						if(data[key]===value) {
							matched[key] = value;
							return true;
						}
					});
				})) ? data : undefined;
			},
			toTest(key,keyTest) {
				const type  = typeof(key);
				if(type==="function") {
					return key;
				}
				if(key && type==="object") {
					if(key instanceof RegExp) return (value) => key.test(value);
					return;
				}
				key = key.trim();
				if(joqular[key]) {
					return joqular[key];
				}
				if(key==="$_") {
					return () => true;
				}
				if(key.startsWith("$.")) {
					const fname = key.substring(2);
					return (a,b) => typeof(a[fname])==="function" ? a[fname](b) : false;
				}
				if(keyTest) {
					if(key[0]==="/") {
						const i = key.lastIndexOf("/");
						if(i>0) {
							try {
								const regexp = new RegExp(key.substring(1,i),key.substring(i+1));
								return (value) => regexp.test(value);
							} catch(e) {
								return; 
							}
						}
						return;
					}
					if(key[0]==="{" && key[key.length-1]==="}") {
						key = key.replace(/([{,])(\s*)([A-Za-z0-9_\-\$]+?)\s*:/g, '$1"$3":')
						const spec = JSON.parse(key);
						return (value) => {
							return joqular.matches(spec,value);
						}
					}
					if(key.startsWith("=>")) {
						key = `(value)=>value${key.substring(2)}`
					} else if(["==","===",">",">=","=<","<","!"].some((op) => key.startsWith(op))) {
						key = `(value)=>value${key}`
					} else if(key[0]==="(" && key[key.length-1]==")") {
						key = `(value)=>${key}`
					}
					if(key.includes("=>") && typeof(window)!=="undefined") {
						try {
							return new Function("return " + key)();
						} catch(e) {
							return () => true;
						}
					}
				}
			}
		}
		joqular.$text = joqular.$search;
		joqular.$type = joqular.$typeof;
		joqular.$ne = joqular.$neq;
		joqular.$where = joqular.$;
		
	module.exports = joqular;
}).call(this);

/***/ }),
/* 8 */
/***/ (function(module, exports) {

(function() {
	//soundex from https://gist.github.com/shawndumas/1262659
	const soundex = (a) => {a=(a+"").toLowerCase().split("");var c=a.shift(),b="",d={a:"",e:"",i:"",o:"",u:"",b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6},b=c+a.map(function(a){return d[a]}).filter(function(a,b,e){return 0===b?a!==d[c]:a!==e[b-1]}).join("");return(b+"000").slice(0,4).toUpperCase()};
	module.exports = soundex;
}).call(this);

/***/ }),
/* 9 */
/***/ (function(module, exports) {

(function() {
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 === 0;
}).call(this)

/***/ }),
/* 10 */
/***/ (function(module, exports) {

(function() {
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 !== 0;
}).call(this)

/***/ }),
/* 11 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		browser: [
			{
				when: {testWhenBrowser:{$eq:true}},
				transform: async (data,pattern) => {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call: async (data,pattern) => {
					
				}
			}
		],
		cloud: [
			{
				when: {testWhen:{$eq:true}},
				transform: async (data,pattern) => {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call: async (data,pattern) => {
					
				}
			}
		],
		worker: [
			
		]
	}
}).call(this);

/***/ }),
/* 12 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		browser: {
			
		},
		cloud: {
			securedTestFunction() {
				return "If you see this, there may be a security leak";
			},
			getDate() {
				return new Date();
			}
		},
		worker: {
			
		}
	}
}).call(this);

/***/ }),
/* 13 */,
/* 14 */,
/* 15 */,
/* 16 */,
/* 17 */,
/* 18 */,
/* 19 */,
/* 20 */,
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

(function() {
	"use strict"
	const uid = __webpack_require__(6),
		joqular = __webpack_require__(7),
		toSerializable = __webpack_require__(5),
		create = __webpack_require__(25),
		Schema = __webpack_require__(2),
		User = __webpack_require__(3),
		functions = __webpack_require__(12).browser,
		when = __webpack_require__(11).browser;
	
	var fetch;
	if(typeof(fetch)==="undefined") {
		fetch = __webpack_require__(27);
	}
	
	// "https://cloudworker.io/db.json";
	//"https://us-central1-reasondb-d3f23.cloudfunctions.net/query/";
	class Thunderclap  {
		constructor({endpoint,user,headers}={}) {
			this.ctors = {};
			this.schema = {};
			this.endpoint = endpoint;
			this.headers = Object.assign({},headers);
			this.headers["X-Auth-Username"] = user ? user.username : "anonymous";
			this.headers["X-Auth-Password"] = user ? user.password : "";
			this.register(Array);
			this.register(Date);
			this.register(URL);
			this.register(User);
			this.register(Schema);
			Object.keys(functions).forEach((key) => {
				if(this[key]) {
					throw new Error(`Attempt to redefine Thunderclap function: ${key}`);
				}
				const f = async (...args) => {
					const signature = [key];
					for(let i=0;i<functions[key].length;i++) {
						signature.push(encodeURIComponent(JSON.stringify(toSerializable(arg[i]))))
					}
					return fetch(`${this.endpoint}/db.json?${JSON.stringify(signature)}`,{headers:this.headers})
		    			.then((response) => response.json())
		    			.then((data) => create(data,this.ctors))
				}
				Object.defineProperty(this,key,{enumerable:false,configurable:true,writable:true,value:f})
			})
		}
		async clear(key="") {
			return fetch(`${this.endpoint}/db.json?["clear",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
	    		.then((response) => response.json())
		}
		async createUser(userName,password,reAuth) {
			return fetch(`${this.endpoint}/db.json?["createUser",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))}]`,{headers:this.headers})
	    	.then((response) => response.json()) // change to text(), try to parse, thow error if can't
	    	.then((data) => create(data,this.ctors))
	    	.then((user) => {
	    		if(reAuth || !this.headers["X-Auth-Username"]) {
	    			this.headers["X-Auth-Username"] = user.username;
	    			this.headers["X-Auth-Password"] = user.password;
	    		}
	    		return user;
	    	});
		}
		async entries(prefix="",options) {
			if(!options) {
				options = this.keys.options || {};
			}
			return fetch(`${this.endpoint}/db.json?["entries"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.json())
	    		.then((array) => { 
	    			const cursor = array.pop();
	    			if(!cursor) {
	    				delete this.keys.options;
	    			} else {
	    				if(!this.keys.options) {
	    					this.keys.options = options;
	    				}
	    				this.keys.options.cursor = cursor;
	    			}
	    			return array;
	    		})
		}
		async getItem(key) {
		    return fetch(`${this.endpoint}/db.json?["getItem",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async getSchema(className) {
		    return fetch(`${this.endpoint}/db.json?["getSchema",${encodeURIComponent(JSON.stringify(className))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async hasKey(key) {
			if(key) {
				return fetch(`${this.endpoint}/db.json?["hasKey",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
	    		.then((response) => response.json())
			}
			return false;
		}
		async keys(prefix="",options) {
			if(!options) {
				options = this.keys.options || {};
			}
			return fetch(`${this.endpoint}/db.json?["keys"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.json())
	    		.then((array) => { 
	    			const cursor = array.pop();
	    			if(!cursor) {
	    				delete this.keys.options;
	    			} else {
	    				if(!this.keys.options) {
	    					this.keys.options = options;
	    				}
	    				this.keys.options.cursor = cursor;
	    			}
	    			return array;
	    		})
		}
		async putItem(object,options={}) {
			this.register(object.constructor);
			let data = Object.assign({},object),
				id = data["#"];
			if(!id) {
				id = data["#"]  = `${object.constructor.name}@${uid()}`;
			}
			const cname = id.split("@")[0];
			let schema = this.schema[cname];
			if(!schema) {
				this.schema[cname] = schema = await this.getSchema(cname) || "anonymous";
			}
			if(schema && schema!=="anonymous") {
				schema = new Schema(cname,schema);
				const errors = await schema.validate(object,this);
				if(errors.length>0) {
					const error = new Error();
					error.errors = errors;
					throw error;
				}
			}
			const matches = when.reduce((accum,item) => {
				if(joqular.matches(item.when,object)) {
					accum.push(item);
				}
				return accum;
			},[]);
			for(const match of matches) {
				if(match.transform) {
					data = await match.transform.call(this,data,match.when);
				}
			}
			if(!data || typeof(data)!=="object") {
				return;
			}
			const result = fetch(`${this.endpoint}/db.json?["putItem",${encodeURIComponent(JSON.stringify(toSerializable(data)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((object) => create(object,this.ctors));
			for(const match of matches) {
				if(match.call) {
					data = await match.call.call(this,await result,match.when);
				}
			}
			return result;
		}
		async query(object,{verify,partial}={}) {
			return fetch(`${this.endpoint}/db.json?["query",${encodeURIComponent(JSON.stringify(toSerializable(object)))},${partial||false}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
	    		.then((objects) => create(objects,this.ctors))
	    		.then((objects) => verify ? objects.filter((result) => joqular.matches(object,result)!==undefined) : objects);
		}
		register(ctor) {
			let name;
			if(typeof(ctor)==="string") {
				name = ctor;
				ctor = Function(`return ${ctor}`);
			} else {
				name = ctor.name;
			}
			if(name && name!=="anonymous") {
				return this.ctors[name] = ctor;
			}
		}
		async removeItem(keyOrObject) {
			return fetch(`${this.endpoint}/db.json?["removeItem",${encodeURIComponent(JSON.stringify(toSerializable(keyOrObject)))}]`,{headers:this.headers})
				.then((response) => response.json())
				.then((data) => create(data,this.ctors))
		}
		async setItem(key,data,options={}) {
			if(data && typeof(data)==="object") {
				this.register(data.constructor);
			}
			return fetch(`${this.endpoint}/db.json?["setItem",${encodeURIComponent(JSON.stringify(key))},${encodeURIComponent(JSON.stringify(toSerializable(data)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => create(data,this.ctors));
		}
		async setSchema(className,config) {
			const object = new Schema(className,config);
			return this.putItem(object);
		}
		async values(prefix="",options) {
			if(!options) {
				options = this.keys.options || {};
			}
			return fetch(`${this.endpoint}/db.json?["values"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.json())
	    		.then((array) => { 
	    			const cursor = array.pop();
	    			if(!cursor) {
	    				delete this.keys.options;
	    			} else {
	    				if(!this.keys.options) {
	    					this.keys.options = options;
	    				}
	    				this.keys.options.cursor = cursor;
	    			}
	    			return array;
	    		})
		}
	}
	
	if(true) module.exports = Thunderclap;
	if(typeof(window)!=="undefined") window.Thunderclap = Thunderclap;
}).call(this);


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const fromSerializable = __webpack_require__(26),
		create = (data,ctors={}) => {
			const type = typeof(data);
			if(type==="string") {
				return fromSerializable(data);
			}
			if(!data || typeof(data)!=="object") return data;
			Object.keys(data).forEach(key => data[key] = create(data[key],ctors));
			const id = data["#"] || (data["^"] ? data["^"]["#"]||data["^"].id : ""),
				cname = typeof(id)==="string" ? id.split("@")[0] : null,
				ctor = cname ? ctors[cname] : null;
			if(!ctor) {
				return data;
			}
			let instance;
			if(ctor.name!=="Object" && ctor.create) {
				instance = ctor.create(data);
			} else {
				instance = Object.create(ctor.prototype);
				Object.assign(instance,data);
			}
			if(!instance["^"]) {
				const meta = {id};
				Object.defineProperty(instance,"^",{value:meta});
			}
			try {
				Object.defineProperty(instance,"#",{enumerable:true,get() { return this["^"]["#"]||this["^"].id; }});
			} catch(e) {
				// ignore if already defined
			}
			return instance;
		}
	module.exports = create;
}).call(this);

/***/ }),
/* 26 */
/***/ (function(module, exports) {

(function() {
	const fromSerializable = (data) => {
		const type = typeof(data);
		if(data==="@undefined") {
			return undefined;
		}
		if(data==="@Infinity") {
			return Infinity;
		}
		if(data==="@-Infinity") {
			return -Infinity;
		}
		if(data==="@NaN") {
			return NaN;
		}
		if(type==="string") {
			if(data.startsWith("Date@")) {
				return new Date(parseInt(data.substring(5)));
			}
		}
		if(data && type==="object") {
			Object.keys(data).forEach((key) => {
				data[key] = fromSerializable(data[key]);
			});
			if(data["^"]) {
				data["^"] = fromSerializable(data["^"]);
			}
		}
		return data;
	}
	module.exports = fromSerializable;
}).call(this);

/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


// ref: https://github.com/tc39/proposal-global
var getGlobal = function () {
	// the only reliable means to get the global object is
	// `Function('return this')()`
	// However, this causes CSP violations in Chrome apps.
	if (typeof self !== 'undefined') { return self; }
	if (typeof window !== 'undefined') { return window; }
	if (typeof global !== 'undefined') { return global; }
	throw new Error('unable to locate global object');
}

var global = getGlobal();

module.exports = exports = global.fetch;

// Needed for TypeScript and Webpack.
exports.default = global.fetch.bind(global);

exports.Headers = global.Headers;
exports.Request = global.Request;
exports.Response = global.Response;

/***/ })
/******/ ]);