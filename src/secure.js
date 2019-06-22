(function() {
	const acl = require("../acl.js"),
		roles = require("../roles.js"),
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
	async function secure(key,action,user,data,request,documentOnly) {
		if(!user || !user.roles) {
			return {data,removed:data && typeof(data)==="object" ? Object.keys(data) : []};
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
					if(!(await rule[action](action,user,data,request))) {
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
				data = await rule.filter(action,user,data,request);
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
								if(!(await properties[key](action,user,data,key,request))) {
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
						if(data[key]!==undefined && !(await rule.properties.filter(action,user,data,key,request))) {
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