(function() {
	module.exports = {
		browser: {
			
		},
		cloud: {
			securedTestFunction() {
				return "If you see this, there may be a security leak";
			},
			getDate() {
				return new Date();
			}
		},
		worker: {
			
		}
	}
}).call(this);