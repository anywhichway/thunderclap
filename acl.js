(function () {
	module.exports = {
		User: { // class name or key to control
			document: { // controls at the document or primitive value level
				// read: ["<role>",...], // array or map of roles to allow read, not specifying means all have read
				// write: {<role>:true}, // array or map of roles to allow write, not specifying means all have read
				// a filter function can also be used
				// action with be "read" or "write", not returning anything will result in denial
				// not specifying a filter function will allow all read and write, unless controlled above
				// a function with the same call signature can also be used as a property value above
				filter: async function(action,user,document) {
					// very restrictive, don't return a user record unless requested by the dbo or data subject
					if(user.roles.dbo || user.userName===document.userName) {
						return document;
					}
				}
			},
			properties: { // only applies to objects
				read: { // controls access to three properties
					roles: (action,user,document) => user.roles.dbo, // example of using a function
					hash: ["dbo"],
					salt: ["dbo"]
				},
				write: {
					password: {
						// a propery names password can never be written
					},
					// only the dbo and data subject can write a hash and salt
					hash: (action,user,document) => user.roles.dbo || document.userName===user.userName,
					salt: (action,user,document) => user.roles.dbo || document.userName===user.userName,
				},
				filter: async function(action,user,document,key) {
					return true; // allows all other properties to be read or written, same as having no filter at all
				}
			}
		}
	}
})();