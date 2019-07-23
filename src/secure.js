(function() {
	"use strict"
	const toRegExp = require("./to-regexp.js"),
		acl = require("../secure.js"),
		roles = require("../roles.js");
	
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