const TESTDATE = new Date("2019-06-20T23:04:35.815Z");

let o1,
	o2;

describe("tests",function() {
	it("createUser",async function() {
		const user = await db.createUser("testuser","test",{roles:{dummy:true},email:"someone@somewhere.com"});
		expect(user["#"].startsWith("User@"));
		expect(user.userName).equal("testuser");
		expect(user.roles.dummy).equal(undefined);
		expect(user.email).equal("someone@somewhere.com");
	}).timeout(4000);
	it("addRoles",async function() {
		const user = await db.addRoles("testuser",["dummy"]);
		expect(user.userName).equal("testuser");
		expect(user.roles.dummy).equal(true);
		expect(user.email).equal("someone@somewhere.com");
	}).timeout(4000);
	it("getUser",async function() {
		const user = await db.getUser("testuser");
		expect(user.userName).equal("testuser");
		//expect(user.roles.dummy).equal(true);
		expect(user.email).equal("someone@somewhere.com");
	}).timeout(4000);
	it("removeRoles",async function() {
		const user = await db.removeRoles("testuser",["dummy"]);
		expect(user.userName).equal("testuser");
		expect(user.roles.dummy).equal(undefined);
		expect(user.email).equal("someone@somewhere.com");
	}).timeout(4000);
	it("deleteUser",async function() {
		const result = await db.deleteUser("testuser");
		expect(result).equal(true);
		const user = await db.getUser("testuser");
		expect(user).equal(undefined);
	}).timeout(4000);
	it("put nested item",async function() {
		let object = await db.getItem("Object@test");
		if(!object) {
			object = await db.putItem({
				"#": "Object@test",
				date: TESTDATE,
				name:"test",
				low:-1,
				middle:0,
				high:1,
				NaN: parseInt("a"),
				minusInfinity: -Infinity,
				plusInfinity: Infinity,
				flag:true,
				ssn:"555-55-5555",
				ip:"127.0.0.1",
				notes:"a string with spaces and stop words",
				email: "someone@somewhere.com"});
		}
		o1 = object; // save for deletion in final test
		expect(object.date.getTime()).equal(TESTDATE.getTime()); 
		expect(object.name).equal("test"); 
		expect(object.low).equal(-1);
		expect(object.middle).equal(0);
		expect(object.high).equal(1);
		expect(isNaN(object.NaN) && typeof(object.NaN)==="number").equal(true);
		expect(object.minusInfinity).equal(-Infinity);
		expect(object.plusInfinity).equal(Infinity);
		expect(object.flag).equal(true);
		expect(object.ssn).equal("555-55-5555");
		expect(object.ip).equal("127.0.0.1");
		expect(object.email).equal("someone@somewhere.com");
	}).timeout(10000);
	it("setItem primitive", async function() {
		const value = await db.setItem("test","test",{await:true});
		expect(value).equal("test");
	});
	it("getItem primitive", async function() {
		const value = await db.getItem("test");
		expect(value).equal("test");
	});
	it("removeItem primitive", async function() {
		let value = await db.removeItem("test");
		expect(value).equal(true);
		value = await db.getItem("test");
		expect(value).equal(undefined);
	});
	it("securedTestWriteKey", async function() {
		let value = await db.setItem("securedTestWriteKey","test");
		expect(value).equal(undefined);
		value = await db.getItem("securedTestWriteKey");
		expect(value).equal(undefined);
	});
	it("securedTestReadKey", async function() {
		let value = await db.setItem("securedTestReadKey","test");
		expect(value).equal("test");
		value = await db.getItem("securedTestReadKey");
		expect(value).equal(undefined);
	});
	it("multi property match",async function() {
		const results = await db.query(
				{Object:
					{
					date: TESTDATE,
					name:"test",
					low:-1,
					middle:0,
					high:1,
					NaN: parseInt("a"),
					minusInfinity: -Infinity,
					plusInfinity: Infinity,
					flag:true,
					ssn:"555-55-5555",
					ip:"127.0.0.1",
					notes:"a string with spaces and stop words",
					email: "someone@somewhere.com"}
				});
		expect(results.length).equal(1);
	}).timeout(5000);
	it("wild card key {$_:'test'}",async function() {
		const results = await db.query({Object:{$_:"test"}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	}).timeout(3000);
	it("RegExp key {[/.*name/]:'test'}",async function() {
		const results = await db.query({Object:{[/.*name/]:"test"}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$lt",async function() {
		const results = await db.query({Object:{low:{$lt:0}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	}).timeout(2000);
	it("$lte",async function() {
		const results = await db.query({Object:{low:{$lte:-1}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$eq",async function() {
		const results = await db.query({Object:{low:{$eq:-1}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$eeq",async function() {
		const results = await db.query({Object:{low:{$eeq:-1}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$gte",async function() {
		const results = await db.query({Object:{high:{$gte:1}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].high).equal(1);
	});
	it("$gt",async function() {
		const results = await db.query({Object:{high:{$gt:0}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].high).equal(1);
	});
	it("$neeq",async function() {
		const results = await db.query({Object:{low:{$neeq:0}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$eq string",async function() {
		const results = await db.query({Object:{name:{$eq:"test"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$eeq string",async function() {
		const results = await db.query({Object:{name:{$eeq:"test"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$neq string",async function() {
		const results = await db.query({Object:{name:{$neq:"name"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$startsWith string",async function() {
		const results = await db.query({Object:{name:{$startsWith:"te"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$endsWith string",async function() {
		const results = await db.query({Object:{name:{$endsWith:"st"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$near low absolute", async function() {
		const results = await db.query({Object:{low:{$near:[0,1]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$near high absolute", async function() {
		const results = await db.query({Object:{high:{$near:[0,1]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].high).equal(1);
	});
	it("$near low percent", async function() {
		const results = await db.query({Object:{low:{$near:[-2,"50%"]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$near multiple percent", async function() {
		const results = await db.query({Object:{high:{$near:[0.5,"200%"]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].high).equal(1);
	});
	it("$near high percent", async function() {
		const results = await db.query({Object:{high:{$near:[2,"50%"]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].high).equal(1);
	});
	it("$between",async function()  {
		const results = await db.query({Object:{middle:{$between:[-1,1]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$between inclusive",async function()  {
		const results = await db.query({Object:{middle:{$between:[-1,0,true]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$outside higher",async function() {
		const results = await db.query({Object:{middle:{$outside:[-2,-1]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$outside lower",async function() {
		const results = await db.query({Object:{middle:{$outside:[1,2]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$in",async function() {
		const results = await db.query({Object:{middle:{$in:[-1,0,1]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$nin",async function() {
		const results = await db.query({Object:{middle:{$nin:[1,2,3]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$in string",async function() {
		const results = await db.query({Object:{name:{$in:"a test"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$nin string",async function() {
		const results = await db.query({Object:{name:{$nin:"not"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$echoes",async function() {
		const results = await db.query({Object:{name:{$echoes:"tesst"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("-Infinity",async function() {
		const results = await db.query({Object:{minusInfinity:-Infinity}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].minusInfinity).equal(-Infinity);
	});
	it("Infinity",async function() {
		const results = await db.query({Object:{plusInfinity:Infinity}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].plusInfinity).equal(Infinity);
	});
	it("NaN",async function() {
		const results = await db.query({Object:{NaN:{$isNaN:true}}});
		expect(typeof(results[0])).equal("object");
		expect(typeof(results[0].NaN)==="number" && isNaN(results[0].NaN)).equal(true);
	});
	it("$isArray",async function() {
		const results = await db.query({Object:{favoriteNumbers:{$isArray:true}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].favoriteNumbers.length).equal(4);
	});
	it("$isEmail",async function() {
		const results = await db.query({Object:{email:{$isEmail:true}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].email).equal("someone@somewhere.com");
	});
	it("$isEven",async function() {
		const results = await db.query({Object:{middle:{$isEven:true}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$isIPAddress",async function() {
		const results = await db.query({Object:{ip:{$isIPAddress:true}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].ip).equal("127.0.0.1");
	});
	it("$isOdd",async function() {
		const results = await db.query({Object:{low:{$isOdd:true}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].low).equal(-1);
	});
	it("$isSSN",async function() {
		const results = await db.query({Object:{ssn:{$isSSN:true}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].ssn).equal("555-55-5555");
	});
	it("$typeof",async function() {
		const results = await db.query({Object:{name:{$typeof:"string"}}});
		expect(typeof(results[0])).equal("object");
		expect(typeof(results[0].name)).equal("string");
	});
	it("$in",async function() {
		const results = await db.query({Object:{name:{$in:["test"]}}});
		expect(typeof(results[0])).equal("object");
		expect(typeof(results[0].name)).equal("string");
	});
	it("$nin",async function() {
		const results = await db.query({Object:{name:{$nin:["name"]}}});
		expect(typeof(results[0])).equal("object");
		expect(typeof(results[0].name)).equal("string");
	});
	it("$instanceof",async function() {
		const results = await db.query({Object:{date:{$instanceof:"Date"}}});
		expect(typeof(results[0])).equal("object");
		expect(new Date(results[0].date)).instanceof(Date);
	}).timeout(3000);
	it("$isa",async function() {
		const results = await db.query({Object:{date:{$isa:"Date"}}});
		expect(typeof(results[0])).equal("object");
		expect(new Date(results[0].date)).instanceof(Date);
	}).timeout(3000);
	it("$matches",async function() {
		const results = await db.query({Object:{name:{$matches:["test"]}}});
		expect(typeof(results[0])).equal("object");
		expect((new RegExp("test")).test(results[0].name)).equal(true);
	});
	it("$and flat",async function() {
		const results = await db.query({Object:{middle:{$and:{$lt:1,$gt:-1}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$and nested",async function() {
		const results = await db.query({Object:{middle:{$and:{$lt:1,$and:{$gt:-1}}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$and array",async function() {
		const results = await db.query({Object:{middle:{$and:[{$lt:1},{$gt:-1}]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$or flat",async function() {
		const results = await db.query({Object:{middle:{$or:{$lt:0,$gt:-1}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$or nested",async function() {
		const results = await db.query({Object:{middle:{$or:{$lt:0,$or:{$gt:-1}}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$or array",async function() {
		const results = await db.query({Object:{middle:{$or:[{$lt:0},{$gt:-1}]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$xor flat",async function() {
		const results = await db.query({Object:{middle:{$xor:{$lt:1,$gt:1}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$xor nested",async function() {
		const results = await db.query({Object:{middle:{$xor:{$lt:1,$xor:{$gt:1}}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$xor array",async function() {
		const results = await db.query({Object:{middle:{$xor:[{$lt:1},{$gt:1}]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].middle).equal(0);
	});
	it("$not",async function() {
		const results = await db.query({Object:{name:{$not:{$eq:"name"}}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	for(const key of ["date","day","fullYear","hours","milliseconds","minutes","month","seconds","time","UTCDate","UTCDay","UTCFullYear","UTCHours","UTCSeconds","UTCMilliseconds","UTCMinutes","UTCMonth","year"]) {
		const fname = `get${key[0].toUpperCase()}${key.substring(1)}`;
		it("$" + key, Function(`return async function() {
			const results = await db.query({Object:{date:{["$${key}"]:TESTDATE}}});
			expect(typeof(results[0])).equal("object");
			expect(results[0].date["${fname}"]()).equal(TESTDATE["${fname}"]()); 
		}`)());
		it("$" + key + " from time", Function(`return async function() {
			const results = await db.query({Object:{date:{["$${key}"]:TESTDATE.getTime()}}});
			expect(typeof(results[0])).equal("object");
			expect(results[0].date["${fname}"]()).equal(TESTDATE["${fname}"]()); 
		}`)());
	}
	it("double property",async function() {
		const results = await db.query({Object:{name:"test",middle:0}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
		expect(results[0].middle).equal(0);
	});
	it("partial",async function() {
		const results = await db.query({Object:{name:"test"}},{partial:true});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
		expect(Object.keys(results[0]).length).equal(2);
	});
	it("$search", async function() {
		const results = await db.query({Object:{notes:{$search:"spaces words"}}});
		expect(typeof(results[0])).equal("object");
	}).timeout(4000);
	xit("$search RegExp", function(done) {
		let some = 0;
		db.query({Object:{notes:{$search:/lives/}}}).forEach(object => { some++; expect(object.notes.indexOf("loves")>=0).equal(true); })
		.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
	});
	xit("$search RegExp from string", function(done) {
		let some = 0;
		db.query({Object:{notes:{$search:"/lives/"}}}).forEach(object => { some++; expect(object.notes.indexOf("loves")>=0).equal(true); })
		.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
	});
	xit("$search RegExp in string", function(done) {
		let some = 0;
		db.query({Object:{notes:{$search:"/lives/ loves"}}}).forEach(object => { some++; expect(object.notes.indexOf("loves")>=0).equal(true); })
		.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
	});
	xit("$search expression in string", function(done) {
		let some = 0;
		db.query({Object:{notes:{$search:`{$eq:"loves"}`}}}).forEach(object => { some++; expect(object.notes.indexOf("loves")>=0).equal(true); })
		.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
	});
	xit("join",async function() {
		const results = await db.join({name:{$neq:null}},{name:{$neq:null}},([o1,o2]) => o1.name===o2.name);
		expect(results.length).equal(1);
	});
	xit("delete",async function() {
		await db.removeItem(o1);
		const results = await db.query({Object:{name:"test"}});
		expect(results.length).equal(0);
	});
	it("$. [fname,...args] (startsWith) string",async function() {
		const results = await db.query({Object:{name:{"$.":["startsWith","te"]}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$.startsWith string",async function() {
		const results = await db.query({Object:{name:{"$.startsWith":"te"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("$.endsWith string",async function() {
		const results = await db.query({Object:{name:{"$.endsWith":"st"}}});
		expect(typeof(results[0])).equal("object");
		expect(results[0].name).equal("test");
	});
	it("get User",async function() {
		const results = await db.query({User:{userName:username}});
		expect(results.length).equal(1);
		expect(results[0]).instanceof(db.ctors["User"]);
		expect(results[0].userName).equal(username);
	});
	it("get Schema",async function() {
		const schema = await db.getSchema("User");
		expect(schema).instanceof(db.ctors["Schema"]);
		expect(schema["#"]).equal("Schema@User");
	});
	it("fail Schema validation", async function() {
		const schema = await db.getSchema("User"),
			data = {"#":"User@1234"},
			errors = await schema.validate(data,db);
		expect(errors.length>=1).equal(true);
	});
	it("test when", async function() {
		const item = await db.putItem({testWhen: true,deletedProperty:true});
		expect(item.testWhen).equal(true);
		expect(item.deleteProperty).equal(undefined);
	});
	it("10 setItem", async function() {
		for(let i=0;i<10;i++) {
			await db.setItem(`key${i}`,i,{await:true});
		}
	}).timeout(11000);
	it("10 getItem", async function() {
		for(let i=0;i<10;i++) {
			const value = await db.getItem(`key${i}`);
			expect(value).equal(i);
		}
	}).timeout(10000);
	it("10 removeItem by key", async function() {
		for(let i=0;i<10;i++) {
			await db.removeItem(`key${i}`);
		}
	}).timeout(11000);
	it("10 getItem after remove", async function() {
		for(let i=0;i<10;i++) {
			const value = await db.getItem(`key${i}`);
			expect(value).equal(undefined);
		}
	}).timeout(20000);
	it("10 putItem", async function() {
		for(let i=0;i<10;i++) {
			db.putItem({id:i},{await:true});
		}
	}).timeout(30000);
	let results;
	it("10 query", async function() {
		results = await db.query({Object:{id:{$gte:0,$lte:99}}});
		expect(results.length>=10).equal(true);
	}).timeout(100000);
	it("10 removeItem", async function() {
		for(const item of results) {
			await db.removeItem(item);
		}
	}).timeout(100000);
	it("10 query after removeItem", async function() {
		results = await db.query({Object:{id:{$gte:0,$lte:99}}});
		expect(results.length).equal(0);
	}).timeout(100000);
	it("create and delete Position",function(done) {
		Thunderclap.Position.create().then((position) => {
			db.putItem(position).then((object) => {
				expect(object.coords.latitude).equal(position.coords.latitude);
				done();
			})
		});
	}).timeout(5000);
	it("create graph",async function() {
		const result = await db.put({l1:{l2:{l3:{l4:{l5:"value"}}}}});
		expect(typeof(result)).equal("object");
	});
	it("get graph via index",async function() {
		const result = await db.getItem("!e!l1!l2!l3!l4!l5");
		expect(result).equal("value");
	});
	it("get graph via value",async function() {
		const result = await db.value("l1.l2.l3.l4.l5");
		expect(result).equal("value");
	});
});



		
		



