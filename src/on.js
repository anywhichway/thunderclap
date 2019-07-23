(function() {
	"use strict"
	const toRegExp = require("./to-regexp.js");
	
	let actions;
	async function on({key,when,action,data,changes,request,user}) {
		const triggers = [];
		let parts = Array.isArray(key) ? key.slice() : key.split("."),
			trigger = actions,
			part,
			l1 = true;
		while((part = parts.shift()) && actions &&
			Object.keys(trigger).some((key) => {
				const regexp = toRegExp(key);
				if(key==="_" || regexp && regexp.test(part)) {
					trigger = l1 ? trigger[key].keys : trigger[key];
					l1 = false;
					return trigger;
				}
			})) { true; };
		if(parts.length===0 && trigger[when] && trigger[when][action]) {
			triggers.push(triggertrigger[when][action]);
		}
		parts = Array.isArray(key) ? key.slice() : key.split(".");
		trigger = actions;
		l1 = true;
		while((part = parts.shift()) && actions &&
				Object.keys(trigger).some((key) => {
					if(key==="_" || key===part) {
						trigger = l1 ? trigger[key].keys : trigger[key];
						l1 = false;
						return trigger;
					}
				})) { true; };
		if(parts.length===0  && trigger[when] && trigger[when][action]) {
			triggers.push(triggertrigger[when][action]);
		}
		for(const trigger of triggers) {
			if(action==="before") {
				if(!(await trigger.call(this,{action,user,data,changes,request}))) {
					return false;
				}
			}
			await trigger.call(this,{action,user,data,changes,request})
		}
		return true;
	}
	module.exports = (type) => {
		actions = require("../on.js")[type];
		return on;
	};
}).call(this);