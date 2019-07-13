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
	"use strict"
	const Entity = __webpack_require__(3),
		Coordinates = __webpack_require__(2);
	class Position extends Entity {
		constructor({coords,timestamp}) {
			super();
			const {latitude,longitude,altitude,accuracy,altitudeAccuracy,heading} = coords;
			this.coords = {
				latitude,longitude,altitude,accuracy,altitudeAccuracy,heading	
			};
			if(timestamp) {
				this.timestamp = timestamp;
			}
		}
	}
	Position.create = async ({coords,timestamp=Date.now()}={}) => {
		if(coords) {
			return new Position({coords:new Coordinates(coords),timestamp})
		}
		return new Promise((resolve,reject) => {
			navigator.geolocation.getCurrentPosition(
					(position) => {
						resolve(new Position(position));
					},
					(err) => { 
						reject(err); 
					});
		});
	}
	Position.schema = {
		coords: {required:true, type: "object"},
		timestamp: {required:true, type:"number"}
	}
	module.exports = Position;
}).call(this);

/***/ }),
/* 1 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = function uid() { return Date.now().toString(36) +  Math.random().toString(36).substr(2,9); }
}).call(this)

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(3),
		Position = __webpack_require__(0);
	class Coordinates extends Entity {
		constructor(coords) {
			super();
			Object.assign(this,coords);
		}
	}
	Coordinates.create = async (coords) => {
		if(coords) {
			return new Coordinates(coords);
		}
		const position = await Position.create();
		return new Coordinates(position.coords);
	}
	Coordinates.schema = {
		latitude: {required:true, type: "number"},
		longitude: {required:true, type: "number"}
	}
	module.exports = Coordinates;
}).call(this);

/***/ }),
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const uid = __webpack_require__(1);
	
	class Entity {
		constructor(config) {
			Object.assign(this,config);
			let id = this["#"];
			if(!id) {
				id = `${this.constructor.name}@${uid()}`;
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
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const uuid4 = __webpack_require__(9),
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
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(3);
	
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
	/* 	validations parrallel property names in schema definitions
		they can have the signature (constraint,object,key,value,errors,db)
		`constraint` is the value of the constraint property, e.g. `required` would be `true` or `false`
		`object` is the object being validated
		`key` is the property being validated
		`value` is the value of the property being validated
		`error` is an array of errors into which cvalidation errors should be pushed
		`db` is the database, in case it is needed to support validation
	*/
	Schema.validations = {
			matches(constraint,object,key,value,errors) {
				if(!constraint.test(value)) {
					errors.push(new TypeError(`"${value}" does not match "${constraint}"`));
				}
			},
			noindex() {
				// just a dummy function so it looks like a validation, used by other code to flag non-indexed properties
			},
			oneof(constraint,object,key,value,errors) {
				if(value!=null && !constraint.includes(value)) {
					errors.push(new TypeError(`"${key}" expected type ${JSON.stringify(constraint)} not "${type}"`));
				}
			},
			required(constraint,object,key,value,errors) {
				if(constraint && value==null) {
					errors.push(new TypeError(`"${key}" is required`));
				}
			},
			type(constraint,object,key,value,errors) {
				const type = typeof(value);
				if(value!=null && Array.isArray(constraint) ? !constraint.includes(type) : type!==constraint) {
					errors.push(new TypeError(`"${key}" expected type ${JSON.stringify(constraint)} not "${type}"`));
				}
			},
			async unique(constraint,object,key,value,errors,db) {
				if(constraint) {
					const node = await db.getItem(`!${key}`),
						valuekey = JSON.stringify(value);
					if(value!==undefined && node && node[valuekey] && node[valuekey].__keyCount__ && !node[valuekey][object["#"]]) {
						errors.push(new TypeError(`"${key}" value "${value}" must be unique`));
					}
				}
			},
			async validate(constraint,object,key,value,errors,db) {
				await constraint(object,key,value,errors,db);
			}
	}
	module.exports = Schema;
})();

/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(3);
	
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
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	/*
	MIT License
	Copyright AnyWhichWay, LLC 2019
	 */
	const soundex = __webpack_require__(8),
		isSoul = __webpack_require__(4),
		isInt = __webpack_require__(10),
		isFloat = __webpack_require__(11),
		validateLuhn = __webpack_require__(12),
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
					range = parseFloat(range) / 100;
				}
				if(typeof(range)==="number" && !isNaN(range)) {
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
			$in(a,...array) {
				return array.includes(a);
			},
			$nin(a,...array) {
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
				return !joqular.$intersects(a,b);
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
				b = typeof(b)==="string" && joqular.db && joqular.db.ctors ? joqular.db.ctors[b] : b;
				a = ctor ? Object.create(ctor.prototype) : a;
				return a && typeof(a)==="object" && b && typeof(b)==="function" && a instanceof b;
			},
			$isa(a,b) {
				let ctor,
					cname;
				if(isSoul(a,false)) {
					cname = a.split("@")[0];
					if(cname===b) {
						return true;
					}
					ctor = joqular.db && joqular.db.ctors ? joqular.db.ctors[cname] : null;
				}
				return b.name===cname;
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
			$isCreditCard(a,bool) {
				//  Visa || Mastercard || American Express || Diners Club || Discover || JCB 
				return bool===((/^(?:4[0-9]{12}(?:[0-9]{3})?|(?:5[1-5][0-9]{2}|222[1-9]|22[3-9][0-9]|2[3-6][0-9]{2}|27[01][0-9]|2720)[0-9]{12}|3[47][0-9]{13}| 3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11})$/m).test(a) && validateLuhn(a));
			},
			$isEmail(a,bool) {
				return bool==(!/(\.{2}|-{2}|_{2})/.test(a) && /^[a-z0-9][a-z0-9-_\.]+@[a-z0-9][a-z0-9-]+[a-z0-9]\.[a-z]{2,10}(?:\.[a-z]{2,10})?$/i.test(a));
			},
			$isEven(a,bool) {
				return bool === (a % 2 === 0);
			},
			$isFloat(a,bool) {
				return bool===isFloat(a);
			},
			$isIPAddress(a,bool) {
				return bool===((/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/m).test(a));
			},
			$isInt(a,bool) {
				return bool===isInt(a);
			},
			$isNaN(a,bool) { 
				return bool===isNaN(a); 
			},
			$isOdd(a,bool) {
				return bool===(typeof(a)==="number" && !isNaN(a) && a % 2 !== 0);
			},
			$isSSN(a,bool) {
				return bool===(/^\d{3}-?\d{2}-?\d{4}$/.test(a));
			},
			$echoes(a,b) { 
				return soundex(a)===soundex(b); 
			},
			$search(a,b) { // implemented internal to Thunderclap in thunderhead.js
				return true;
			},
			$stemSearch(_,phrase) {
				const tokens = arguments[2];
				tokens.trigrams = [];
				return joqular.$search.call(this,phrase,tokens);
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
	"use strict"
	//soundex from https://gist.github.com/shawndumas/1262659
	const soundex = (a) => {a=(a+"").toLowerCase().split("");var c=a.shift(),b="",d={a:"",e:"",i:"",o:"",u:"",b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6},b=c+a.map(function(a){return d[a]}).filter(function(a,b,e){return 0===b?a!==d[c]:a!==e[b-1]}).join("");return(b+"000").slice(0,4).toUpperCase()};
	module.exports = soundex;
}).call(this);

