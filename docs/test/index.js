
var chai,
	expect,
	db;
if(typeof(window)==="undefined") {
	chai = require("chai");
	expect = chai.expect;
	db = new ThunderDB(config);
}

// config = {endpoint:"https://test.thunderdb.com/db.json",user:{email:"",password:""}}
TESTDATE = new Date();

let o1,
	o2;
	
describe("xgraph",function() {
	it("auto create path",function(done) {
		db.get("/a/b/c").forEach((node) => {
			chai.expect(node.key).equal("/a/b/c");
			done();
		});
	});
	it("primitive value set",function(done) {
		db.get("/a/b").value(0).forEach((value) => {
			try { chai.expect(value).equal(0); } catch(e) { done(e); return; }
			done();
		});
	});
	it("primitive value get",function(done) {
		db.get("/a/b").value().forEach((value) => {
			try { chai.expect(value).equal(0); } catch(e) { done(e); return; }
			done();
		});
	});
	it("child primitive value set",function(done) {
		db.get("/a/b/c").value(0).forEach((value) => {
			chai.expect(value).equal(0);
			done();
		});
	});
	it("child primitive value get",function(done) {
		db.get("/a/b/c").value(0).forEach((value) => {
			chai.expect(value).equal(0);
		}).then(() => done());
	});
	it("primitive value test /a/b:=>==0/c:=>==0",function(done) {
		let some = 0;
		db.get("/a/b:=>===0/c:=>==0").value().forEach((value) => {
			chai.expect(value).equal(0);
		}).then(() => done());
	});
	it("primitive value predicate test /a/b/c:{$gt:-1}",function(done) {
		let some = 0;
		db.get("/a/b/c:{$gt:-1}").value().forEach((value) => {
			chai.expect(value).equal(0);
		}).then(() => done());
	});
	it("path key test /=>==='a'/(key)=>key==='b':=>>=0/c:=>==0",function(done) {
		let some = 0;
		db.get("/=>==='a'/(key)=>key==='b':=>>=0/c:=>==0").value().forEach((value) => {
			chai.expect(value).equal(0);
		}).then(() => done());
	});
	it("path predicate test /{$eq:'a'}/b/c:{$gt:-1}",function(done) {
		let some = 0;
		db.get(`/{$eq:"a"}/b/c:{$gt:-1}`).value().forEach((value) => {
			chai.expect(value).equal(0);
		}).then(() => done());	
	});
	it("direct object value",function(done) {
		db.get("/a/b/c/d").value({count:1}).forEach((value) => {
			chai.expect(value.count).equal(1);
		}).then(() => done());
	});
	it("direct object patch",function(done) {
		db.get("/a/b/c/d").patch({count:2}).forEach((value) => {
			chai.expect(value.count).equal(2);
		}).then(() => done());
	});
	it("on value change",async function() {
		let changed = false;
		await db.get("onvalue")
			.on({change:(value,oldvalue,use) => { 
				chai.expect(value).equal(1); 
				return changed = true;
			 }})
			.value(1);
		chai.expect(changed).equal(true);
	});
	it("on value no change",async function() {
		let changed = false;
		await db.get("onvalue")
			.on({change:(value,oldvalue,use) => { 
				chai.expect(value).equal(1); 
				return changed = true;
			 }})
			.value(1);
		chai.expect(changed).equal(false);
	});
	it("on value",async function() {
		const value = (await db.get("onvalue").on({value:
					value => {
						return value + 1
					}
			}).value())
			console.log(value);
		chai.expect(value[0]).equal(2);
	});
});
describe("query atomic",function() {
		it("nested",function(done) {
			db.putItem({expires:true, anumber:20, address:{city:"seattle",zipcode:{base:98101,plus4:0}}},{force:true,expireAt:new Date(),atomic:true}).then(value => o2 = value).then(object => {
					chai.expect(object.address.city).equal("seattle");
					done();
			})
		});
		it("query forEach",function(done) {
			let some = 0;
			db.query({expires:true}).forEach(object => { 
					some++; 
					chai.expect(object.address.city).equal("seattle");
			}).then(() => {
				chai.expect(some).equal(1);
				done();
			})
		});
		it("query a predicate",function(done) {
			let some = 0;
			db.query({anumber:{$gt:19}}).forEach(object => { 
					some++; 
					chai.expect(object.anumber).equal(20); 
				}).then(() => {
					some ? done() : done(new Error("Missing result")).catch(e => done(e));
				})
		});
		xit("expire",function(done) {
			setTimeout(() => {
				let some = 0;
				db.query({expires:true}).forEach(object => { 
					some++; chai.expect(object.address.city).equal("seattle");
				}).then(() => some ? done(new Error("chai.expected no result")) : done()).catch(e => done(e));
			},3000)
		}).timeout(5000);
});
xdescribe("put merge",function() {
	it("put",function(done) {
		db.putItem({id:1,children:{2:true}})
			.then(object => {
				chai.expect(object.id).equal(1);
				chai.expect(object.children[2]).equal(true);
				done();
			})
	}).timeout(3000);
	it("query",function(done) {
		let some = 0;
		db.query({id:1,children:{2:true}})
			.forEach(object => { 
				some++; 
				chai.expect(object.id).equal(1);
				object.children["3"] = true;
				object.children["2"] = false;
				db.putItem(object).then(object => {
					chai.expect(object.children["3"]).equal(true);
					chai.expect(object.children["2"]).equal(false);
					done();
				})
			}).then(() => some || done(new Error("Missing result"))).catch(e => done(e));
	}).timeout(3000);
});
xdescribe("arbitration",function() {
	it("ignore past",function(done) {
		db.query({id:1})
			.forEach(object => {
				object.id=2;
				//object._ = Object.assign({},object._);
				//object._.modifiedAt = new Date(Date.now()-500);
				const metadata = Object.assign({},object._);
				object = Object.assign({},object);
				object.id=2;
				object["#"] = metadata["#"];
				object._ = metadata;
				object._.modifiedAt = new Date(object._.modifiedAt.getTime()-1);
				db.putItem(object).then(object => {
					chai.expect(object).equal(undefined);
					done();
				}).catch(e => done(e))
			}).catch(e => done(e))
	});
	it("merge more recent",function(done) {
		db.query({id:1})
			.forEach(object => {
				object.id=2;
				object._.modifiedAt = new Date(object._.modifiedAt.getTime()+1);
				let some = 0;
				db.putItem(object).then(object => {
					chai.expect(object.id).equal(2);
					done()
				}).catch(e => done(e))
			}).catch(e => done(e))
	}).timeout(5000);
	it("created latest",function(done) {
		db.query({id:2})
			.forEach(object => {
				object.id=3;
				object._.createdAt = new Date(object._.createdAt.getTime()+10);
				db.putItem(object).then(object => {
					chai.expect(object.id).equal(3);
					done();
				}).catch(e => done(e))
			}).catch(e => done(e))
	}).timeout(5000);
	it("lexically less",function(done) {
		db.query({id:3})
			.forEach(object => {
				object.id=4;
				object._["#"] = object._["#"].substring(0,object._["#"].length-1);
				db.putItem(object).then(object => {
					chai.expect(object.id).equal(4);
					done();
				}).catch(e => done(e))
			}).catch(e => done(e))
	});
	it("schedule future",function(done) {
		db.query({id:4}).forEach(object => {
			object.id=5;
			object._.modifiedAt = new Date(Date.now()+1000);
			db.putItem(object).then(object => {
				chai.expect(object).equal(undefined);
				let some = 0;
				setTimeout(() => {
					db.query({id:5}).forEach(object => {
						some++;
					})
					.then(() => { some ? done() : done(new Error("Missing result"))}).catch(e => done(e));
				},5000);
			}).catch(e => done(e))
		}).catch(e => done(e))
	}).timeout(6000);
});
describe("querying", function() {
	describe("query",function() {
		xit("overhead ##", function(done) { done(); });
		xit("secure",function(done) {
			Promise.all([
				db.get("Object/secret").on({get:value => "****"}),
				db.get("Object/protected").secure({},{"#":"user1"}),
				db.get("Object/hide").secure({write:true},{"#":"user1"}),
				db.get("Object/read").secure({read:true},{"#":"user1"}),
				db.get("Object/readwrite").secure({write:true},{"#":"user2"}),
				db.get("Object/age").secure({read:true,write:true},"*").then(edge => db.get("Object/age").secure({write:true},{"#":"user2"}))
			]).then(() => done())
		});
		xit("putItem promised",function(done) {
			let some = 0;
			db.putItem({
				name:"mary",
				address:{city:"nyc"},
				geopoint: new db.GeoPoint()
				})
				.then(object => { chai.expect(typeof(object["#"])).equal("string"); done(); })
				.catch(e => done(e));
		}).timeout(15000);
		it("put nested item",function(done) {
			db.putItem({
				birthday: TESTDATE,
				name:"joe",
				age:27,
				size:10,
				secret:24,
				hide: "hide",
				read: "read",
				readwrite: "readwrite",
				ssn:"555-55-5555",
				ip:"127.0.0.1",
				email: "joe@somewhere.com",
				address:{city:"seattle",zipcode:{base:98101,plus4:1}},
				notes: "loves how he lives",
				favoriteNumbers:[7,15,Infinity,NaN]})
				.then(value => o1 = value).then(object => {
					chai.expect(object.name).equal("joe"); 
					chai.expect(object.age).equal(27);
					done();
				})
		}).timeout(10000);
		it("wild card key",function(done) {
			let some = 0;
			db.query({$_:{$eq: "joe"}})
			.forEach(object => { some++; chai.expect(object.name).equal("joe"); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("RegExp key",function(done) {
			let some = 0;
			db.query({[/.*name/]:{$eq: "joe"}})
			.forEach(object => { some++; chai.expect(object.name).equal("joe"); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("partial",function(done) {
			let some = 0;
			db.query({name:"joe"},{partial:true})
				.forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(Object.keys(object).length).equal(1);})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("double property",function(done) {
			let some = 0;
			db.query({name:"joe",age:27})
				.forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.age).equal(27);})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		xit("inline property",function(done) {
			let some = 0;
			db.query({[key => key==="age"]:{$lt:28}})
				.forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("inline value true",function(done) {
			let some = 0;
			db.query({age:value => value < 28})
				.forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("inline value false",function(done) {
			let some = 0;
			db.query({age:value => value < 27}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done(new Error("Unchai.expected result")) :  done()).catch(e => done(e));
		});
		xit("functional key",function(done) {
			let some = 0;
			db.query({[key => key==="name"]:{$typeof:"string"}})
				.forEach(object => { some++; chai.expect(typeof(object.name)).equal("string"); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$",function(done) {
			let some = 0;
			db.query({name:{$:value=>value==="joe"}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$lt",function(done) {
			let some = 0;
			db.query({age:{$lt:28}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$lte",function(done) {
			let some = 0;
			db.query({age:{$lte:27}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$eq",function(done) {
			let some = 0;
			db.query({age:{$eq:27}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$eq string",function(done) {
			let some = 0;
			db.query({age:{$eq:"27"}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$eeq",function(done) {
			let some = 0;
			db.query({age:{$eeq:27}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$neq string",function(done) {
			let some = 0;
			db.query({age:{$neq:"5"}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$neeq",function(done) {
			let some = 0;
			db.query({age:{$neeq:5}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$eeq string",function(done) {
			let some = 0;
			db.query({age:{$eeq:"27"}}).forEach(object => { some++; })
				.then(() => some ? done(new Error("Extra result")) : done()).catch(e => done(e))
		});
		it("$gte",function(done) {
			let some = 0;
			db.query({age:{$gte:27}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$gt",function(done) {
			let some = 0;
			db.query({age:{$gt:26}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$between",function(done) {
			let some = 0;
			db.query({age:{$between:[26,28]}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$between inclusive",function(done) {
			let some = 0;
			db.query({age:{$between:[27,28,true]}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$outside higher",function(done) {
			let some = 0;
			db.query({age:{$outside:[25,26]}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$outside lower",function(done) {
			let some = 0;
			db.query({age:{$outside:[28,29]}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$echoes",function(done) {
			let some = 0;
			db.query({name:{$echoes:"jo"}}).forEach(object => { some++; chai.expect(object.name).equal("joe");})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$isArray",function(done) {
			let some = 0;
			db.query({favoriteNumbers:{$isArray:null}}).forEach(object => { 
				some++; 
				chai.expect(object.favoriteNumbers.length).equal(4);
				})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$isEmail",function(done) {
			let some = 0;
			db.query({email:{$isEmail:null}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.email).equal("joe@somewhere.com");})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$isEven",function(done) {
			let some = 0;
			db.query({size:{$isEven:null}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.size).equal(10);})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$isIPAddress",function(done) {
			let some = 0;
			db.query({ip:{$isIPAddress:null}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.ip).equal("127.0.0.1");})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$isOdd",function(done) {
			let some = 0;
			db.query({age:{$isOdd:null}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.age).equal(27);})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$isSSN",function(done) {
			let some = 0;
			db.query({ssn:{$isSSN:null}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.age).equal(27);})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$in",function(done) {
			let some = 0;
			db.query({name:{$in:["joe"]}}).forEach(object => { some++; chai.expect(object.name).equal("joe");})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$instanceof",function(done) {
			let some = 0;
			db.query({name:{$neq:null},address:{$instanceof:Object}}).forEach(object => { some++; chai.expect(object.address instanceof Object).equal(true)})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$instanceof cname",function(done) {
			let some = 0;
			db.query({name:{$neq:null},address:{$instanceof:"Object"}}).forEach(object => { some++; chai.expect(object.address instanceof Object).equal(true)})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$matches",function(done) {
			let some = 0;
			db.query({name:{$matches:["joe"]}}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.age).equal(27);})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$nin",function(done) {
			let some = 0;
			db.query({name:{$nin:["mary"]}}).forEach(object => { some++; chai.expect(object.name).equal("joe");})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$typeof",function(done) {
			let some = 0;
			db.query({name:{$typeof:"string"}}).forEach(object => { some++; chai.expect(typeof(object.name)).equal("string");})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$and single",function(done) {
			let some = 0;
			db.query({age:{$and:{$lt:28,$gt:26}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$and nested",function(done) {
			let some = 0;
			db.query({age:{$and:{$lt:28,$and:{$gt:26}}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$and array",function(done) {
			let some = 0;
			db.query({age:{$and:[{$lt:28},{$gt:26}]}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$or single",function(done) {
			let some = 0;
			db.query({age:{$or:{$eeq:28,$eq:27}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$or nested",function(done) {
			let some = 0;
			db.query({age:{$or:{$eeq:28,$or:{$eeq:27}}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$or array",function(done) {
			let some = 0;
			db.query({age:{$or:[{$eeq:28},{$eeq:27}]}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$xor",function(done) {
			let some = 0;
			db.query({age:{$xor:{$eeq:28,$eq:27}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$not",function(done) {
			let some = 0;
			db.query({age:{$not:{$eeq:28}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$not $xor",function(done) {
			let some = 0;
			db.query({age:{$not:{$xor:{$eeq:27,$eq:27}}}}).forEach(object => { some++; chai.expect(object.age).equal(27); })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$search", function(done) {
			let some = 0;
			db.query({notes:{$search:"lover lives"}}).forEach(object => { some++; chai.expect(object.notes.indexOf("loves")>=0).equal(true); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$search RegExp", function(done) {
			let some = 0;
			db.query({notes:{$search:/lives/}}).forEach(object => { some++; chai.expect(object.notes.indexOf("loves")>=0).equal(true); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$search RegExp from string", function(done) {
			let some = 0;
			db.query({notes:{$search:"/lives/"}}).forEach(object => { some++; chai.expect(object.notes.indexOf("loves")>=0).equal(true); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$search RegExp in string", function(done) {
			let some = 0;
			db.query({notes:{$search:"/lives/ loves"}}).forEach(object => { some++; chai.expect(object.notes.indexOf("loves")>=0).equal(true); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("$search expression in string", function(done) {
			let some = 0;
			db.query({notes:{$search:`{$eq:"loves"}`}}).forEach(object => { some++; chai.expect(object.notes.indexOf("loves")>=0).equal(true); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		for(const key of ["date","day","fullYear","hours","milliseconds","minutes","month","seconds","time","UTCDate","UTCDay","UTCFullYear","UTCHours","UTCSeconds","UTCMilliseconds","UTCMinutes","UTCMonth","year"]) {
			const fname = `get${key[0].toUpperCase()}${key.substring(1)}`;
			it("$" + key, Function("chai","db",`return function(done) {
				let some = 0;
				db.query({birthday:{["$${key}"]:TESTDATE}}).forEach(object => { 
					some++; 
					//console.log(object);
					chai.expect(object.birthday["${fname}"]()).equal(TESTDATE["${fname}"]()); 
				})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
			}`)(chai,db));
			it("$" + key + " from time", Function("chai","db",`return function(done) {
				let some = 0;
				//debugger;
				db.query({birthday:{["$${key}"]:TESTDATE.getTime()}}).forEach(object => { 
					some++; 
					//console.log(object);
					chai.expect(object.birthday["${fname}"]()).equal(TESTDATE["${fname}"]()); 
				})
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
			}`)(chai,db));
		}
		it("secret", function(done) {
			let some = 0;
			db.query({name:"joe"}).forEach(object => { some++; chai.expect(object.name).equal("joe"); chai.expect(object.secret).equal("****");})
					.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("handle Infinity and NaN ",function(done) {
			let some = 0;
			db.query({name:"joe"})
				.forEach(object => { 
					some++; 
					chai.expect(object.favoriteNumbers[2]).equal(Infinity);
					chai.expect(typeof(object.favoriteNumbers[3])).equal("number");
					chai.expect(isNaN(object.favoriteNumbers[3])).equal(true);
					})
					.then(() => some ? done() : done(new Error("Missing result")))
					.catch(e => done(e));
		});
		it("query nested",function(done) {
			let some = 0;
			db.query({name:{$neq:null},address:{city:"seattle"}})
				.forEach(object => { 
						some++; chai.expect(object.address.city).equal("seattle");
				 })
				.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
			});
		xit("join",function(done) {
			let some = 0;
			db.join({name:{$neq:null}},{name:{$neq:null}},([o1,o2]) => o1.name===o2.name).forEach(record => { some++; chai.expect(record.length).equal(2); chai.expect(record[0].name).equal(record[1].name); })
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
		});
		it("find",async function() {
				const object = await db.query({name:{$neq:null},address:{city:"seattle"}})
					.find(object => object.address.city==="seattle");
				chai.expect(object.address.city).equal("seattle");
		});
		it("findIndex",async function() {
				const i = await db.query({name:{$neq:null},address:{city:"seattle"}}).findIndex(object => object.address.city==="seattle");
				chai.expect(i).equal(0);
		});
		it("findIndex not",async function() {
				const i = await db.query({name:{$neq:null},address:{city:{$neq:null}}}).findIndex(object => object.address.city==="miami");
				chai.expect(i).equal(-1);
		});
		xit("delete",function(done) {
			db.removeItem(o1).then(() => {
				let some = 0;
				db.query({name:"joe"}).forEach(object => { some++;})
						.then(() => some ? done(new Error("Extra result")) : done()).catch(e => done(e))
			});
		}).timeout(3000);
	});
});
xdescribe("select projections", function() {
	it("$as",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$as:"Name"}})
			.forEach(object => { 
				some++;
				chai.expect(typeof(object.Name)).equal("string");
				})
			.then(() => some ? done() : done(new Error("Missing result"))).catch(e => done(e));
	});
	it("$compute",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string"},computed:{$compute: function() { return this.name}}})
			.forEach(object => { 
				some++;
				chai.expect(object.computed).equal(object.name);
				})
			.then(() => some ? done() : done(new Error("Missing result")))
			.catch(e => done(e));
	});
	it("$default",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string"},dummy:{$default: "dummy"}})
			.forEach(object => { 
				some++;
				chai.expect(typeof(object.name)).equal("string");
				chai.expect(object.dummy).equal("dummy");
				})
			.then(() => some ? done() : done(new Error("Missing result")))
			.catch(e => done(e));
	});
});
describe("validation", function() {
	it("$valid pass",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$valid:{$typeof: "string"}}})
			.forEach(object => { 
				some++;
				chai.expect(typeof(object.name)).equal("string");
				})
			.then(() => some ? done() : done(new Error("Missing result")))
			.catch(e => done(e));
	});
	it("$valid fail",async function() {
		try {
			await db.query({name:{$typeof:"string",$valid:{$typeof: "number"}}})
			throw Error("unexpected success");
		} catch(e) {
			true
		}
	});
});
xdescribe("$freeze",function() {
	it("primitive",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$freeze:true}})
			.forEach(object => {
				some++;
				const {configurable,writable} = Object.getOwnPropertyDescriptor(object,"name");
				chai.expect(configurable).equal(false);
				chai.expect(writable).equal(false);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	});
	it("object and property",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string"},address:{$freeze:{}}})
			.forEach(object => {
				some++;
				const {configurable,writable} = Object.getOwnPropertyDescriptor(object,"address");
				chai.expect(configurable).equal(false);
				chai.expect(configurable).equal(false);
				chai.expect(Object.isFrozen(object.address)).equal(true);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	});
	it("object and not property",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string"},address:{$freeze:{property:false}}})
			.forEach(object => {
				some++;
				const {configurable,writable} = Object.getOwnPropertyDescriptor(object,"address");
				chai.expect(configurable).equal(true);
				chai.expect(configurable).equal(true);
				chai.expect(Object.isFrozen(object.address)).equal(true);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	})
});
describe("$return",function() {
	it("value",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$return:value=>value}})
			.forEach(object => {
				some++;
				chai.expect(typeof(object.name)).equal("string");
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	});
	it("configured",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$return:{enumerable:false,configurable:true}}})
			.forEach(object => {
				some++;
				const {enumerable,configurable} = Object.getOwnPropertyDescriptor(object,"name");
				chai.expect(enumerable).equal(false);
				chai.expect(configurable).equal(true);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	});
	xit("configured $value",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$return:{$value:value=> 1}}})
			.forEach(object => {
				some++;
				chai.expect(object.name).equal(1);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	});
	it("configured value",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string",$return:{value:1}}})
			.forEach(object => {
				some++;
				chai.expect(object.name).equal(1);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	});
	it("nested",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string"},address:{$return:({city}) => city}})
			.forEach(object => {
				some++;
				chai.expect(typeof(object.address)).equal("string");
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	})
	it("nested get",function(done) {
		let some = 0;
		db.query({name:{$typeof:"string"},address:{$return:{get:()=>1}}})
			.forEach(object => {
				some++;
				chai.expect(object.address).equal(1);
			})
			.then(() => some ? done() : done(new Error("Missing result")))
	})
});
class Person {
	constructor(config) {
		Object.assign(this,config);
	}
}
xdescribe("sql-like syntax",function() {
	it("insert",function(done) {
		db.insert({name:"juliana",age:58},{name:"joe",age:56})
			.into(Person)
			.exec()
			.then(count => {
				chai.expect(count).equal(2);
				done();
			});
	});
	it("select",function(done) {
		db.select()
			.from(Person)
			.exec()
			.forEach(() => true)
			.then((count) => {
				chai.expect(count).equal(2);
				done()
			});
	});
	it("select random",function(done) {
		db.select()
			.from(Person)
			.exec()
			.random(1)
			.then((values) => {
				chai.expect(Array.isArray(values)).equal(true);
				chai.expect(values.length).equal(1);
				done()
			});
	});
	it("select random extra",function(done) {
		db.select()
			.from(Person)
			.exec()
			.random(3)
			.then((values) => {
				chai.expect(Array.isArray(values)).equal(true);
				chai.expect(values.length).equal(2);
				done()
			});
	});
	it("select sample",function(done) {
		db.select()
			.from(Person)
			.exec()
			.sample({me:.6,key:"age"})
			.then((values) => {
				chai.expect(Array.isArray(values)).equal(true);
				chai.expect(values.length).equal(1);
				done()
			});
	});
	it("select where",function(done) {
		db.select()
			.from(Person)
			.where({name:"juliana",age:{$eq:58}})
			.exec()
			.forEach((Person) => {
				chai.expect(Person.name).equal("juliana");
				chai.expect(Person.age).equal(58);
				done();
			});
	});
	it("select where same cname alias",function(done) {
		db.select()
			.from(Person)
			.where({Person:{name:"juliana",age:{$eq:58}}})
			.exec()
			.forEach((Person) => {
				chai.expect(Person.name).equal("juliana");
				chai.expect(Person.age).equal(58);
				done();
			});
	});
	it("select where aliased",function(done) {
		db.select()
			.from({p:Person})
			.where({p:{name:"juliana",age:{$eq:58}}})
			.exec()
			.forEach(({p}) => {
				chai.expect(p.name).equal("juliana");
				chai.expect(p.age).equal(58);
				done();
			});
	});
	it("select where aliased as",function(done) {
		db.select({p:{name:"Name",age:"Age",gender:{as:"Gender",default:"TBD"},halfAge:{default:({Age})=>Age/2},twiceAge:{default:({p}) => p.age*2}}}).from({p:Person})
			.where({p:{name:"juliana",age:{$eq:58}}})
			.exec()
			.forEach((item) => {
				chai.expect(item.Name).equal("juliana");
				chai.expect(item.Age).equal(58);
				chai.expect(item.Gender).equal("TBD");
				chai.expect(item.halfAge).equal(58/2);
				chai.expect(item.twiceAge).equal(58*2);
				done();
			});
	});
	it("select where aliased avg",function(done) {
		db.select({p:{name:"Name",age:"Age",avgAge:{$: {avg:"age"}}}}).from({p:Person})
			.where({p:{name:"juliana",age:{$eq:58}}})
			.exec()
			.forEach((item) => {
				chai.expect(item.Name).equal("juliana");
				chai.expect(item.Age).equal(58);
				chai.expect(item.avgAge).equal(58);
			})
			.then((count) => {
				chai.expect(count).equal(1);
				done();
			});
	});
	it("select where aliased running avg",function(done) {
		db.select({p:{name:"Name",age:"Age",runningAvgAge:{$: {avg:"age",running:true}}}}).from({p:Person})
			.where({p:{age:{$gt: 50}}})
			.exec()
			.every((item) => {
				chai.expect(item.runningAvgAge===56||item.runningAvgAge===58||item.runningAvgAge===57).equal(true);
				return true;
			})
			.then((count) => {
				chai.expect(count).equal(2);
				done();
			})
	});
	it("select where join",function(done) {
		db.select()
			.from({p1:Person,p2:Person})
			.where({p1:{name:{$eq:"juliana"}},p2:{name:{$eq:{p1:{name:"$"}}}}})
			.exec()
			.every(({p1,p2}) => {
			p1.name==="juliana";
			p2.name==="juliana";
			return true;
		}).then(count => {
			chai.expect(count>0).equal(true);
			done();
		});
	});
	it("select join",function(done) {
		db.select()
			.from({p1:Person})
			.join({p2:Person})
			.on(({p1,p2}) => p1.name==="juliana" && p1.name===p2.name ? {p1,p2} : false)
			.exec()
			.every(({p1,p2}) => p1.name==="juliana" && p1.name===p2.name)
			.then(count => { 
				chai.expect(count>0).equal(true); 
				done(); 
			});
	});
	it("select join queries on",function(done) {
		db.select()
			.from({p1:db.select().from(Person)})
			.join({p2:db.select().from(Person)})
			.on(({p1,p2}) => p1.name==="juliana" && p1.name===p2.name ? {p1,p2} : false)
			.exec()
			.every(({p1,p2}) => {
				return p1.name==="juliana" && p1.name===p2.name
			})
			.then(count => { 
				chai.expect(count>0).equal(true); 
				done(); 
			});
	});
	it("select join using",function(done) {
		db.select()
			.from({p1:Person})
			.join({p2:Person})
			.using("name")
			.exec()
			.every(({p1,p2}) => p1.name===p2.name)
			.then(count => { 
				chai.expect(count).equal(2); 
				done(); 
			});
	});
	it("natural join",function(done) {
		db.select()
			.from({p1:Person})
			.natural()
			.join({p2:db.select().from(Person)})
			.exec()
			.some(({p1,p2}) => p1.name==="juliana" && p2.name==="juliana")
			.then(() => done());
	});
	xit("cross join",function(done) {
			db.select()
				.from({p1:Person})
				.cross()
				.join({p2:db.select().from(Person)})
				.exec()
				.forEach(item => console.log(item))
				.then(() => done()); //item.name==="juliana"
	});
	it("update",function(done) {
		db.update(Person)
			.set({age:60,city:"seattle"})
			.exec()
			.then(count => {
				chai.expect(count).equal(2);
				done();
			})
	});
	it("update where",function(done) {
		db.update(Person)
			.set({age:61,city:"Bainbridge Island"})
			.where({name:"juliana"})
			.exec()
			.then(count => {
				chai.expect(count).equal(1);
				done();
			})
	});
	it("delete none",function(done) {
		db.delete()
			.from(Person)
			.where({age:{$eq:58}})
			.exec()
			.then(count => {
				chai.expect(count).equal(0);
				done();
			});
	});
	it("delete one",function(done) {
		db.delete()
			.from(Person)
			.where({age:{$eq:60}})
			.exec()
			.then(count => {
				chai.expect(count).equal(1);
				done();
			});
	});
});
		
		



