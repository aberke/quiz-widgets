var express 		= require('express'),
	connect			= require('connect'),
	path 			= require('path'),
	http 			= require('http'),
	MongoStore 		= require('connect-mongo')(connect), // for persistent sessions

	config 			= require('./config.js');

	


var app = express();
/* configure app */
app.use(connect.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
app.use(connect.urlencoded()),
app.use(connect.json()),
app.use(connect.cookieParser()), /* must come before session because sessions use cookies */
//app.use(cookies()),

app.use(connect.session({
	secret: config.session_secret,
    store: new MongoStore({ // for persistent sessions
    	db: config.data.db,
    	url: config.data.url
    })
})),
    

app.use(express.static(path.join(__dirname, '/static')));

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


/* otherwise send 404 */
app.get('*', function(req, res) {
	res.status(404)
		.sendfile('./static/html/404.html');
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