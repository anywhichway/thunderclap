(function () {
	module.exports = {
		securedTestReadKey: { // for testing purposes
			read: [] // no reads allowed
		},
		securedTestWriteKey: { // for testing purposes
			write: [] // no writes allowed
		},
		securedTestFunction: { // for testing purposes
			execute: [] // no execution allowed
		},
		[/\!.*/]: { // prevent direct index access by anyone other than a dbo, changing this may create a data inference leak
			read: ["dbo"],
			write: ["dbo"]
		},
		keys: { // only dbo can list keys
			execute: ["dbo"]
		},
		"User@": { // key to control, user <cname>@ for classes
			
			// read: ["<role>",...], // array or map of roles to allow read, not specifying means all have read
			// write: {<role>:true}, // array or map of roles to allow write, not specifying means all have write
			// a filter function can also be used
			// action with be "read" or "write", not returning anything will result in denial
			// not specifying a filter function will allow all read and write, unless controlled above
			// a function with the same call signature can also be used as a property value above
			filter: async function({action,user,data,request}) {
				// very restrictive, don't return a user record unless requested by the dbo or data subject
				if(user.roles.dbo || user.userName===data.userName) {
					return data;
				}
			},
			properties: { // only applies to objects
				read: {
					roles: ({action,user,object,key,request}) => user.roles.dbo || object.userName===user.userName, // example of using a function, only dbo's can get roles
					hash: ["dbo"], // only dbo's can read passwod hashes
					salt: {
						dbo: true // example of alternate control form, only dbo's can read password salts
					}
				},
				write: {
					password: {
						// a propery named password can never be written
					},
					// only the dbo and data subject can write a hash and salt
					hash: ({action,user,object,key,request}) => user.roles.dbo || object.userName===user.userName,
					salt: ({action,user,object,key,request}) => user.roles.dbo || object.userName===user.userName,
					//userName: ({action,user,object,key,request}) => object.userName!=="dbo" // can't change name of primary dbo
				},
				filter: async function({action,user,object,key}) {
					return true; // allows all other properties to be read or written, same as having no filter at all
				}
			}
		}
	}
}).call(this);