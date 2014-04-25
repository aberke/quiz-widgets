var express 		= require('express'),
	connect			= require('connect'),
	path 			= require('path'),
	http 			= require('http'),
	MongoStore 		= require('connect-mongo')(express), // for persistent sessions

	config 			= require('./config.js');

	


var app = express();

app.configure(function () {
    app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
    app.use(connect.urlencoded()),
	app.use(connect.json()),
  	app.use(express.cookieParser()), /* must come before session because sessions use cookies */

	app.use(express.session({
		secret: config.session_secret,
	    store: new MongoStore({ // for persistent sessions
	    	db: config.data.db,
	    	url: config.data.url
	    })
	})),
        

    app.use(express.static(path.join(__dirname, '/static')));
});
var server = http.createServer(app);



/* ROUTING ---------------------------------------------------- */

/* all routes beginning with /auth */
var auth_routes = require('./routes/auth')(app);

/* all routes beginning with /api */
var api_routes = require('./routes/api')(app);

/* all routes beginning with /stats */
var stats_api_routes = require('./routes/stats-api')(app);

/* define and register routes */
var main_routes = require('./routes/index')(app);

app.get('/err', function(req, res) {
	res.send(500, {'err': "FAKE ERROR"})
});

/* TODO: look up how to send status code with file and finish*/
app.get('/500', function(req, res) {
	//res.send(500);
	res.sendfile('./static/html/500.html');
});

/* otherwise send 404 */
app.get('*', function(req, res) {
	res.send(404);
	//res.sendfile('./static/html/404.html');
});

/* ------------------------------------------------- ROUTING */



/* RUN THE SERVER --------------------------------------------
		-- IF: this file wasn't 'required'
			- possible running server from outside -- like from a test -- check 
*/
if (!module.parent) {
	
	/* connect to mongo */
	var Mongo = require('./models/mongo.js');
	var DB = Mongo.connectDB(config.data.url);


	server.listen(config.port, function () {
	    console.log("Express server listening on port " + config.port);
	});
};
/* -----------------------------------RUN THE SERVER ------- */

module.exports = server;