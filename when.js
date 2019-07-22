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
			/* Graph edge updates can also be monitored, although it is just as easy with triggers since edge updates are atomic
			{
				edge: {devices:{_:{alarm:true}}, // matches any time any device has alarm set to true
				transform({data,pattern,user,request}) {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call({data,pattern,user,request,db}) {
					
				}
			}
			*/
		]
	}
}).call(this);