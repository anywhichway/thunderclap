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
		async keys(prefix) {
			let results = this[prefix];
			if(results) {
				return results;
			}
			results = [];
			let keys, cursor;
			do {
				keys = await this.namespace.keys(prefix,{cursor});
				cursor = keys.pop();
				results = results.concat(keys);
			} while(keys.length>0 && cursor);
			return this[prefix] = results;
		}
		async put(key,value,options={}) {
			if(this[key]!==value) {
				this[key] = value;
				const promise = this.namespace.put(key,JSON.stringify(value),options);
				this.promises.push(promise);
				if(options.await) {
					return await promise;
				}
				return promise;
			}
		}
	}
}).call(this);