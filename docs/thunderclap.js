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
/******/ 	return __webpack_require__(__webpack_require__.s = 26);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = function uid() { return Date.now().toString(36) +  Math.random().toString(36).substr(2,9); }
}).call(this)

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const uid = __webpack_require__(0);
	
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
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(1),
		Coordinates = __webpack_require__(4);
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
/* 3 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const uuid4 = __webpack_require__(13),
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
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(1),
		Position = __webpack_require__(2);
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
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const toRegExp = __webpack_require__(8),
		acl = __webpack_require__(20),
		roles = __webpack_require__(21);
	
	// applies acl rules for key and action
	// if user is not permitted to take action, modifies data accordingly
	async function secure({key,action,data,documentOnly,request,user}) {
		if(!user || !user.roles) {
			return {data,removed:data && typeof(data)==="object" ? Object.keys(data) : data,user};
		}
		const removed = [],
			rules = [];
		let parts = Array.isArray(key) ? key.slice() : key.split("."),
			rule = acl,
			next = rule,
			l1 = parts[0]==="Function@" ? false : true,
			part;
		while((part = parts.shift()) && (rule = next) && 
			Object.keys(rule).some((key) => {
				const regexp = toRegExp(key);
				if(key==="_" || regexp && regexp.test(part)) {
					next = l1 ? rule[key].keys : rule[key];
					rule = rule[key];
					l1 = false;
					return rule;
				}
			})) { true; };
		if(parts.length===0) {
			rules.push(rule)
		}
		parts = Array.isArray(key) ? key.slice() : key.split(".");
		rule = acl;
		next = rule;
		l1 = parts[0]==="Function@" ? false : true;
		while((part = parts.shift()) && (rule = next) &&
			Object.keys(rule).some((key) => {
				if(key==="_" || key===part) {
					next = l1 ? rule[key].keys : rule[key];
					rule = rule[key];
					l1 = false;
					return rule;
				}
			})) { true; };
		if(parts.length===0) {
			rules.push(rule)
		}
		for(const rule of rules) {
			if(rule[action]) {
				if(typeof(rule[action])==="function") {
					if(!(await rule[action].call(this,{action,user,data,request,key,functionName:key,argumentsList:data}))) {
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
			if(!documentOnly && rule.keys && data && typeof(data)==="object") {
				if(typeof(rule.keys)==="function") {
					for(const key in data) {
						if(!(await rule.keys.call(this,{action,user,object:data,key,request}))) {
							delete data[key];
							removed.push(key);
						}
					}
				} else {
					for(const key in data) {
						const constraint = rule.keys[key];
						if(constraint && constraint[action]) {
							if(typeof(constraint)==="function") {
								if(!(await constraint.call(this,{action,user,object:data,key,request,functionName:key,argumentsList:data}))) {
									delete data[key];
									removed.push(key);
								}
							} else {
								const roles = Array.isArray(rule.keys[key]) ?  rule.keys[key] : Object.keys(rule.keys[key]);
								if(!roles.some((role) => user.roles[role])) {
									delete data[key];
									removed.push(key);
								}
							}
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
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict";
	const uid = __webpack_require__(0);
	class MapSet {
		constructor({id,set}={}) {
			if(!id) {
				id = `MapSet@${uid()}`;
			}
			Object.assign(this,{"#":id,set:Array.from(set)});
		}
	}
	MapSet.create = (config) => {
		const set = new Set(config.set||[]);
		set["#"] = config["#"];
		return set;
	}
	module.exports = MapSet;
}).call(this);

/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(1);
	
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
					const cname = object["#"].split("@")[0];
					if(!(await db.unique(object["#"],key,value))) {
						errors.push(new TypeError(`"${key}" value "${value}" must be unique for ${cname}`));
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
/* 8 */
/***/ (function(module, exports) {

(function() {
	module.exports = (string) => {
		if(typeof(string)==="string") {
			const parts = string.split("/");
			if(parts.length===3 && parts[0]==="") {
				try {
					return new RegExp(parts[1],parts[2]);
				} catch(e) {
					;
				}
			}
		}
	}
}).call(this);

/***/ }),
/* 9 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Entity = __webpack_require__(1);
	
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
/* 10 */,
/* 11 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	/*
	MIT License
	Copyright AnyWhichWay, LLC 2019
	 */
	const soundex = __webpack_require__(12),
		isSoul = __webpack_require__(3),
		isInt = __webpack_require__(14),
		isFloat = __webpack_require__(15),
		validateLuhn = __webpack_require__(16),
		joqular = {
			$(a,f) {
				f = typeof(f)==="function" ? f : !this.options.inline || new Function("return " + f)();
				if(typeof(f)!=="function") return;
				const original = JSON.stringify(a),
					result = f.call(undefined,a);
				if(JSON.stringify(a)!==original) throw new Error("function call by $test has illegal side effect");
				return result;
			},
			"$.":function(a,fname,...args) {
				if(typeof(a[fname])==="function") {
					return a[fname](...args); // this may create a security vulnerability, add access control
				}
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
			$startsWith(a,b) { 
				return a.startsWith(b); 
			},
			$endsWith(a,b) { 
				return a.endsWith(b); 
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
			$in(a,...container) {
				if(container.length===1 && typeof(a)==="string" && typeof(container[0])==="string") {
					return container[0].includes(a);
				}
				return container.includes(a);
			},
			$nin(a,...container) {
				if(container.length===1 && typeof(a)==="string" && typeof(container[0])==="string") {
					return !container[0].includes(a);
				}
				return !container.includes(a);
			},
			$includes(value,included) {
				return value===included;
			},
			/*$excludes(value,excluded) {
				return value!==excluded;
			},*/
			$intersects(value,...container) {
				if(container.length===1 && typeof(a)==="string" && typeof(container[0])==="string") {
					return container[0].includes(a);
				}
				return container.includes(value);
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
			async $isArray(a,bool) {
				return bool===(joqular.$isArray.ctx === "Array") || joqular.$instanceof(a,"Array");
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
			toTest(key,keyTest,{cname,parentPath,property}={}) {
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
/* 12 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	//soundex from https://gist.github.com/shawndumas/1262659
	const soundex = (a) => {a=(a+"").toLowerCase().split("");var c=a.shift(),b="",d={a:"",e:"",i:"",o:"",u:"",b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6},b=c+a.map(function(a){return d[a]}).filter(function(a,b,e){return 0===b?a!==d[c]:a!==e[b-1]}).join("");return(b+"000").slice(0,4).toUpperCase()};
	module.exports = soundex;
}).call(this);

/***/ }),
/* 13 */
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
/* 14 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 === 0;
}).call(this)

/***/ }),
/* 15 */
/***/ (function(module, exports) {

(function() {
	"use strict"
	module.exports = (x) => typeof x === "number" && isFinite(x) && x % 1 !== 0;
}).call(this)

/***/ }),
/* 16 */
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
/* 17 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const MapSet = __webpack_require__(6);
	
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
			if(data instanceof Set) {
				return new MapSet({id:data["#"],set:data});
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
/* 18 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const Position = __webpack_require__(2);
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
/* 19 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const uid = __webpack_require__(0),
		isSoul = __webpack_require__(3),
		secure = __webpack_require__(5);
	
	function Edge({db,parent,path=["","e"]}) {
		Object.defineProperty(this,"db",{enumerable:false,value:db});
		this.parent = parent;
		this.path = path;
	}
	Edge.prototype.add = async function(data,options) {
		let set = await this.db.getItem(this.path.join("!"));
		if(!set || !set.startsWith("MapSet@")) {
			set = `MapSet@${uid()}`;
			await this.value(set);
		}
		if(data && typeof(data)==="object") {
			let id = data["#"];
			if(!id) {
				id = data["#"] = `${data.constructor.name}@${uid()}`;
				await this.db.put(data,options);
			}
			await this.db.put({"#":set,id},options);
		} else {
			const key = JSON.stringify(data);
			await this.db.put({"#":set,[key]:data},options);
		}
		return this;
	}
	Edge.prototype.delete = async function() {
		const keys = await this.db.keys(this.path.join("!"));
		if(keys.length===0 || keys[0]==="") {
			return 0;
		}
		await this.db.removeItem(this.path.join("!"))
		return this.db.clear(this.path.join("!"));
	}
	Edge.prototype.get = async function(path) {
		const parts = Array.isArray(path) ? path : path.split(".");
		let node = this,
			part;
		path = this.path.slice();
		while(part = parts.shift()) {
			path.push(part);
			node = new Edge({db:this.db,parent:node,path:path.slice()});
		}
		return node;
	}
	Edge.prototype.put = async function(data,options={}) {
		let node = this,
			type = typeof(data);
		if(data && type==="object") {
			const id = data["#"];
			// when here?
			// transform here
			// validate here
			// secure here
			// on here
			if(id) { // if putting a first class object, reset to root
				const cname = id.split("@")[0];
				node = await (await this.db.get(`${cname}@`)).get(id);
			}
			for(const key in data) {
				const value = data[key];
				if(value && value["#"]) {
					await this.db.put(value,options.expireRelated ? options : {});
				} else {
					//if(value && typeof(value)==="object") {
					//	value["#"] = `${value.constructor.name}@${uid()}`
					//}
					const child = await node.get(key);
					await child.put(value,options);
				}
			}
		} else {
			this.value(data,options);
		}
		return data;
	}
	Edge.prototype.remove = async function(data) {
		const set = await this.db.getItem(this.path.join("!"));
		if(!set || !set.startsWith('MapSet@')) {
			return this;
		}
		let key;
		if(data && typeof(data)==="object") {
			key = data["#"];
		} else {
			key = JSON.stringify(data);
		}
		if(key) {
			const path = `!e!MapSet@!${set}!${key}`;
			await this.db.removeItem(path);
			await this.db.clear(path);
		}
		return this;
	}
	Edge.prototype.restore = async function(data) {
		if(typeof(data)!=="string") {
			//const path = this.path.slice();
			//path.shift(); // remove ""
			//if(path[0].endsWith("@")) {
			//	path.splice(1,1); // remove id;
			//}
			// security here using edge path
			return data;
		}
		if(data.startsWith("MapSet@")) {
			const path = `!e!MapSet@!${data}!`,
				keys = await this.db.keys(path),
				set = new Set();
			set["#"] = data;
			for(const key of keys) {
				const parts = key.split("!"),
					value = parts[parts.length-1];
				if(value && value!=="#") {
					if(isSoul(parts[0],false)) {
						set.add(await this.restore(value));
					} else {
						set.add(JSON.parse(value));
					}
				}
			}
			return set;
		}
		if(isSoul(data,false)) {
			const cname = data.split("@")[0],
				keys = await this.db.keys(`!e!${cname}@!${data}!`),
				object = {};
			for(const key of keys) {
				const parts = key.split("!"),
					value = await this.db.cache.get(key);
				let node = object;
				parts.shift(); // remove ""
				parts.splice(1,1); // remove id
				const vpath = parts.slice();
				parts.shift(); // remove class
				while(parts.length>1) { // walk down the object
					const property = parts.shift(),
					node = node[property];
				}
				node[parts[0]] = value;
			}
			return object;
		}
		return data;
	}
	Edge.prototype.value = async function(value,options={}) {
		const request = this.db.request,
			user = request.user,
			vpath = this.path.slice();
		vpath.splice(0,2);
		if(arguments.length>0) {
			// transform here
			// validate here
			// secure here
			const {data,removed} = await secure.call(this,{key:vpath,action:"write",data:value,request,user});
			if(data!==undefined) {
				return this.db.cache.put(this.path.join("!"),data,options)
			}
			return;
		}
		value = await this.restore(await this.db.cache.get(this.path.join("!")));
		const {data} = await secure.call(this,{key:vpath,action:"read",data:value,request,user});
		if(data===value) {
			return value;
		}
	}
	module.exports = Edge;
}).call(this)

/***/ }),
/* 20 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		"Function@": {
			securedTestFunction: { // for testing purposes
				execute: [] // no execution allowed
			},
			addRoles: { // only dbo can add roles to a user
				execute: ["dbo"]
			},
			clear: { // only dbo can clear
				execute: ["dbo"]
			},
			deleteUser: {
				execute: ["dbo"]
			},
			entries: { // only dbo can list entries
				execute: ["dbo"]
			},
			entry: {
				execute: ["dbo"]
			},
			keys: { // only dbo can list keys
				execute: ["dbo"]
			},
			removeRoles: {
				execute: ["dbo"]
			},
			resetPassword: { // only user themself or dbo can start a password reset
				execute({argumentsList,user}) {
					return user.roles.dbo || argumentsList[0]===user.userName
				}
			},
			sendMail: { // only dbo can send mail
				execute: ["dbo"]
			},
			updateUser: {  // only user themself or dbo can update user properties
				execute({argumentsList,user}) {
					return user.roles.dbo || argumentsList[0]===user.userName
				}
			},
			values: { // only dbo can list values
				execute: ["dbo"]
			}
		},
		"User@": { // key to control, use <cname>@ for classes
			
			// read: ["<role>",...], // array or map of roles to allow get, not specifying means all have get
			// write: {<role>:true}, // array or map of roles to allow set, not specifying means all have set
			// a filter function can also be used
			// action with be "get" or "set", not returning anything will result in denial
			// not specifying a filter function will allow all get and set, unless controlled above
			// a function with the same call signature can also be used as a property value above
			filter({action,user,data,request}) {
				// very restrictive, don't return a user record unless requested by the dbo or data subject
				if(user.roles.dbo || user.userName===data.userName) {
					return data;
				}
			},
			keys: { // only applies to objects
				roles: {
					// only dbo's and data subject can get roles
					read({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; }, 
				},
				hash: {
					// only dbo's can get password hashes
					read: ["dbo"],
					// only the dbo and data subject can set a hash
					write({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; },
				},
				salt: {
					// example of alternate control form, only dbo's can get password salts
					read: {
						dbo: true
					},
					// only the dbo and data subject can set a salt
					write({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; },
				},
				name({action,user,data,request}) { return data; } // example, same as no access control
			}
			/* keys could also be a function
			keys({action,user,data,key,request})
			 */
		},
		securedTestReadKey: { // for testing purposes
			read: [] // no gets allowed
		},
		securedTestWriteKey: { // for testing purposes
			write: [] // no sets allowed
		},
		// Edges are just nested keys or wildcards, e.g.
		securedTestEdge: {
			keys: {
				_: { // matches any sub-edge
					public: {
						read() { return true; },
						write() { return true; }
					},
					private: {
						read() { return false; },
						write() { return false; }
					}
				}
			}
		},
		[/\!.*/]: { // prevent direct index access by anyone other than a dbo, changing this may create a data inference leak
			read: ["dbo"],
			write: ["dbo"]
		}
	}
}).call(this);

