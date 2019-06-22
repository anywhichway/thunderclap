(function() {
	const Entity = require("./entity.js");
	
	class Schema extends Entity {
		constructor(ctor,config=ctor.schema) {
			config["#"] || (config["#"] = `Schema@${ctor.name||ctor}`);
			super(config);
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