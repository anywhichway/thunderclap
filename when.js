(function() {
	module.exports = {
		client: [
			{
				when: {testWhenBrowser:{$eq:true}},
				transform({data,pattern,user,request}) {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call({data,pattern,user,request}) {
					
				}
			}
		],
		worker: [
			// not yet implemented
		],
		cloud: [
			{
				when: {testWhen:{$eq:true}},
				transform({data,pattern,user,request}) {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call({data,pattern,user,request,db}) {
					
				}
			}
		]
	}
}).call(this);