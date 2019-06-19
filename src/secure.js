(function() {
	const acl = require("../acl.js");
	
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