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
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
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
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const soundex = __webpack_require__(2),
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
			$xor(a,tests) {
				let found = 0;
				const resolve = (a,pname,value) => joqular[pname] ? joqular[pname](a,value) : false;
				if(Array.isArray(tests)) {
					for(const test of tests) {
						for(const pname in test) {
							if(resolve(a,pname,test[pname])) found++;
							if(found>1) return false;
						}
					}
				} else {
					for(const pname in tests) {
						if(resolve(a,pname,tests[pname])) found++;
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
				if(isSoul(a)) {
					const cname = a.split("@")[0],
						ctor = joqular.db.ctors()[cname] ? joqular.db.ctors()[cname] : null,
					a = ctor ? Object.create(ctor.prototype) : a;
				} 
				b = typeof(b)==="string" && joqular.db.ctors()[b] ? joqular.db.ctors()[b] : b;
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
			$isIPAddress(a) {
				return (/^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/m).test(a);
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
				if(typeof(a)==="number") { a = new Date(a); } if(typeof(b)==="number") { b = new Date(b); }; if(typeof(a)==="object" && a instanceof Date && typeof(b)==="object" && b instanceof Date) return a.getDate()===b.getDate();
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
				if(key.startsWith("=>")) {
					key = `(value)=>value${key.substring(2)}`
				} else if(["==","===",">",">=","=<","<","!"].some((op) => key.startsWith(op))) {
					key = `(value)=>value${key}`
				} else if(key[0]==="(" && key[key.length-1]==")") {
					key = `(value)=>${key}`
				}
				if(joqular[key]) {
					return joqular[key];
				}
				if(key==="$_") {
					return pkey = () => true;
				}
				if(key.startsWith("$.")) {
					const fname = key.substring(2);
					return (a,b) => typeof(a[fname])==="function" ? a[fname](b) : false;
				}
				if(keyTest) {
					if(key[0]==="{" && key[key.length-1]==="}") {
						key = key.replace(/([{,])(\s*)([A-Za-z0-9_\-\$]+?)\s*:/g, '$1"$3":')
						const spec = JSON.parse(key);
						return (value) => {
							return joqular.matches(spec,value);
						}
					}
					if(key.includes("=>") && typeof(window)!=="undefined") {
						try {
							return new Function("return " + key)();
						} catch(e) {
							return () => true;
						}
					}
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
/* 2 */
/***/ (function(module, exports) {

(function() {
	//soundex from https://gist.github.com/shawndumas/1262659
	const soundex = (a) => {a=(a+"").toLowerCase().split("");var c=a.shift(),b="",d={a:"",e:"",i:"",o:"",u:"",b:1,f:1,p:1,v:1,c:2,g:2,j:2,k:2,q:2,s:2,x:2,z:2,d:3,t:3,l:4,m:5,n:5,r:6},b=c+a.map(function(a){return d[a]}).filter(function(a,b,e){return 0===b?a!==d[c]:a!==e[b-1]}).join("");return(b+"000").slice(0,4).toUpperCase()};
	module.exports = soundex;
}).call(this);

/***/ }),
/* 3 */
/***/ (function(module, exports) {

(function() {
	class Schema {
		constructor(ctor,config=ctor.schema) {
			Object.assign(this,config);
			const meta = {"#":`Schema@${ctor.name||ctor}`};
			Object.defineProperty(this,"^",{value:meta});
			Object.defineProperty(this,"#",{get() { return this["^"]["#"]||this["^"].id; }});
		}
		async validate(object,db) {
			const errors = [];
			for(const key of Object.keys(this)) {
				if(key!=="#" && key!=="^") {
					const validation = this[key];
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
			return errors;
		}
		static get className() {
			return this["#"].split("@")[1];
		}
		static create(config) {
			return new Schema(config.className,config);
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
/* 4 */
/***/ (function(module, exports) {

(function() {
	class User {
		constructor(userName,config) {
			Object.assign(this,config);
			this.userName = userName;
			const meta = {"#":config["#"]};
			Object.defineProperty(this,"^",{value:meta});
			Object.defineProperty(this,"#",{get() { return this["^"]["#"]||this["^"].id; }});
		}
		static create(config) {
			return new User(config.userName,config);
		}
	}
	User.schema = {
		userName: {required:true, type: "string", unique:true},
		groups: {type: "object"}
	}
	module.exports = User;
})();

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

const uuid4 = __webpack_require__(0),
	isSoul = __webpack_require__(6),
	joqular = __webpack_require__(1),
	secure = __webpack_require__(7),
	Schema = __webpack_require__(3),
	User = __webpack_require__(4);


let thunderdb;
addEventListener('fetch', event => {
	const db = NAMESPACE;
		thunderdb = {
			async getItem(key,options={}) {
				let data = await db.get(key);
				if(data) {
					data = JSON.parse(data);
					if(key[0]!=="!") {
						if(isSoul(data["#"],false)) {
							const cname = data["#"].split("@")[0],
								secured = await secure(cname,"read",options.user,data);
							data = secured.data;
						}
						const secured = await secure(key,"read",options.user,data);
						data = secured.data;
					}
				}
				return data;
			},
			async getSchema(ctor,options) {
				const data = await db.get(`Schema@${ctor.name||ctor}`);
				if(data) {
					return new Schema(ctor.name||ctor,JSON.parse(data));
				}
			},
			async index(data,root,options={},recursing) {
				let changed = 0;
				if(data && typeof(data)==="object" && data["#"]) {
					const id = data["#"];
					for(const key in data) {
						if(!options.schema || !options.schema[key] || !options.schema[key].noindex) {
							const value = data[key],
								type = typeof(value);
							if(value && type==="object") {
								changed += await this.index(value,root,options,true);
							} else {
								const valuekey = `${JSON.stringify(value)}`,
									path = `!${key}`;
								if(!root[key]) {
									root[key] = 0;
									changed++;
								}
								let node = await this.getItem(path,options);
								if(!node) {
									root[key]++;
									changed++;
									node = {};
								}
								node[valuekey] || (node[valuekey] = {__keyCount__:0});
								if(!node[valuekey][id]) {
									node[valuekey][id] = true;
									node[valuekey].__keyCount__++;
									await this.setItem(path,node,options);
								}
							}
						}
					}
				}
				return changed;
			},
			async keys(lastKey) {
				return db.getKeys(lastKey)
			},
			async query(object,options={}) {
				let ids,
					count = 0;
					results = [];
				const root = await this.getItem("!",options);
				if(!root) return results;
				for(const key in object) {
					const keytest = joqular.toTest(key,true);
					let keys;
					if(keytest) { // if key can be converted to a test, assemble matching keys
						keys = Object.keys(root).filter((key) => keytest(key));
					} else { // else key list is just the literal key
						keys = [key];
					}
					for(const key of keys) {
						if(root[key]) {
							const node = await this.getItem(`!${key}`,options);
							if(node) {
								const value = object[key],
									type = typeof(value);
								if(value && type==="object") {
									const valuecopy = Object.assign({},value);
									for(const [predicate,pvalue] of Object.entries(value)) {
										if(predicate==="$return") continue;
										const test = joqular.toTest(predicate);
										if(predicate==="$search") {

										} else if(test) {
											let testids = {};
											delete valuecopy[predicate];
											for(const valuekey in node) {
												if(await test.call(node,JSON.parse(valuekey),...(Array.isArray(pvalue) ? pvalue : [pvalue]))) {
													// disallow index use by unauthorized users at document && property level
													for(const id in node[valuekey]) {
														const cname = id.split("@")[0],
															{data,removed} = await secure(cname,"read",options.user,{[key]:true});
														if(!data || removed.length>0) {
															delete node[valuekey][id];
														}
													}
													Object.assign(testids,node[valuekey]);
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
													if(!testids[id]) {
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
								} else {
									const valuekey = JSON.stringify(value);
									if(node[valuekey]) {
										// disallow index use by unauthorized users at document && property level
										for(const id in node[valuekey]) {
											const cname = id.split("@")[0],
												{data,removed} = await secure(cname,"read",options.user,{[key]:true});
											if(!data || removed.length>0) {
												delete node[valuekey][id];
											}
										}
										if(!ids) {
											ids = Object.assign({},node[valuekey]);
											count = Object.keys(ids).length;
										} else {
											for(const id in ids) {
												if(!node[valuekey][id]) {
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
						}
					}
					if(!ids) { // if no ids after first loop, then no matches
						return [];
					}
				}
				if(ids) {
					for(const id in ids) {
						const object = await this.getItem(id,options);
						if(object) {
							results.push(object);
						}
					}
				}
				return results;
			},
			async putItem(object,options={}) {
				let id = object["#"];
				if(!id) {
					id = object["#"]  = `${object.constructor.name}@${uuid4()}`;
				}
				const cname = id.split("@")[0];
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
				const {data,removed} = await secure(cname,"write",options.user,object),
					root = (await this.getItem("!",options)) || {},
					original = await this.getItem(id,{user:this.dbo});
				if(!data) {
					const error = new Error();
					error.errors = [new Error(`Denied 'write' for ${id}`)];
					return error;
				}
				if(original && removed) {
					removed.forEach((key) => {
						if(original[key]!==undefined) {
							data[key] = original[key];
						}
					});
				}
				// need to add code to unindex the changes from original
				const count = await this.index(data,root,options);
				if(count) {
					await this.setItem("!",root,options);
				}
				await this.setItem(id,data,options,true);
				return object;
			},
			async removeItem(keyOrObject,options) {
				const type = typeof(keyOrObject)==="object";
				if(keyOrObject && type==="object") {
					keyOrObject = keyOrObject["#"];
				} 
				if(keyOrObject) {
					const root = type==="object" ? await this.getItem("!",options) : null,
						object = root ? await this.getItem(keyOrObject,options) : null;
					await db.delete(keyOrObject);
					if(await this.unindex(object,root,options)) {
						await this.setItem("!",root,options);
					}
				}
			},
			async setItem(key,data,options,patched) {
				if(!patched && key[0]!=="!") {
					const secured = await secure(key,"write",options.user,data);
					data = secured.data;
				}
				if(data===undefined) {
					await db.removeItem(key,options);
				} else {
					await db.put(key,JSON.stringify(data));
				}
				return data;
			},
			async unindex(object,options,root={}) {
				let count = 0;
				if(object && typeof(object)==="object" && object["#"]) {
					const id = object["#"];
					for(const key in object) {
						if(root[key]) {
							const value = object[key];
							if(value && typeof(value)==="object") {
								count += await this.unindex(value,options,root);
							} else {
								const valuekey = `${JSON.stringify(value)}`,
									path = `!${key}`,
									node = await this.getItem(path,options);
								if(node[valuekey] && node[valuekey][id]) {
									delete node[valuekey][id];
									node[valuekey].__keyCount__--;
									if(!node[valuekey].__keyCount__) {
										delete node[valuekey];
										root[key]--;
										count++;
									}
									await this.setItem(path,node,options);
								}
							}
						}
					}
				}
				return count;
			}
	};
	thunderdb.dbo =  new User("dbo",{"#":"User@dbo",roles:{dbo:true}}); // should get pwd during build
	event.request.URL = new URL(event.request.url);
	event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
	let body = "Not Found",
		status = 404;
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
		//let userschema = await thunderdb.getSchema(User);
		//if(!userschema) {
		const userschema = await thunderdb.putItem(new Schema(User));
		//}
		let dbo = await thunderdb.getItem("User@dbo",{user:thunderdb.dbo});
		if(!dbo) {
			await thunderdb.putItem(dbouser,{user:thunderdb.dbo});
		}
		body = decodeURIComponent(request.URL.search);
		const command = JSON.parse(body.substring(1)),
			fname = command.shift(),
			args = command;
		if(thunderdb[fname]) {
			const userName = request.headers.get("X-Auth-Username"),
				password = request.headers.get("X-Auth-Password"),
				user = userName ? (await thunderdb.query({userName},{user:thunderdb.dbo}))[0] : null; // should do an instanceof check against id
			//const {readable,writable} = new TransformStream();
			if(!user) {
				return new Response(null,{
					status: 403,
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": "*", //'${request.URL.protocol}//${request.URL.hostname}'
						"Access-Control-Allow-Headers": "*"
					}
				});
			}
			return thunderdb[fname](args[0],{user})
			.then((result) => {
				const type = typeof(result),
					options = args.pop();
				if(result===undefined) result = "@undefined";
				else if(result===Infinity) result = "@Infinity";
				else if(result===-Infinity) result = "@-Infinity";
				else if(type==="number" && isNaN(result)) result = "@NaN";
				else if(result && type==="object") {
					if(result instanceof Date) {
						result = `@Date${result.timestamp}`;
					}
					if(result instanceof Error) {
						return new Response(JSON.stringify(result.errors.map(error => error+"")),
							{
								status:422,
								headers:
								{
									"Content-Type":"text/plain",
									"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
								}
							});
					}
				}
				//const response = new Response(JSON.stringify(result));
				//response.body.pipeTo(writable);
				return new Response(JSON.stringify(result),{
					headers:
					{
						"Content-Type":"text/plain",
						"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
					}
				});
			});
			//return new Response(readable,
			//	{
			//		headers:
			//		{
			//			"Content-Type":"text/plain",
			//			"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
			//		}
			//	}
			//)
		}
	} catch(e) {
		body = JSON.stringify(e+body);
		status = 500;
	}
	//return fetch(request);
	const response = new Response(body,
			{
				headers:
				{
					"Status": status,
					"Content-Type":"text/plain",
					"Access-Control-Allow-Origin": "*" //'${request.URL.protocol}//${request.URL.hostname}'
				}
			}
	);
	return response;
}


/***/ }),
/* 6 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const uuid4 = __webpack_require__(0),
		isSoul = (value,checkUUID=true) => {
			if(typeof(value)==="string") {
				const parts = value.split("@"),
					isnum = !isNaN(parseInt(parts[1]));
				return parts.length===2 && parts[0]!=="" && ((parts[0]==="Date" && isnum) || (!checkUUID && isnum) || uuid4.is(parts[1]));
			}
			return false;
		};
	module.exports = isSoul;
})();



/***/ }),
/* 7 */
/***/ (function(module, exports, __webpack_require__) {

(function() {
	const acl = __webpack_require__(8);
	
	async function secure(ruleName,action,user,data) {
		const rule = acl[ruleName],
			removed = [];
		if(!user || !user.roles) {
			return {data,removed:data && typeof(data)==="object" ? Object.keys(data) : removed};
		}
		if(rule) {
			if(rule.document) {
				if(rule.document[action]) {
					if(typeof(rule.document[action])==="function") {
						if(!rule.document[action](action,user,data)) {
							return {removed};
						}
					} else {
						const roles = Array.isArray(rule.document[action]) ? rule.document[action] : Object.keys(rule.document[action]);
						if(!roles.some((role) => user.roles[role])) {
							return {removed};
						}
					}
				}
				if(rule.document.filter) {
					data = await rule.document.filter(action,user,data);
				}
			}
			if(rule.properties && data && typeof(data)==="object") {
				const properties = rule.properties[action];
				if(properties) {
					for(const key of Object.keys(properties)) {
						if(typeof(properties[key])==="function") {
							if(!properties[key](action,user,data,key)) {
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
				if(rule.properties.filter) {
					for(const key of Object.keys(data)) {
						if(!(await rule.properties.filter(action,user,data,key))) {
							delete data[key];
							removed.push(key);
						}
					}
				}
			}
		}
		return {data,removed};
	}
	
	module.exports = secure;
}).call(this)

/***/ }),
/* 8 */
/***/ (function(module, exports, __webpack_require__) {

(function () {
	const hashPassword = __webpack_require__(9);
	//{"#":"User@8",roles:{},userName:"bill",password:"test"}
	module.exports = {
		User: {
			document: {
				/*
				read: [],
				write: [],
				 * 
				 */
				filter: async function(action,user,document) {
					if(user.roles.dbo || user.userName===document.userName) {
						if(action==="write") {
							if(document.password) {
								Object.assign(document,await hashPassword(document.password,1000))
							}
						}
						return document;
					}
				}
			},
			properties: {
				read: {
					roles: (action,user,document) => user.roles.dbo,
					hash: ["dbo"],
					salt: ["dbo"]
				},
				write: {
					password: {
						
					},
					hash: (action,user,document) => user.roles.dbo || document.userName===user.userName,
					salt: (action,user,document) => user.roles.dbo || document.userName===user.userName,
				},
				filter: async function(action,user,document,key) {
					return document;
				}
			}
		}
	}
})();

/***/ }),
/* 9 */
/***/ (function(module, exports) {

(function() {
	function bufferToHexString(buffer) {
	    var s = '', h = '0123456789ABCDEF';
	    (new Uint8Array(buffer)).forEach((v) => { s += h[v >> 4] + h[v & 15]; });
	    return s;
	}
	async function generateKey(password,iterations) {
	    const salt = crypto.getRandomValues(new Uint8Array(8)),
	    	encoder = new TextEncoder('utf-8'),
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
			    // Note: we don't actually need a cipher suite,
			    // but the api requires that it must be specified.
			    // For AES the length required to be 128 or 256 bits (not bytes)
			    { name: 'AES-CBC', length: 256 },
		
			    // Whether or not the key is extractable (less secure) or not (more secure)
			    true,
		
			    // this web crypto object will only be allowed for these functions
			    [ "encrypt", "decrypt" ]
			), 
			buffer = await crypto.subtle.exportKey("raw", webKey);
		return {
			hash: bufferToHexString(buffer),
			salt: bufferToHexString(salt)
		}
	}
	module.exports = generateKey;
}).call(this)

/***/ })
/******/ ]);