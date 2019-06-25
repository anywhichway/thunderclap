(function() {
	module.exports = {
		"<keyOrRegExp>": {
			before: { // will be awaited if asynchronous, user and request are frozen, data can be modified
				put({user,data,request}) {
					// if data is an object, it can be modified
					// if a value other than undefined is returned, it will replace the data
					return true;
				},
				remove({user,data,request}) {
					
					return true;
				}
			},
			after: { // will not be awaited, called via setTimeout
				put({user,data,request}) {
					// might send e-mail
					// call a webhook, etc.
					return true;
				},
				remove({user,data,request}) {
					
				}
			}
		},
		"<className>@": {
			before: { // will be awaited if asynchronous, user and request are frozen, data can be modified
				put({user,object,request}) {
					// can modify the object
					// if a value other than undefined is returned, it will replace the object
					return true;
				},
				update({user,object,property,value,oldValue,request}) {
					
					return true;
				},
				remove({user,object,request}) {
					
					return true;
				}
			},
			after: { // will not be awaited, called via setTimeout
				put({user,object,request}) {
					// might send e-mail
					// call a webhook, etc.
				},
				update({user,object,property,value,oldValue,request}) {
					
				},
				remove({user,object,request}) {
					
				}
			}
		}
	}
}).call(this);