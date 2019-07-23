(function() {
	module.exports = (string) => {
		if(typeof(string)==="string") {
			const parts = string.split("/");
			if(parts.length===3 && parts[0]==="") {
				try {
					return new RegExp(parts[1],parts[2]);
				} catch(e) {
					;
				}
			}
		}
	}
}).call(this);