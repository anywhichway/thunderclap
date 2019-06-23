(function() {
	module.exports = {
		"User@": {
			before: {
				async put({user,data,request}) {
					data.beforePut = true;
				},
				async update({user,data,property,value,oldValue,request}) {
					
				},
				async remove({user,object,request}) {
					
				}
			},
			after: {
				put({user,object,request}) {
					
				},
				update({user,object,property,value,oldValue,request}) {
					
				},
				remove({user,object,request}) {
					
				}
			}
		}
	}
}).call(this);