/***/ }),
/* 9 */
/***/ (function(module, exports) {

(function() {
	"use strict"
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
/* 10 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 === 0;
}).call(this)

/***/ }),
/* 11 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 !== 0;
}).call(this)

/***/ }),
/* 12 */
/***/ (function(module, exports) {

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


/***/ }),
/* 13 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	function toSerializable(data,copy) {
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
			if(data.serialize) {
				return data.serialize();
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
/* 14 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Position = __webpack_require__(0);
	function fromSerializable(data,classes={}) {
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
			for(const cname in classes) {
				if(data.startsWith(`${cname}@`) && classes[cname].deserialize) {
					return classes[cname].deserialize(data);
				}
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
/* 15 */
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
			// not yet implemented
		]
	}
}).call(this);

/***/ }),
/* 16 */
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
/* 17 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		// Add class declaration using require
		// <cname>: require(".<path>/<myClass>.js")
	}
}).call(this);

/***/ }),
/* 18 */
/***/ (function(module, exports) {

(function() {
		module.exports = {
		 accountId: "92dcaefc91ea9f8eb9632c01148179af",
		 namespaceId: "34dca41478b943a0880fe24798d39eb0",
		 authEmail: "syblackwell@anywhichway.com",
		 authKey: "bb03a6b1c8604b0541f84cf2b70ea9c45953c",
		 dboPassword: "dbo"
		}
	}).call(this)

/***/ }),
/* 19 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	function bufferToHexString(buffer) {
	    var s = '', h = '0123456789abcdef';
	    (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; });
	    return s;
	}
	async function hashPassword(password,iterations,salt) {
		salt || (salt = crypto.getRandomValues(new Uint8Array(8)));
	    const encoder = new TextEncoder('utf-8'),
	    	passphraseKey = encoder.encode(password),
	    	key = await crypto.subtle.importKey(
			  'raw', 
			  passphraseKey, 
			  {name: 'PBKDF2'}, 
			  false, 
			  ['deriveBits', 'deriveKey']
			),
			webKey = await crypto.subtle.deriveKey(
			    {
			    	name: 'PBKDF2',
			    	salt,
			    	iterations,
			    	hash: 'SHA-256'
			    },
			    key,
			    // Don't actually need a cipher suite,
			    // but api requires it is specified.
			    { name: 'AES-CBC', length: 256 },
			    true,
			    [ "encrypt", "decrypt" ]
			), 
			buffer = await crypto.subtle.exportKey("raw", webKey);
		return {
			hash: bufferToHexString(buffer),
			salt: bufferToHexString(salt)
		}
	}
	module.exports = hashPassword;
}).call(this)

/***/ }),
/* 20 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const acl = __webpack_require__(26),
		roles = __webpack_require__(27),
		aclKeys = Object.keys(acl),
		// compile rules that are RegExp based
		{aclRegExps,aclLiterals} = aclKeys.reduce(({aclRegExps,aclLiterals},key) => {
			const parts = key.split("/");
			if(parts.length===3 && parts[0]==="") {
				try {
					aclRegExps.push({regexp:new RegExp(parts[1],parts[2]),rule:acl[key]})
				} catch(e) {
					aclLiterals[key] = acl[key];
				}
			} else {
				aclLiterals[key] = acl[key];
			}
			return {aclRegExps,aclLiterals};
		},{aclRegExps:[],aclLiterals:{}});
	
	// applies acl rules for key and action
	// if user is not permitted to take action, modifies data accordingly
	async function secure({key,action,data,documentOnly}) {
		const {request} = this,
			{user} = request;
		if(!user || !user.roles) {
			return {data,removed:data && typeof(data)==="object" ? Object.keys(data) : [],user};
		}
		// assemble applicable rules
		const rules = aclRegExps.reduce((accum,{regexp,rule}) => {
				if(regexp.test(key)) {
					accum.push(key);
				}
				return accum;
			},[]).concat(aclLiterals[key]||[]),
			removed = [];
		for(const rule of rules) {
			if(rule[action]) {
				if(typeof(rule[action])==="function") {
					if(!(await rule[action].call(this,{action,user,data,request}))) {
						return {removed};
					}
				} else {
					const roles = Array.isArray(rule[action]) ? rule[action] : Object.keys(rule[action]);
					if(!roles.some((role) => user.roles[role])) {
						return {removed};
					}
				}
			}
			if(rule.filter) {
				data = await rule.filter.call(this,{action,user,data,request});
				if(data==undefined) {
					return {removed};
				}
			}
			if(!documentOnly && rule.properties && data && typeof(data)==="object") {
				const properties = rule.properties[action];
				if(properties) {
					for(const key of Object.keys(properties)) {
						if(data[key]!==undefined) {
							if(typeof(properties[key])==="function") {
								if(!(await properties[key].call(this,{action,user,object:data,key,request}))) {
									delete data[key];
									removed.push(key);
								}
							} else {
								const roles = Array.isArray(properties[key]) ?  properties[key] : Object.keys(properties[key]);
								if(!roles.some((role) => user.roles[role])) {
									delete data[key];
									removed.push(key);
								}
							}
						}
					}
				}
				if(rule.properties.filter) {
					for(const key of Object.keys(data)) {
						if(data[key]!==undefined && !(await rule.properties.filter.call(this,{action,user,object:data,key,request}))) {
							delete data[key];
							removed.push(key);
						}
					}
				}
			}
		}
		return {data,removed};
	}
	secure.mapRoles = (user) => {
		if(user && user.roles) {
			let changes;
			do {
				changes = false;
				Object.keys(roles).forEach((role) => {
					if(user.roles[role]) {
						Object.keys(roles[role]).forEach((childRole) => {
							if(!user.roles[childRole]) {
								changes = user.roles[childRole] = true;
							}
						})
					}
				});
			} while(changes);
		}
	}
	module.exports = secure;
}).call(this)

/***/ }),
/* 21 */,
/* 22 */,
/* 23 */,
/* 24 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";
/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

const //uid = require("./uid.js"),
	//create = require("./create.js"),
	//fromSerializable = require("./from-serializable.js"),
	//toSerializable = require("./to-serializable.js"),
	//Entity = require("./entity.js"),
	Schema = __webpack_require__(5),
	User = __webpack_require__(6),
	//functions = require("../functions.js").browser,
	//when = require("../when.js").browser;
	//Thunderclap = require("../thunderclap.js"),
	hashPassword = __webpack_require__(19),
	toSerializable = __webpack_require__(13),
	Thunderhead = __webpack_require__(25),
	dboPassword = __webpack_require__(18).dboPassword,
	secure = __webpack_require__(20);

/*const thunderclapjs = `(function() 
	{ 
		${uid+""};
		${create+""};
		${fromSerializable+""};
		${toSerializable+""};
		${Entity+""};
		${Schema+""}; 
		${User+""};
		const functions = ${JSON.stringify(functions,(key,val) => (typeof val === 'function') ? '' + val : val)};
		const when = ${JSON.stringify(when,(key, val) => (typeof val === 'function') ? '' + val : val)};
		${Thunderclap+""};
		window.Schema = Schema; 
		window.User = User; 
		window.Thunderclap = Thunderclap; 
	}).call(this)`;*/

