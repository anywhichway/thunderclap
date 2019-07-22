(function() {
	const {mailgunKey,mailgunHostName} = require("../keys.js");
	
	function sendMail({from,to,cc,bcc,subject,body}) {
		return fetch(`https://api.mailgun.net/v3/${mailgunHostName}/messages`, {
		  method: "POST",
		  body:encodeURI(
			`from=${from}&` +
			`to=${to}&`+
			`subject=${subject}&`+
			`text=${body}`
		  ),
		  headers: {
		    Authorization: `Basic ${mailgunKey}`,
		    "Content-Type": "application/x-www-form-urlencoded"
		  }
		}).then((response) => response.ok ? true : response.text())
		.catch((e) => e.message);
	}
	module.exports = sendMail;
}).call(this);