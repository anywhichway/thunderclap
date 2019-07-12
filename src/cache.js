(function() {
	module.exports = class Cache {
		constructor({namespace}) {
			this.namespace = namespace;
			this.promises = [];
			this.deleted = {};
		}
		async delete(key) {
			let resolver;
			const promise = new Promise((resolve) => resolver = resolve);
			this.promises.push(promise);
			this[key] = this.deleted;
			this.namespace.delete(key).then(() => { delete this[key]; resolver(); });
			return promise;
		}
		async get(key) {
			let resolver;
			const promise = new Promise((resolve) => resolver = resolve);
			this.promises.push(promise);
			this.namespace.get(key).then((value) => { try { resolver(this[key] = JSON.parse(value)); } catch(e) { resolver(e); } });
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
			let results = [],keys, cursor;
			do {
				keys = await this.namespace.keys(prefix,{cursor});
				cursor = keys.pop();
				results = results.concat(keys);
			} while(keys.length>0 && cursor);
			return results;
		}
		async put(key,value,options) {
			let resolver;
			const promise = new Promise((resolve) => resolver = resolve);
			this.promises.push(promise);
			this[key] = value;
			this.namespace.put(key,JSON.stringify(value),options).then(() => resolver());
		}
	}
}).call(this);