//const thunderclapjs = Thunderclap+"";

let thunderhead;
addEventListener('fetch', event => {
	const request = event.request,
		dbo = new User("dbo",{"#":"User@dbo",roles:{dbo:true}});
	request.URL = new URL(request.url);
	thunderhead = new Thunderhead({request,namespace:NAMESPACE,dbo});
	setInterval(() => {
		thunderhead.resetCache();
	},5000)
	event.respondWith(handleRequest(event));
});

async function handleRequest(event) {
	const {request,response} = event;
	/*const mail = await fetch("https://api.mailgun.net/v3/mailgun.anywhichway.com/messages", {
	  method: "POST",
	  body:encodeURI(
		"from=Excited User <syblackwell@anywhichway.com>&" +
		"to=syblackwell@anywhichway.com&"+
		"subject=Hello&"+
		"text=Testing some Mailgun awesomeness!"
	  ),
	  headers: {
	    Authorization: "Basic YXBpOmM4MDE0N2UzYjhjOTVlNzQ1MmU1YmE5MjUxMWQ0MGFhLTI5Yjc0ODhmLWQwMzI5YWVh",
	    "Content-Type": "application/x-www-form-urlencoded"
	  }
	}).then(async (response) => `${response.ok} ${response.status} ${JSON.stringify(await response.json())}`)
	.catch((e) => e.message+'Err');
	return new Response(JSON.stringify(mail),{
		headers:
		{
			"Content-Type":"text/plain",
			"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
		}
	});*/
	
	let body = "Not Found",
		status = 404;
	//if(request.URL.pathname==="/thunderclap.js") {
	//	return new Response(thunderclapjs);
	//}
	if(request.URL.pathname!=="/db.json") {
		return fetch(request);
	}
	if(request.method==="OPTIONS") {
		return new Response(null,{
			headers: {
				"Access-Control-Allow-Origin": "*",
				"Access-Control-Allow-Headers": "X-Auth-Username,X-Auth-Password",
				"Access-Control-Allow-Methods": "GET, OPTIONS"
			}
		})
	}
	try {
		let dbo = await thunderhead.cache.get("User@dbo");
		/*return new Response(JSON.stringify([dbo]),{
			headers:
			{
				"Content-Type":"text/plain",
				"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			}
		});*/
		if(!dbo) {
			Object.assign(thunderhead.dbo,await hashPassword(dboPassword,1000));
			dbo = await thunderhead.putItem(thunderhead.dbo);
			/*return new Response(JSON.stringify([dbo]),{
				headers:
				{
					"Content-Type":"text/plain",
					"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
				}
			});*/
		}
		let userschema = await thunderhead.getSchema(User);
		if(!userschema) {
			request.user = thunderhead.dbo;
			const userschema = await thunderhead.putItem(new Schema(User));
			request.user = undefined;
		}
		body = decodeURIComponent(request.URL.search.replace(/\+/g,"%20"));
		const command = JSON.parse(body.substring(1)),
			fname = command[0],
			args = command.slice(1);
		/*return new Response(JSON.stringify(fname + " " + thunderhead[fname]),{
			status: 200,
			headers:
			{
				"Content-Type":"text/plain",
				"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			}
		});*/
		/*const value = await NAMESPACE.get(...args)
		  if (value === null) {
		    return new Response("Value not found", {status: 404})
		  }
		  return new Response(JSON.stringify(value));*/
		if(thunderhead[fname]) {
			if(fname!=="createUser") {
				// add user to request instead of passing in options?
				const userName = request.headers.get("X-Auth-Username"),
					password = request.headers.get("X-Auth-Password"),
					user = await thunderhead.authUser(userName,password); // thunderhead.dbo;
				if(!user) {
					return new Response("null",{
						status: 401,
						headers:
						{
							"Content-Type":"text/plain",
							"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
						}
					});
				}
				request.user = Object.freeze(user);
			}
			//Object.freeze(request);
			const secured = await secure.call(thunderhead,{key:fname,action:"execute",data:args});
			if(!secured.data || secured.removed.length>0) {
				return new Response("null",{
					status: 403,
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
					}
				});
			}
			return thunderhead[fname](...args)
			.then((result) => {
				const type = typeof(result);
				if(result && type==="object" && result instanceof Error) {
					return new Response(JSON.stringify(result.errors.map(error => error+"")),
						{
							status:422,
							headers:
							{
								"Content-Type":"text/plain",
								"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
							}
						});
				}
				const data = toSerializable(result,true);
				//const response = new Response(JSON.stringify(result));
				//response.body.pipeTo(writable);
				event.waitUntil(Promise.all(thunderhead.cache.promises));
				return new Response(JSON.stringify(data),{
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
					}
				});
			})
			.catch((e) => { throw e; });
			//return new Response(readable,
			//	{
			//		headers:
			//		{
			//			"Content-Type":"text/plain",
			//			"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
			//		}
			//	}
			//)
		}  else {
			status = 404;
			body = "404 - Not Found";
		}
	} catch(e) {
		body = JSON.stringify(`${body}\n${e+""}\n${e.stack}`);
		status = 500;
	}
	//return fetch(request);
	return new Response(JSON.stringify(body),
			{
				status,
				headers:
				{
					"Content-Type":"text/plain",
					"Access-Control-Allow-Origin": `"${request.URL.protocol}//${request.URL.hostname}"`
				}
			}
	);
	return response;
}


