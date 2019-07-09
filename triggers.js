(function() {
	module.exports = {
		browser: {
			
		},
		cloud: {
			"<keyOrRegExp>": {
				before: { // will be awaited if asynchronous, user and request are frozen, data can be modified
					put({user,data,request}) {
						// if data is an object, it can be modified
						return true; // return true to continue processing
					},
					remove({user,data,request}) {
						
						return true; // return true to continue processing
					}
				},
				after: { // will be awaited if asynchronous
					put({user,data,request}) {
						// might send e-mail
						// call a webhook, etc.
						
					},
					remove({user,data,request}) {
						
					}
				}
			},
			"<className>@": {
				before: { // will be awaited if asynchronous, user and request are frozen, data can be modified
					put({user,object,request}) {
						// can modify the object
						return true; // return true to continue processing
					},
					update({user,object,property,value,oldValue,request}) {
						
						return true;
					},
					remove({user,object,request}) {
						
						return true;
					}
				},
				after: { // will be awaited if asynchronous
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
		},
		worker: {
			// not yet implemented
		}
		
	}
}).call(this);