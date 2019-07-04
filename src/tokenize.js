(function() {
	module.exports = function tokenize(value) { 
		return value.replace(/[<>"'\{\}\[\]\(\)\-\=\+\*\~\n\t\:\.\;\:\$\#\%\&\*\^\!\~\<\>\,\?\`\'\"]/g,"").toLowerCase().split(" "); 
	}
}).call(this);