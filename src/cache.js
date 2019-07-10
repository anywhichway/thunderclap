(function() {
	module.exports = class Cache {
		constructor({namespace}) {
			this.namespace = namespace;
			this.promises = [];
			this.deleted = {};
		}
		async delete(key) {
			this[key] = this.deleted;
			const promise = this.namespace.delete(key).then(() => delete this[key]);
			this.promises.push(promise);
			return promise;
		}
		async get(key) {
			const promise = this.namespace.get(key).then((value) => this[key] = JSON.parse(value));
			this.promises.push(promise);
			let value = this[key];
			if(value===this.deleted) {
				return;
			}
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