/***/ }),
/* 25 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	/*
	Server Side Public License
	VERSION 1, OCTOBER 16, 2018
	Copyright AnyWhichWay, LLC 2019
	 */
	"use strict"
	const uid = __webpack_require__(1),
		isSoul = __webpack_require__(4),
		joqular = __webpack_require__(7),
		hashPassword = __webpack_require__(19),
		secure = __webpack_require__(20),
		trigrams = __webpack_require__(28),
		tokenize = __webpack_require__(29),
		stopwords = __webpack_require__(30),
		stemmer = __webpack_require__(31),
		respond = __webpack_require__(32)("cloud"),
		fromSerializable = __webpack_require__(14),
		User = __webpack_require__(6),
		Schema = __webpack_require__(5),
		Position = __webpack_require__(0),
		Coordinates = __webpack_require__(2),
		Cache = __webpack_require__(34),
		when = __webpack_require__(15).cloud,
		functions = __webpack_require__(16).cloud,
		classes = __webpack_require__(17),
		keys = __webpack_require__(18);
	
	
	const hexStringToUint8Array = hexString => new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));

	class Thunderhead {
		constructor({namespace,request,dbo,refresh=5000}) {
			this.ctors = {};
			this.request = request;
			//this.namespace = namespace;
			this.dbo = dbo;
			this.cache = new Cache({namespace});
			this.register(Array);
			this.register(Date);
			this.register(URL);
			this.register(User);
			this.register(Schema);
			this.register(Position);
			this.register(Coordinates);
			Object.keys(classes).forEach((cname) => this.register(classes[cname]));
			__webpack_require__(35)(this);
			joqular.db = this;
			namespace.keys = this.keys;
			setInterval(() => {
				this.cache = new Cache({namespace});
			},refresh)
			//Object.defineProperty(this,"keys",{configurable:true,writable:true,value:keys});
		}
		async authUser(userName,password) {
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			return this.dbo;
			const user = (await this.query({userName},false))[0];
			request.user = authed;
			if(user && user.salt && user.hash===(await hashPassword(password,1000,hexStringToUint8Array(user.salt))).hash) {
				secure.mapRoles(user);
				return user;
			}
		}
		async changePassword(userName,password,oldPassword) {
			const authed = this.request.user;
			let user = await this.authUser(userName,oldPassword);
			if(authed.userName===userName && !user) {
				return false;
			}
			if(user || authed.roles.dbo) {
				if(!password) {
					password = Math.random().toString(36).substr(2,10);
				}
				if(!user) {
					user = (await this.query({userName},false))[0];
					if(!user) return;
				}
				Object.assign(user,await hashPassword(password,1000));
				await this.putItem(user);
				return password;
			}
		}
		async createUser(userName,password) {
			let user = new User(userName);
			Object.assign(user,await hashPassword(password,1000));
			const request = this.request,
				authed = request.user;
			request.user = this.dbo;
			user = await this.putItem(user);
			request.user = authed;
			return user;
		}
		async delete(key) {
			return this.removeItem(key);
		}
		//async get(key,options) {
			//return this.get(key,options);
		//}
		async getItem(key) {
			let data = await this.cache.get(key);
			if(data!=null) {
				const action = "read";
				if(isSoul(data["#"],false)) {
					const key = `${data["#"].split("@")[0]}@`,
						secured = await secure.call(this,{key,action,data});
					data = secured.data;
				}
				const secured = await secure.call(this,{key,action,data});
				data = secured.data;
			}
			return data==null ? undefined : data;
		}
		async getSchema(ctor) {
			let data = await this.cache.get(`Schema@${ctor.name||ctor}`);
			if(data) {
				const secured = await secure.call(this,{key:"Schema",action:"read",data});
				if(secured.data) {
					return new Schema(ctor.name||ctor,data);
				}
			}
		}
		async index(data,options={},parentPath="",parentId) {
			const type = typeof(data);
			if(data && type==="object") {
				const id = parentId||data["#"]; // also need to index for # in case nested and id'd
				if(id) {
					for(const key in data) {
						if(key!=="#" && (!options.schema || !options.schema[key] || !options.schema[key].noindex)) {
							const value = data[key],
								type = typeof(value);
							const keypath = `${parentPath}!${key}`;
							this.cache.put("!p"+keypath,1);
							let node;
							if(value && type==="object") {
								await this.index(value,options,keypath,id);
							} else {
								if(type==="string") {
									if(value.includes(" ")) {
										let count = 0;
										const grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)).map((token) => stemmer(token)));
										for(const gram of grams) {	
											this.cache.put(`!o${keypath}!${gram}!${id}`,1,options)	
										}
									}
									if(value.length<=64) {
										const valuekey = `${JSON.stringify(value)}`;
										this.cache.put(`!v${keypath}!${valuekey}`,1);
										this.cache.put(`!o${keypath}!${valuekey}!${id}`,1,options);
									}
								} else {
									const valuekey = `${JSON.stringify(value)}`;
									this.cache.put(`!v${keypath}!${valuekey}`,1);
									this.cache.put(`!o${keypath}!${valuekey}!${id}`,1,options);
								}
							}
						}
					}
				}
			}
		}
		//async put(key,value) {
		//	return this.put(key,value);
		//}
		async putItem(object,options={}) {
			if(!object || typeof(object)!=="object") {
				const error = new Error();
				error.errors = [new Error(`Attempt to put a non-object: ${object}`)];
				return error;
			}
			let id = object["#"];
			if(!id) {
				id = object["#"]  = `${object.constructor.name}@${uid()}`;
			}
			const cname = id.split("@")[0],
				key =`${cname}@`;
			await respond.call(this,{key,when:"before",action:"put",data:object});
			let schema = await this.getSchema(cname);
			if(schema) {
				options.schema = schema = new Schema(cname,schema);
				const errors = await schema.validate(object,this);
				if(errors.length>0) {
					const error = new Error();
					error.errors = errors;
					return error;
				}
			}
			let original,
				{data,removed} = await secure.call(this,{key,action:"write",data:object});
			if(data) {
				original = await this.getItem(id);
				data = await this.setItem(id,data,options,true);
			}
			if(!data) {
				const error = new Error();
				error.errors = [new Error(`Denied 'write' for ${id}`)];
				return error;
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
			let changes;
			if(original) {
				if(removed) {
					removed.forEach((key) => {
						if(original[key]!==undefined) {
							try {
								data[key] = original[key];
							} catch(e) {
								;
							}
						}
					});
				}
				for(const property of Object.keys(original)) {
					const value = data[property],
						oldValue = original[property];
					if(value!==oldValue) {
						// need to add code to unindex the changes from original
						// update({user,data,property,value,oldValue,request})
						changes || (changes = {});
						changes[property] = oldValue;
					}
				}
				if(changes) {
					await respond.call(this,{key:id,when:"before",action:"update",data,changes});
				}
			}
			
			await this.index(data,options);
			const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
			if(changes) {
				await respond.call(this,{key:id,when:"after",action:"update",data:frozen,changes});
			}
			await respond.call(this,{key:id,when:"after",action:"put",data:frozen});
			for(const match of matches) {
				if(match.call) {
					await match.call(this,data,match.when);
				}
			}
			return data;
		}
		async query(pattern,partial,options={},parentPath="") {
			let ids,
				count = 0,
				results = [],
				keys;
			//"!p!edge"
			//'!p!edge!edge
			//'!t!edge!trigram|id
			//"!o!edge!"\value\"!id
			for(const key in pattern) {
				const keytest = joqular.toTest(key,true),
					value = pattern[key],
					type = typeof(value);
				if(keytest) { // if key can be converted to a test, assemble matching keys
					keys = [];
					const edges = await this.cache.keys(`!p${parentPath}!`);
					for(const edge of edges) {
						const [_1,_2,key] = edge.split("!"); // should be based on parentPath
						if(keytest(key)) {
							keys.push(key)
						}
					}
					if(keys.length===0) {
						return [];
					}
				} else { // else key list is just the literal key
					keys = [key];
				}
				for(const key of keys) {
					const keypath = `${parentPath}!${key}`,
						securepath = keypath.replace(/\!/g,".").substring(1);
					if(value && type==="object") {
						const valuecopy = Object.assign({},value);
						let predicates;
						for(let [predicate,pvalue] of Object.entries(value)) {
							if(predicate==="$return") continue;
							const test = joqular.toTest(predicate);
							if(predicate==="$search") {
								predicates = true;
								const value = Array.isArray(pvalue) ? pvalue[0] : pvalue,
									grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)).map((token) => stemmer(token))),
									matchlevel = Array.isArray(pvalue) && pvalue[1] ? pvalue[1] * grams.length : .8;
								let testids = {}, count = 0;
								for(const gram of grams) {
									count++;
									const gkeys = await this.cache.keys(`!o${keypath}!${gram}!`);
									for(const gkey of gkeys) {
										const id = gkey.split("!").pop();
										if(testids[id]) {
											testids[id].sum++;
											testids[id].avg = testids[id].sum / count;
										} else {
											const cname = id.split("@")[0],
												{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
											if(data && removed.length===0) {
												testids[id] = {sum:1};
										    } else {
										    	testids[id] = {sum:-Infinity};
										    }
										}
									}
								}
								if(!ids) {
									ids = {};
									count = 0;
									for(const id in testids) {
										if(testids[id].avg>=matchlevel) {
											ids[id] = true;
											count++;
										}
									}
									if(count===0) {
										return [];
									}
								} else {
									for(const id in ids) {
										if(!testids[id] || testids[id].avg<=matchlevel) { //  !secured[id] && 
											delete ids[id];
											count--;
											if(count<=0) {
												return [];
											}
										}
									}
								}
							} else if(test) {
								predicates = true;
								const ptype = typeof(pvalue);
								if(ptype==="string") {
									if(pvalue.startsWith("Date@")) {
										pvalue = new Date(parseInt(pvalue.split("@")[1]));
									}
								}
								delete valuecopy[predicate];
								const secured = {},
									testids = {},
									keys = await this.cache.keys(`!v${keypath}!`);
								if(keys.length===0) {
									await this.cache.delete(`!p${keypath}`);
									return [];
								}
								for(const key of keys) {
									const parts = key.split("!"), // offset should be based on parentPath length, not end
										rawvalue = parts.pop(),
										value = fromSerializable(JSON.parse(rawvalue),this.ctors);
									if(await test.call(this,value,...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
										const keys = await this.cache.keys(`!o${keypath}!${rawvalue}`);
										for(const key of keys) {
											const parts = key.split("!"),
												id = parts.pop(),
												cname = id.split("@")[0],
												{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
											if(data && removed.length===0) {
												testids[id] = true;
										    }
										}
									}
								}
								if(!ids) {
									ids = Object.assign({},testids);
									count = Object.keys(ids).length;
									if(count===0) {
										return [];
									}
								} else {
									for(const id in ids) {
										if(!secured[id] && !testids[id]) { //  
											delete ids[id];
											count--;
											if(count<=0) {
												return [];
											}
										}
									}
								}
							}
						} 
						if(!predicates){ // matching a nested object
							const childids = await this.query(value,partial,options,keypath);
							if(childids.length===0) {
								return [];
							}
							if(!ids) {
								ids = Object.assign({},childids);
								count = Object.keys(ids).length;
								if(count===0) {
									return [];
								}
							} else {
								for(const id in ids) {
									if(!childids[id]) { //  
										delete ids[id];
										count--;
										if(count<=0) {
											return [];
										}
									}
								}
							}
						}
					} else {
						const valuekey = JSON.stringify(value),
							secured = {},
							valuepath = `${keypath}!${valuekey}`,
							objectpath = `!o${valuepath}!`,
							testids = {}, 
							keys = await this.cache.keys(objectpath);
						if(keys.length===0) {
							await this.cache.delete(`!v${keypath}!${valuekey}`); // should we actually do this?
							return [];
						}
						for(const key of keys) {
							const id = key.split("!").pop(),
								cname = id.split("@")[0],
								{data,removed} = await secure.call(this,{key:`${cname}@`,action:"read",data:{[key]:value}});
							if(data && removed.length===0) {
								testids[id] = true;
						    }
						}
						if(!ids) {
							ids = Object.assign({},testids);
							count = Object.keys(ids).length;
							if(count===0) {
								return [];
							}
						} else {
							for(const id in ids) {
								if(!secured[id] && !testids[id]) { // 
									delete ids[id];
									count--;
									if(count<=0) {
										return [];
									}
								}
							}
						}
					}
				}
			}
			if(ids) {
				if(parentPath) {
					return ids;
				}
				for(const id in ids) {
					const object = await this.getItem(id,options);
					if(object) {
						if(partial) {
							for(const key in object) {
								if(pattern[key]===undefined && key!=="#" && key!=="^") {
									delete object[key];
								}
							}
						}
						results.push(object);
					}
				}
			}
			return results;
		}
		register(ctor) {
			if(ctor.name && ctor.name!=="anonymous") {
				this.ctors[ctor.name] = ctor;
			}
		}
		async removeItem(keyOrObject) {
			const type = typeof(keyOrObject);
			if(keyOrObject && type==="object") {
				keyOrObject = keyOrObject["#"];
			}
			if(keyOrObject) {
				const value = await this.getItem(keyOrObject);
				if(value===undefined) {
					return true;
				}
				const action = "write",
					key = isSoul(keyOrObject) ? `${keyOrObject.split("@")[0]}@` : null;
				if(key) {
					if(!(await respond.call(this,{key,when:"before",action:"remove",data:value,object:value}))) {
						return false;
					}
				}
				if(!(await respond.call(this,{key:keyOrObject,when:"before",action:"remove",data:value,object:value}))) {
					return false;
				}
				const {data,removed} = await secure.call(this,{key,action,data:value,documentOnly:true});
				if(data && removed.length===0) {
					await this.cache.delete(keyOrObject);
					const frozen = value && typeof(value)==="object" ? Object.freeze(value) : value;
					if(key) {
						await this.unindex(value);
						await respond.call(this,{key,when:"after",action:"remove",data:frozen});
					}
					await respond.call(this,{key:keyOrObject,when:"after",action:"remove",data:frozen});
					return true;
				}
			}
			return false;
		}
		async setItem(key,data,options={},secured) {
			if(!secured && key[0]!=="!") {
				const action = "write";
				await respond.call(this,{key,when:"before",action:"set",data});
				const secured = await secure.call(this,{key,action,data});
				data = secured.data;
				if(data && typeof(data)==="object") {
					const key = isSoul(data["#"],false) ? data["#"].split("@")[0] : "Object",
						secured = await secure.call(this,{key,action,data});
					data = secured.data;
				}
			}
			if(data!==undefined) {
				await this.cache.put(key,data,options);
				const frozen = data && typeof(data)==="object" ? Object.freeze(data) : data;
				//await respond.call(this,{key,when:"after",action:"set",data:frozen});
			}
			return data;
		} 
		async unindex(object,parentPath="",parentId) {
			const id = parentId||object["#"];
			if(object && typeof(object)==="object" && id) {
				for(const key in object) {
					if(key==="#") {
						continue;
					}
					const value = object[key],
						keypath = `${parentPath}!${key}`;
					if(value && typeof(value)==="object") {
						if(value["#"]) {
							await this.unindex(value);
						}
						await this.unindex(value,keyPath,id);
					} else {
						if(type==="string") {
							if(value.includes(" ")) {
								let count = 0;
								const grams = trigrams(tokenize(value).filter((token) => !stopwords.includes(token)).map((token) => stemmer(token)));
								for(const gram of grams) {
									this.cache.delete(`!o${keypath}!${gram}!${id}`,1)	
								}
							}
							if(value.length<64) {
								const valuekey = `${JSON.stringify(value)}`;
								this.cache.delete(`!o${keypath}!${valuekey}!${id}`);
							}
						} else {
							const valuekey = `${JSON.stringify(value)}`;
							this.cache.delete(`!o${keypath}!${valuekey}!${id}`);
						}
					}
				}
			}
		}
	}
	const predefined = Object.keys(Object.getOwnPropertyDescriptors(Thunderhead.prototype));
	Object.keys(functions).forEach((fname) => {
		if(!predefined.includes(fname)) {
			const f = async (...args) => functions[fname].call(this,...args);
			Object.defineProperty(Thunderhead.prototype,fname,{configurable:true,value:f})
		}
	});
	module.exports = Thunderhead;
}).call(this);

