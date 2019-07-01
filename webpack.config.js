const path = require("path"),
	fs = require("fs"),
	{ spawn } = require('child_process'),
	webpack = require('webpack'),
	WebpackShellPlugin = require('webpack-shell-plugin'),
	TerserPlugin = require('terser-webpack-plugin');

let config;
try {
	config = JSON.parse(fs.readFileSync(path.resolve(__dirname,"../thunderclap.json")));
} catch(e) {
	try {
		config = JSON.parse(fs.readFileSync(path.resolve(__dirname,"/thunderclap.json")));
	} catch(e) {
		throw e;
	}
}

const CLOUDFLARED = config.cloudflaredPath, 
	ACCOUNT_ID = config.cloudflareAccountId, 
	AUTH_KEY = config.cloudflareAuthKey,
	ZONE_ID = config.zoneId,
	NAMESPACE_ID = config.nameSpaceId, 
	EMAIL = config.email, 
	HOSTNAME = config.primaryHostName, 
	MODE = config.mode,
	PORT = config.devPort,
	ROOT = config.devRoot,
	DEV_HOST = config.devHost,
	DEV_NAMESPACE_ID = config.devNameSpaceId,
	DBO_PASSWORD = config.dboPassword||"dbo",
	MINIMIZE = !!config.minimize,
	host = `${MODE==="development" ? DEV_HOST+'-' : ''}thunderclap.${HOSTNAME}`,
	namespace = `${MODE==="development" ? DEV_NAMESPACE_ID : NAMESPACE_ID}`,
	scriptName = `${MODE==="development"  ? DEV_HOST+"-" : ""}thunderclap-${HOSTNAME.split(".").join("-")}`,
	metadataScript = `echo {"body_part":"script","bindings":[{"type":"kv_namespace","name":"NAMESPACE","namespace_id":"${namespace}"}]} > metadata.json`,
	putScript = `curl -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/scripts/${scriptName}" -H "X-Auth-Email:${EMAIL}" -H "X-Auth-Key:${AUTH_KEY}" -F "metadata=@metadata.json;type=application/json" -F "script=@cloud.js;type=application/javascript"`,
	putRoute = `curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" -H "X-Auth-Email:${EMAIL}" -H "X-Auth-Key:${AUTH_KEY}" -H "Content-type: application/json" -d "{\\"pattern\\": \\"${host}/*\\", \\"script\\":\\"${scriptName}\\"}"`;
	keysScript = `curl -X GET "https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${namespace}/keys?limit=1000" -H "X-Auth-Email:${EMAIL}" -H "X-Auth-Key:${AUTH_KEY}"`;
	keys = 
	`(function() {
		function getKeys(prefix,cursor) { 
			return fetch(\`https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/storage/kv/namespaces/${namespace}/keys?limit=1000\${cursor ? "&cursor="+cursor : ""}\${prefix ? "&prefix="+prefix : ""}\`,
				{headers:{"X-Auth-Email":"${EMAIL}","X-Auth-Key":"${AUTH_KEY}"}})
				.then((result) => result.json())
		}
		module.exports = async function keys(prefix,cursor) {
			if(cursor!=="") {
				let {result,result_info} = await getKeys(prefix,cursor);
				result = result.map((item) => item.name);
				result.push(result_info.cursor);
				return result;
			}
			return [];
		}
	}).call(this)`;

	var liveServer = require("live-server");

var params = {
	port: PORT, // Set the server port. Defaults to 8080.
	//host: "0.0.0.0", // Set the address to bind to. Defaults to 0.0.0.0 or process.env.IP.
	root: ROOT, // Set root directory that's being served. Defaults to cwd.
	open: false, // When false, it won't load your browser by default.
	//ignore: 'scss,my/templates', // comma-separated string for paths to ignore
	//file: "index.html", // When set, serve this file (server root relative) for every 404 (useful for single-page applications)
	//wait: 1000, // Waits for all changes, before reloading. Defaults to 0 sec.
	//mount: [['/components', './node_modules']], // Mount a directory to a route.
	logLevel: 2, // 0 = errors only, 1 = some, 2 = lots
	//middleware: [function(req, res, next) { next(); }] // Takes an array of Connect-compatible middleware that are injected into the server middleware stack
};
liveServer.start(params);
console.log("live-server running on http://localhost:${PORT}");	

const tunnel = spawn(`${path.resolve(__dirname,CLOUDFLARED)}`,["--hostname",`${host}`,`http://localhost:${PORT}`],{shell:true});
tunnel.stdout.on('data', function (data) {
   // process.stdout.write(data);
});
tunnel.stderr.on('data', function (data) {
    process.stderr.write(data);
});	

fs.writeFileSync(`${path.resolve(__dirname,"dbo.js")}`,`(function() { module.exports="${DBO_PASSWORD}"; }).call(this)`);
fs.writeFileSync(`${path.resolve(__dirname,"keys.js")}`,keys);


module.exports = {
  mode: "production",
  optimization: {
    minimize: MINIMIZE,
    minimizer: [
    	new TerserPlugin({
	        terserOptions: {
	        	keep_classnames: true,
	            keep_fnames: true
	        }
	      })
    	]
  },
  watch: true,
  context: path.resolve(__dirname, "src"),
  entry: {
	cloud: "./cloud.js" ,
	thunderclap: "./thunderclap.js"
  },
  output: {
	  path: __dirname, //path.resolve(__dirname,ROOT),
	  filename: (chunkData) => {
		  return chunkData.chunk.name === "cloud" ? "cloud.js" : `${ROOT}/[name].js`
	  }
  },
  plugins: [
	  new WebpackShellPlugin({
		  //onBuildStart:[`echo (function() { module.exports="${DBO_PASSWORD}"; }).call(this) > dbo.js`],
		  onBuildEnd:[`${metadataScript} && ${putScript} && ${putRoute}`], //  && ${keysScript}
		  dev: false
	  }),
	  // this ignore is not working
	  new webpack.WatchIgnorePlugin([
		  /.*\dbo.js/ 
	  ])
  ],
}