/***/ }),
/* 21 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		dbo: {
			user: true // all dbo's are also users
		}
	};
}).call(this);

/***/ }),
/* 22 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		client: [
			{
				when: {testWhenBrowser:{$eq:true}},
				transform({data,pattern,user,request}) {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call({data,pattern,user,request}) {
					
				}
			}
		],
		worker: [
			// not yet implemented
		],
		cloud: [
			{
				when: {testWhen:{$eq:true}},
				transform({data,pattern,user,request}) {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call({data,pattern,user,request,db}) {
					
				}
			}
		]
	}
}).call(this);

/***/ }),
/* 23 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		client: {
			
		},
		worker: {
			
		},
		cloud: {
			securedTestFunction() {
				return "If you see this, there may be a security leak";
			},
			getDate() {
				return new Date();
			}
		}
	}
}).call(this);

/***/ }),
/* 24 */
/***/ (function(module, exports) {

(function() {
	module.exports = {
		// Add class declaration using require
		// <cname>: require(".<path>/<myClass>.js")
	}
}).call(this);

/***/ }),
/* 25 */,
/* 26 */
/***/ (function(module, exports, __webpack_require__) {

/*
Server Side Public License
VERSION 1, OCTOBER 16, 2018
Copyright AnyWhichWay, LLC 2019
 */

(function() {
	"use strict"
	const uid = __webpack_require__(0),
		joqular = __webpack_require__(11),
		toSerializable = __webpack_require__(17),
		create = __webpack_require__(27),
		Schema = __webpack_require__(7),
		MapSet = __webpack_require__(6),
		Edge = __webpack_require__(19),
		User = __webpack_require__(9),
		Position = __webpack_require__(2),
		Coordinates = __webpack_require__(4),
		when = __webpack_require__(22).client,
		functions = __webpack_require__(23).client,
		classes = __webpack_require__(24);
	
	var fetch;
	if(typeof(fetch)==="undefined") {
		fetch = __webpack_require__(28);
	}
	
	// patch Edge value for client
	Edge.prototype.value = async function(value,options={}) {
		if(arguments.length>0) {
			return this.db.value(path,value,options);
		} else {
			return this.db.value(this.path.join("!"));
		}
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
			this.register(Position);
			this.register(Coordinates);
			this.register(Edge);
			this.register(MapSet);
			Object.keys(classes).forEach((cname) => this.register(classes[cname]));
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
						.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
						.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
						.then((data) => create(data,this.ctors));
				}
				Object.defineProperty(this,key,{enumerable:false,configurable:true,writable:true,value:f})
			})
		}
		async add(path,data,options={}) {
			if(data && typeof(data)==="object") {
				this.register(data.constructor);
				let id = data["#"];
				if(!id) {
					id = data["#"]  = `${data.constructor.name}@${uid()}`;
				}
			}
			return fetch(`${this.endpoint}/db.json?["add",${encodeURIComponent(JSON.stringify(path))},${encodeURIComponent(JSON.stringify(toSerializable(data)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => create(data,this.ctors));
		}
		async addRoles(userName,roles=[]) {
			return fetch(`${this.endpoint}/db.json?["addRoles",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(roles))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async clear(key="") {
			return fetch(`${this.endpoint}/db.json?["clear",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async changePassword(userName,password="",oldPassword="") {
			return fetch(`${this.endpoint}/db.json?["changePassword",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))},${encodeURIComponent(JSON.stringify(oldPassword))}]`,{headers:this.headers})
	    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors))
		    	.then((password) => {
		    		if(password && this.headers["X-Auth-Username"]===userName) {
		    			this.headers["X-Auth-Password"] = password;
		    		}
		    		return password;
		    	});
		}
		async createUser(userName,password,extras={},reAuth) {
			return fetch(`${this.endpoint}/db.json?["createUser",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(password))},${encodeURIComponent(JSON.stringify(extras))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		    	.then((user) => {
		    		if(reAuth || !this.headers["X-Auth-Username"]) {
		    			this.headers["X-Auth-Username"] = user.username;
		    			this.headers["X-Auth-Password"] = user.password;
		    		}
		    		return user;
		    	});
		}
		async delete(path) {
			return fetch(`${this.endpoint}/db.json?["delete",${encodeURIComponent(JSON.stringify(path))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => create(data,this.ctors));
		}
		async deleteUser(userName) {
			return fetch(`${this.endpoint}/db.json?["deleteUser",${encodeURIComponent(JSON.stringify(toSerializable(userName)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async entries(prefix="",options={}) {
			return fetch(`${this.endpoint}/db.json?["entries"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async entry(key) {
			return fetch(`${this.endpoint}/db.json?["entry"${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async get(key) {
		    return fetch(`${this.endpoint}/db.json?["get",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors))
		    	.then((data) => { data.db = this; return new Edge(data); });
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
		async getUser(userName) {
		    return fetch(`${this.endpoint}/db.json?["getUser",${encodeURIComponent(JSON.stringify(userName))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async hasKey(key) {
			if(key) {
				return fetch(`${this.endpoint}/db.json?["hasKey",${encodeURIComponent(JSON.stringify(key))}]`,{headers:this.headers})
	    			.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
	    			.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
	    			.then((data) => create(data,this.ctors))
			}
			return false;
		}
		async keys(prefix="",options={}) {
			return fetch(`${this.endpoint}/db.json?["keys"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(options))}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async put(object,options={}) {
			this.register(object.constructor);
			let data = Object.assign({},object),
				id = data["#"],
				cname = id ? id.split("@")[0] : null;
			if(cname) {
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
		    return fetch(`${this.endpoint}/db.json?["put",${encodeURIComponent(JSON.stringify(toSerializable(data)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
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
		async query(object,{validate,partial,limit}={}) {
			const options = partial||limit ? {partial,limit} : {};
			return fetch(`${this.endpoint}/db.json?["query",${encodeURIComponent(JSON.stringify(toSerializable(object)))},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
	    		.then((response) => {
	    			if(response.status===200) {
	    				return response.text();
	    			}
	    			throw new Error(`Request failed: ${response.status}`) 
	    		})
		    	.then((data) => JSON.parse(data.replace(/\%20/g," ")))
	    		.then((objects) => create(objects,this.ctors))
	    		.then((objects) => validate ? objects.filter((result) => joqular.matches(object,result)!==undefined) : objects);
		}
		register(ctor,name=ctor.name) {
			if(typeof(ctor)==="string") {
				name = ctor;
				ctor = Function(`return ${ctor}`);
			} else {
				name = ctor.name;
			}
			if(name && name!=="anonymous") {
				Thunderclap[name] = ctor;
				return this.ctors[name] = ctor;
			}
		}
		async remove(path,data) {
			if(data && typeof(data)==="object") {
				this.register(object.constructor);
			}
			return fetch(`${this.endpoint}/db.json?["remove",${encodeURIComponent(JSON.stringify(path))},${encodeURIComponent(JSON.stringify(toSerializable(data)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => create(data,this.ctors));
		}
		async removeItem(keyOrObject) {
			return fetch(`${this.endpoint}/db.json?["removeItem",${encodeURIComponent(JSON.stringify(toSerializable(keyOrObject)))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async removeRoles(userName,roles=[]) {
			return fetch(`${this.endpoint}/db.json?["removeRoles",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(roles))}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
		}
		async resetPassword(userName,method="email") {
			return fetch(`${this.endpoint}/db.json?["resetPassword",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(method))}]`,{headers:this.headers})
	    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
		    	.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
		    	.then((data) => create(data,this.ctors));
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
		async sendMail(mail={}) {
			return fetch(`${this.endpoint}/db.json?["sendMail",${encodeURIComponent(JSON.stringify(mail))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors));
		}
		async setSchema(className,config) {
			const object = new Schema(className,config);
			return this.putItem(object);
		}
		async updateUser(userName,properties={}) {
			return fetch(`${this.endpoint}/db.json?["updateUser",${encodeURIComponent(JSON.stringify(userName))},${encodeURIComponent(JSON.stringify(toSerializable(properties)))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors));
		}
		async unique(objectOrIdOrCname,property,value="") {
			objectOrIdOrCname = typeof(objectOrIdOrCname)==="string" ? objectOrIdOrCname : objectOrIdOrCname["#"];
			if(!objectOrIdOrCname) {
				return false;
			}
			return fetch(`${this.endpoint}/db.json?["unique",${encodeURIComponent(JSON.stringify(objectOrIdOrCname))},${encodeURIComponent(JSON.stringify(property))},${encodeURIComponent(JSON.stringify(value))}]`,{headers:this.headers})
		    	.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
		async value(path,data,options={}) {
			return fetch(`${this.endpoint}/db.json?["value",${encodeURIComponent(JSON.stringify(path))}${data!==undefined ? ","+encodeURIComponent(JSON.stringify(toSerializable(data))) : ""}${data!==undefined ? ","+encodeURIComponent(JSON.stringify(toSerializable(options))) : ""}]`,{headers:this.headers})
				.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
				.then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
				.then((data) => create(data,this.ctors));
		}
		async values(prefix="",options={}) {
			return fetch(`${this.endpoint}/db.json?["values"${prefix!=null ? ","+encodeURIComponent(JSON.stringify(prefix)) : ""},${encodeURIComponent(JSON.stringify(toSerializable(options)))}]`,{headers:this.headers})
	    		.then((response) => response.status===200 ? response.text() : new Error(`Request failed: ${response.status}`)) 
			    .then((data) => { if(typeof(data)==="string") { return JSON.parse(data) } throw data; })
			    .then((data) => create(data,this.ctors))
		}
	}
	
	if(true) module.exports = Thunderclap;
	if(typeof(window)!=="undefined") window.Thunderclap = Thunderclap;
}).call(this);


/***/ }),
/* 27 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	"use strict"
	const fromSerializable = __webpack_require__(18);
	async function create(data,ctors={}) {
		const type = typeof(data);
		if(type==="string") {
			return fromSerializable(data);
		}
		if(!data || typeof(data)!=="object") return data;
		for(const key in data) {
			data[key] = await create(data[key],ctors)
		}
		const id = data["#"] || (data["^"] ? data["^"]["#"]||data["^"].id : ""),
			cname = typeof(id)==="string" ? id.split("@")[0] : null,
			ctor = cname ? ctors[cname] : null;
		if(!ctor) {
			return data;
		}
		let instance;
		if(ctor.name!=="Object" && ctor.create) {
			instance = await ctor.create(data);
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
/* 28 */
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