/***/ }),
/* 26 */
/***/ (function(module, exports) {

(function () {
	module.exports = {
		securedTestReadKey: { // for testing purposes
			read: [] // no reads allowed
		},
		securedTestWriteKey: { // for testing purposes
			write: [] // no writes allowed
		},
		securedTestFunction: { // for testing purposes
			execute: [] // no execution allowed
		},
		[/\!.*/]: { // prevent direct index access by anyone other than a dbo, changing this may create a data inference leak
			read: ["dbo"],
			write: ["dbo"]
		},
		clear: { // only dbo can clear
			execute: ["dbo"]
		},
		entries: { // only dbo can list entries
			execute: ["dbo"]
		},
		keys: { // only dbo can list keys
			execute: ["dbo"]
		},
		values: { // only dbo can list values
			execute: ["dbo"]
		},
		"User@": { // key to control, use <cname>@ for classes
			
			// read: ["<role>",...], // array or map of roles to allow read, not specifying means all have read
			// write: {<role>:true}, // array or map of roles to allow write, not specifying means all have write
			// a filter function can also be used
			// action with be "read" or "write", not returning anything will result in denial
			// not specifying a filter function will allow all read and write, unless controlled above
			// a function with the same call signature can also be used as a property value above
			filter: async function({action,user,data,request}) {
				// very restrictive, don't return a user record unless requested by the dbo or data subject
				if(user.roles.dbo || user.userName===data.userName) {
					return data;
				}
			},
			properties: { // only applies to objects
				read: {
					roles: ({action,user,object,key,request}) => user.roles.dbo || object.userName===user.userName, // example of using a function, only dbo's can get roles
					hash: ["dbo"], // only dbo's can read passwod hashes
					salt: {
						dbo: true // example of alternate control form, only dbo's can read password salts
					}
				},
				write: {
					password: {
						// a propery named password can never be written
					},
					// only the dbo and data subject can write a hash and salt
					hash: ({action,user,object,key,request}) => user.roles.dbo || object.userName===user.userName,
					salt: ({action,user,object,key,request}) => user.roles.dbo || object.userName===user.userName,
					//userName: ({action,user,object,key,request}) => object.userName!=="dbo" // can't change name of primary dbo
				},
				filter: async function({action,user,object,key}) {
					return true; // allows all other properties to be read or written, same as having no filter at all
				}
			}
		}
	}
}).call(this);

/***/ }),
/* 27 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		dbo: {
			user: true // all dbo's are also users
		}
	};
}).call(this);

/***/ }),
/* 28 */
/***/ (function(module, exports) {

(function() {
	"use strict"
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

/***/ }),
/* 29 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = function tokenize(value) { 
		return value.replace(/[<>"'\{\}\[\]\(\)\-\=\+\*\~\n\t\:\.\;\:\$\#\%\&\*\^\!\~\<\>\,\?\`\'\"]/g,"").toLowerCase().split(" "); 
	}
}).call(this);

/***/ }),
/* 30 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = [
		  'a', 'about', 'after', 'ala', 'all', 'also', 'am', 'an', 'and', 'another', 'any', 'are', 
		  'around','as', 'at', 'be',
		  'because', 'been', 'before', 'being', 'between', 'both', 'but', 'by', 'came', 'can',
		  'come', 'could', 'did', 'do', 'each', 'for', 'from', 'get', 'got', 'has', 'had',
		  'he', 'have', 'her', 'here', 'him', 'himself', 'his', 'how', 'i', 'if', 'iff', 'in', 
		  'include', 'into',
		  'is', 'it', 'like', 'make', 'many', 'me', 'might', 'more', 'most', 'much', 'must',
		  'my', 'never', 'now', 'of', 'on', 'only', 'or', 'other', 'our', 'out', 'over',
		  'said', 'same', 'see', 'should', 'since', 'some', 'still', 'such', 'take', 'than',
		  'that', 'the', 'their', 'them', 'then', 'there', 'these', 'they', 'this', 'those',
		  'through', 'to', 'too', 'under', 'up', 'very', 'was', 'way', 'we', 'well', 'were',
		  'what', 'where', 'which', 'while', 'who', 'with', 'would', 'you', 'your'];
}).call(this);


/***/ }),
/* 31 */
/***/ (function(module, exports) {

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


/***/ }),
/* 32 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	let triggers,
		triggersKeys,
		compiled;
		
	async function respond({key,when,action,data,changes}) {
		// assemble applicable triggers
		const {request} = this,
			{user} = request,
			triggers = compiled.triggersRegExps.reduce((accum,{regexp,trigger}) => {
				if(regexp.test(key)) {
					accum.push(key);
				}
				return accum;
			},[]).concat(compiled.triggersLiterals[key]||[]);
		for(const trigger of triggers) {
			if(trigger[when] && trigger[when][action]) {
				if(action==="before") {
					if(!(await trigger[when][action].call(this,{action,user,data,changes,request}))) {
						return false;
					}
				}
				await trigger[when][action].call(this,{action,user,data,changes,request})
			}
		}
		return true
	}
	module.exports = (type) => {
		triggers = __webpack_require__(33)[type],
		triggersKeys = Object.keys(triggers),
		compiled = triggersKeys.reduce(({triggersRegExps,triggersLiterals},key) => {
			const parts = key.split("/");
			if(parts.length===3 && parts[0]==="") {
				try {
					triggersRegExps.push({regexp:new RegExp(parts[1],parts[2]),trigger:triggers[key]})
				} catch(e) {
					triggersLiterals[key] = triggers[key];
				}
			} else {
				triggersLiterals[key] = triggers[key];
			}
			return {triggersRegExps,triggersLiterals};
		},{triggersRegExps:[],triggersLiterals:{}});
		return respond;
	};
}).call(this);

/***/ }),
/* 33 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		browser: {
			
		},
		cloud: {
			"<keyOrRegExp>": {
				before: { // will be awaited if asynchronous, user and request are frozen, data can be modified
					put({user,data,request}) {
						// if data is an object, it can be modified
						return true; // return true to continue processing
					},
					remove({user,data,request}) {
						
						return true; // return true to continue processing
					}
				},
				after: { // will be awaited if asynchronous
					put({user,data,request}) {
						// might send e-mail
						// call a webhook, etc.
						
					},
					remove({user,data,request}) {
						
					}
				}
			},
			"<className>@": {
				before: { // will be awaited if asynchronous, user and request are frozen, data can be modified
					put({user,object,request}) {
						// can modify the object
						return true; // return true to continue processing
					},
					update({user,object,property,value,oldValue,request}) {
						
						return true;
					},
					remove({user,object,request}) {
						
						return true;
					}
				},
				after: { // will be awaited if asynchronous
					put({user,object,request}) {
						// might send e-mail
						// call a webhook, etc.
					},
					update({user,object,property,value,oldValue,request}) {
						
					},
					remove({user,object,request}) {
						
					}
				}
			}
		},
		worker: {
			// not yet implemented
		}
		
	}
}).call(this);

/***/ }),
/* 34 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = class Cache {
		constructor({namespace}) {
			this.namespace = namespace;
			this.promises = [];
			this.deleted = {};
		}
		async delete(key) {
			let resolver;
			const promise = new Promise((resolve) => resolver = resolve);
			this.promises.push(promise);
			this[key] = this.deleted;
			this.namespace.delete(key).then(() => { delete this[key]; resolver(); });
			return promise;
		}
		async get(key) {
			let resolver;
			const promise = new Promise((resolve) => resolver = resolve);
			this.promises.push(promise);
			this.namespace.get(key).then((value) => { try { resolver(this[key] = JSON.parse(value)); } catch(e) { resolver(e); } });
			let value = this[key];
			if(value===this.deleted) {
				return;
			}
			if(value!=null) {
				return value;
			}
			return promise;
		}
		async keys(prefix) {
			let results = [],keys, cursor;
			do {
				keys = await this.namespace.keys(prefix,{cursor});
				cursor = keys.pop();
				results = results.concat(keys);
			} while(keys.length>0 && cursor);
			return results;
		}
		async put(key,value,options) {
			let resolver;
			const promise = new Promise((resolve) => resolver = resolve);
			this.promises.push(promise);
			this[key] = value;
			this.namespace.put(key,JSON.stringify(value),options).then(() => resolver());
			return promise;
		}
	}
}).call(this);

/***/ }),
/* 35 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const {accountId,namespaceId,authEmail,authKey} = __webpack_require__(18),
		getKeys = (prefix,limit=1000,cursor) => { 
			return fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys?limit=${limit}${cursor ? "&cursor="+cursor : ""}${prefix!=null ? "&prefix="+prefix : ""}`,
				{headers:{"X-Auth-Email":`${authEmail}`,"X-Auth-Key":`${authKey}`}})
				.then((result) => result.json())
		},
		methods = {
			clear: async function(prefix="") {
				let keys, cursor;
				do {
					keys = await this.keys(prefix,{cursor});
					cursor = keys.pop();
					for(const key of keys) {
						this.delete(key);
					}
				} while(keys.length>0 && cursor);
			},
			entries: async function(prefix="",{batchSize=1000,cursor}) {
				const {result,result_info} = await getKeys(prefix,batchSize,cursor),
					entries = [];
				for(const key of result) {
					const value = await this.get(key.name),
						entry = [key.name];
					if(value!==undefined) {
						entry.push(value);
					}
					if(key.expiration) {
						entry.push(key.expiration);
					}
					entries.push(entry);
				}
				entries.push(result_info.cursor);
				return entries;
			},
			hasKey: async function(key) {
				const {result} = await getKeys(key,100);
				return result[0].name===key;
			},
			keys: async function(prefix="",{extended,batchSize=1000,cursor}={}) {
				let {result,result_info} = await getKeys(prefix,batchSize,cursor);
				if(!extended) {
					// should these be secured?
					result = result.map((item) => item.name);
				}
				result.push(result_info.cursor);
				return result;
			},
			values:async function(prefix="",{batchSize=1000,cursor}) {
				const {result,result_info} = await getKeys(prefix,batchSize,cursor),
					values = [];
				for(const key of result) {
					const value = await this.get(key.name);
					if(value!==undefined) {
						values.push(value);
					}
				}
				values.push(result_info.cursor);
				return values;
			}
		};
	module.exports = (namespace) => {
		Object.assign(namespace,methods);
	}
}).call(this);

/***/ })
/******/ ]);