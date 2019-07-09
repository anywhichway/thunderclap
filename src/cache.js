(function() {
	module.exports = class Cache {
		constructor({namespace}) {
			this.namespace = namespace;
			this.promises = [];
		}
		async delete(key) {
			delete this[key];
			await this.namespace.delete(key);
		}
		async get(key) {
			const promise = this.namespace.get(key).then((value) => this[key] = JSON.parse(value));
			this.promises.push(promise);
			let value = this[key];
			if(value!=null) {
				return value;
			}
			return promise;
		}
		async put(key,value,options={}) {
			this[key] = value;
			const promise = this.namespace.put(key,JSON.stringify(value),options);
			this.promises.push(promise);
			if(options.await) {
				return await promise;
			}
			return promise;
		}
	}
}).call(this);