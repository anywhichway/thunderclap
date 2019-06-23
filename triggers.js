(function() {
	module.exports = {
		"User@": {
			before: {
				put({user,data,request}) {
					data.beforePut = true;
				},
				update({user,data,property,value,oldValue,request}) {
					
				},
				remove({user,object,request}) {
					
				}
			},
			after: {
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