(function() {
	const triggers = require("../triggers.js"),
		triggersKeys = Object.keys(triggers),
		// compile triggers that are RegExp based
		{triggersRegExps,triggersLiterals} = triggersKeys.reduce(({triggersRegExps,triggersLiterals},key) => {
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
		
	async function respond({key,when,action,user,data,property,request}) {
		// assemble applicable triggers
		const triggers = triggersRegExps.reduce((accum,{regexp,trigger}) => {
				if(regexp.test(key)) {
					accum.push(key);
				}
				return accum;
			},[]).concat(triggersLiterals[key]||[]);
		for(const trigger of triggers) {
			if(trigger[when] && trigger[when][action]) {
				if(action==="before") {
					await trigger[when][action]({action,user,data,property,request});
				} else {
					trigger[when][action]({action,user,data,property,request});
				}
			}
		}
	}
	module.exports = respond;
}).call(this);