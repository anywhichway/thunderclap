const path = require("path"),
	fs = require("fs"),
	{ spawn } = require('child_process'),
	WebpackShellPlugin = require('webpack-shell-plugin'),
	config = JSON.parse(fs.readFileSync(path.resolve(__dirname,"../thunderclap.json"))),
	CLOUDFLARED = config.cloudflaredPath, 
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
	host = `${MODE==="development" ? DEV_HOST+'-' : ''}thunderdb.${HOSTNAME}`,
	namespace = `${MODE==="development" ? DEV_NAMESPACE_ID : NAMESPACE_ID}`,
	scriptName = `${MODE==="development"  ? DEV_HOST+"-" : ""}thunderdb-${HOSTNAME.split(".").join("-")}`,
	metadataScript = `echo {"body_part":"script","bindings":[{"type":"kv_namespace","name":"NAMESPACE","namespace_id":"${namespace}"}]} > metadata.json`,
	putScript = `curl -X PUT "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/scripts/${scriptName}" -H "X-Auth-Email:${EMAIL}" -H "X-Auth-Key:${AUTH_KEY}" -F "metadata=@metadata.json;type=application/json" -F "script=@worker.js;type=application/javascript"`,
	putRoute = `curl -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/workers/routes" -H "X-Auth-Email:${EMAIL}" -H "X-Auth-Key:${AUTH_KEY}" -H "Content-type: application/json" -d "{\\"pattern\\": \\"${host}/*\\", \\"script\\":\\"${scriptName}\\"}"`;

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
    process.stdout.write(data);
});
tunnel.stderr.on('data', function (data) {
    process.stderr.write(data);
});	

module.exports = {
  mode: "production",
  optimization: {
    minimize: false
  },
  watch: true,
  context: path.resolve(__dirname, "src"),
  entry: {
	server: "./server.js" ,
	thunderdb: "./thunderdb.js"
  },
  output: {
	  path: __dirname, //path.resolve(__dirname,ROOT),
	  filename: (chunkData) => {
		  return chunkData.chunk.name === "server" ? "worker.js" : `${ROOT}/[name].js`
	  }
  },
  plugins: [
	  new WebpackShellPlugin({
		  //onBuildStart:['echo "Webpack Start"'],
		  onBuildEnd:[`${metadataScript} && ${putScript} && ${putRoute}`],
		  dev: false
	  })
  ],
}









