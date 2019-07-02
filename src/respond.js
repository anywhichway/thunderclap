(function() {
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
		triggers = require("../triggers.js")[type],
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