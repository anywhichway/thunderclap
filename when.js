(function() {
	module.exports = {
		browser: [
			{
				when: {testWhenBrowser:{$eq:true}},
				transform: async (data,pattern) => {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call: async (data,pattern) => {
					
				}
			}
		],
		cloud: [
			{
				when: {testWhen:{$eq:true}},
				transform: async (data,pattern) => {
					Object.keys(data).forEach((key) => { if(!pattern[key]) delete data[key]; });
					return data;
				},
				call: async (data,pattern) => {
					
				}
			}
		],
		worker: [
			
		]
	}
}).call(this);