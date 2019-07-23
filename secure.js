(function() {
	module.exports = {
		"Function@": {
			securedTestFunction: { // for testing purposes
				execute: [] // no execution allowed
			},
			addRoles: { // only dbo can add roles to a user
				execute: ["dbo"]
			},
			clear: { // only dbo can clear
				execute: ["dbo"]
			},
			deleteUser: {
				execute: ["dbo"]
			},
			entries: { // only dbo can list entries
				execute: ["dbo"]
			},
			entry: {
				execute: ["dbo"]
			},
			keys: { // only dbo can list keys
				execute: ["dbo"]
			},
			removeRoles: {
				execute: ["dbo"]
			},
			resetPassword: { // only user themself or dbo can start a password reset
				execute({argumentsList,user}) {
					return user.roles.dbo || argumentsList[0]===user.userName
				}
			},
			sendMail: { // only dbo can send mail
				execute: ["dbo"]
			},
			updateUser: {  // only user themself or dbo can update user properties
				execute({argumentsList,user}) {
					return user.roles.dbo || argumentsList[0]===user.userName
				}
			},
			values: { // only dbo can list values
				execute: ["dbo"]
			}
		},
		"User@": { // key to control, use <cname>@ for classes
			
			// read: ["<role>",...], // array or map of roles to allow get, not specifying means all have get
			// write: {<role>:true}, // array or map of roles to allow set, not specifying means all have set
			// a filter function can also be used
			// action with be "get" or "set", not returning anything will result in denial
			// not specifying a filter function will allow all get and set, unless controlled above
			// a function with the same call signature can also be used as a property value above
			filter({action,user,data,request}) {
				// very restrictive, don't return a user record unless requested by the dbo or data subject
				if(user.roles.dbo || user.userName===data.userName) {
					return data;
				}
			},
			keys: { // only applies to objects
				roles: {
					// only dbo's and data subject can get roles
					read({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; }, 
				},
				hash: {
					// only dbo's can get password hashes
					read: ["dbo"],
					// only the dbo and data subject can set a hash
					write({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; },
				},
				salt: {
					// example of alternate control form, only dbo's can get password salts
					read: {
						dbo: true
					},
					// only the dbo and data subject can set a salt
					write({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; },
				},
				name({action,user,data,request}) { return data; } // example, same as no access control
			}
			/* keys could also be a function
			keys({action,user,data,key,request})
			 */
		},
		securedTestReadKey: { // for testing purposes
			read: [] // no gets allowed
		},
		securedTestWriteKey: { // for testing purposes
			write: [] // no sets allowed
		},
		// Edges are just nested keys or wildcards, e.g.
		securedTestEdge: {
			keys: {
				_: { // matches any sub-edge
					public: {
						read() { return true; },
						write() { return true; }
					},
					private: {
						read() { return false; },
						write() { return false; }
					}
				}
			}
		},
		[/\!.*/]: { // prevent direct index access by anyone other than a dbo, changing this may create a data inference leak
			read: ["dbo"],
			write: ["dbo"]
		}
	}
}).call(this);