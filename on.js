(function() {
	module.exports = {
		client: {
			
		},
		worker: {

		},
		cloud: {
			"User@": {
				get({value,key,user,request}) {
					; // called after get
				},
				set({value,key,oldValue,user,request}) {
					// if value!==oldValue it is a change
					// if oldValue===undefined it is new
					// if value===undefined it is delete
					; // called after set
				},
				apply({value,key,args,user,request}) {
					; // called after execute, value is the result, key is the function name
				},
				keys: {
					password: {
						set({value,key,oldValue,user,request}) {
							; // called after set
						}
					}
				}
			}
			/* Edges are just nested keys or wildcards, e.g.
			people: {
				_: { // matches any sub-edge
					secretPhrase: { // matches secrePhrase edge
						get(...) { ... },
						set(...) { ... }
					}
				}
			}
			*/
		}	
	}
}).call(this);