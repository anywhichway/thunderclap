(function() {
	module.exports = {
		securedTestReadKey: { // for testing purposes
			read: [] // no gets allowed
		},
		securedTestWriteKey: { // for testing purposes
			write: [] // no sets allowed
		},
		securedTestFunction: { // for testing purposes
			execute: [] // no execution allowed
		},
		[/\!.*/]: { // prevent direct index access by anyone other than a dbo, changing this may create a data inference leak
			read: ["dbo"],
			write: ["dbo"]
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
					get({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; }, 
				},
				hash: {
					// only dbo's can get password hashes
					read: ["dbo"],
					// only the dbo and data subject can set a hash
					set({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; },
				},
				salt: {
					// example of alternate control form, only dbo's can get password salts
					read: {
						dbo: true
					},
					// only the dbo and data subject can set a salt
					set({action,user,object,key,request}) { return user.roles.dbo || object.userName===user.userName; },
				},
				name({action,user,data,request}) { return data; } // example, same as no access control
			}
			/* keys could also be a function
			keys({action,user,data,key,request})
			 */
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
}).call(this);