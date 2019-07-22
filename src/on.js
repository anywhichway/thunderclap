(function() {
	"use strict"
	let actions,
		actionsKeys,
		compiled;
		
	async function on({key,when,action,data,changes,request,user}) {
		// assemble applicable actions
		const actions = compiled.actionsRegExps.reduce((accum,{regexp,action}) => {
				if(regexp.test(key)) {
					accum.push(key);
				}
				return accum;
			},[]).concat(compiled.actionsLiterals[key]||[]);
		for(const action of actions) {
			if(action[when] && action[when][action]) {
				if(action==="before") {
					if(!(await action[when][action].call(this,{action,user,data,changes,request}))) {
						return false;
					}
				}
				await action[when][action].call(this,{action,user,data,changes,request})
			}
		}
		return true
	}
	module.exports = (type) => {
		actions = require("../on.js")[type],
		actionsKeys = Object.keys(actions),
		compiled = actionsKeys.reduce(({actionsRegExps,actionsLiterals},key) => {
			const parts = key.split("/");
			if(parts.length===3 && parts[0]==="") {
				try {
					actionsRegExps.push({regexp:new RegExp(parts[1],parts[2]),action:actions[key]})
				} catch(e) {
					actionsLiterals[key] = actions[key];
				}
			} else {
				actionsLiterals[key] = actions[key];
			}
			return {actionsRegExps,actionsLiterals};
		},{actionsRegExps:[],actionsLiterals:{}});
		return on;
	};
}).call(this);