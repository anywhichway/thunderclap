(function() {
	class User {
		constructor(userName,config) {
			Object.assign(this,config);
			this.userName = userName;
			const meta = {"#":config["#"]};
			Object.defineProperty(this,"^",{value:meta});
			Object.defineProperty(this,"#",{get() { return this["^"]["#"]||this["^"].id; }});
		}
		static create(config) {
			return new User(config.userName,config);
		}
	}
	User.schema = {
		userName: {required:true, type: "string", unique:true},
		groups: {type: "object"}
	}
	module.exports = User;
})();