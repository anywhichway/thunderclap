(function() {
	module.exports = {
		client: {
			
		},
		worker: {
			
		},
		cloud: {
			securedTestFunction() {
				return "If you see this, there may be a security leak";
			},
			getDate() {
				return new Date();
			}
		}
	}
}).call(this);