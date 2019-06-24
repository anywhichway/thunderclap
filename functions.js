(function() {
	module.exports = {
		securedTestFunction() {
			return "If you see this, there may be a security leak";
		},
		getDate() {
			return new Date();
		}
	}
}).call(this);