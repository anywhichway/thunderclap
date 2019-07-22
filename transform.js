(function() {
	module.exports = {
		client: {
			
		},
		worker: {
			
		},
		cloud: {
			"User@": {
				get({value,key,user,request}) {
					return value; // called after get, can modify return
				},
				set({value,key,oldValue,user,request}) {
					return value; // called before set, can modify value
				},
				apply({argumentsList,functionName,user,request}) {
					return value; // called before apply, can modify argumentsList
				},
				keys: {
					password: {
						set({value,key,oldValue,user,request}) {
							return value;  // called before set, can modify value
						}
					}
				}
			}
		}
	}
}).call(this)