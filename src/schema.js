(function() {
	"use strict"
	const Entity = require("./entity.js");
	
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
					if(!(await db.unique(object,key,value))) {
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