(function () {
	const hashPassword = require("./src/hash-password.js");
	//{"#":"User@8",roles:{},userName:"bill",password:"test"}
	module.exports = {
		User: {
			document: {
				/*
				read: [],
				write: [],
				 * 
				 */
				filter: async function(action,user,document) {
					if(user.roles.dbo || user.userName===document.userName) {
						if(action==="write") {
							if(document.password) {
								Object.assign(document,await hashPassword(document.password,1000))
							}
						}
						return document;
					}
				}
			},
			properties: {
				read: {
					roles: (action,user,document) => user.roles.dbo,
					hash: ["dbo"],
					salt: ["dbo"]
				},
				write: {
					password: {
						
					},
					hash: (action,user,document) => user.roles.dbo || document.userName===user.userName,
					salt: (action,user,document) => user.roles.dbo || document.userName===user.userName,
				},
				filter: async function(action,user,document,key) {
					return document;
				}
			}
		}
	}
})();