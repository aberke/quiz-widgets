var express 		= require('express'),
	connect			= require('connect'),
	path 			= require('path'),
	http 			= require('http'),
    expressValidator= require('express-validator'),
	main_routes 	= require('./routes/index'), // this is just like doing: var routes = require('./routes/index.js')
	widget 			= require('./routes/widget'),

	models 			= require('./models.js');

    ///authMiddleware  = require('./middleware/authentication-middleware.js'),
	//passportMiddleware = require('./middleware/passport-middleware.js')(models);



var app = express();

app.configure(function () {
    app.set('port', process.env.WWW_PORT || 8080); // dotcloud doesn't have automatically set env variable for port, but know its on 8080
    app.use(express.logger('dev'));  /* 'default', 'short', 'tiny', 'dev' */
    app.use(connect.urlencoded()),
	app.use(connect.json()),
  	app.use(express.cookieParser()), /* must come before session because sessions use cookies */
	app.use(express.session({secret: process.env.SESSION_SECRET})),
	//app.use(passportMiddleware.initialize()),
	//app.use(passportMiddleware.session()),
    app.use(express.static(path.join(__dirname, '/static')));
    app.use(expressValidator());
});
var server = http.createServer(app);



app.get('/', main_routes.serveBase);
app.get('/new', main_routes.serveBase);
app.get('/s', function(req, res) {
	res.sendfile('static/lib/swipe/index.html')
});



app.get('/test', main_routes.test);





server.listen(app.get('port'), function () {
    console.log("Express server listening on port " + app.get('port'));
});
