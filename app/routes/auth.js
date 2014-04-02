/* authentication routes */

var authMiddleware  = require('./../middleware/authentication-middleware.js'),
	passportMiddleware = require('./../middleware/passport-middleware.js')();




exports.registerEndpoints = function (app) {

	//app.use(passportMiddleware.initialize());
	//app.use(passportMiddleware.session());

	app.get('/auth/user', user);
	app.get('/auth/login', login);
	app.get('/auth/twitter/callback', twitterCallback);
	app.get('/auth/logout', logout);
};


var user = function(req, res){
	console.log('****\nget user', req.user);
	if (req.user) { res.send(req.user); }
	else { res.send(null); }
}
var login = function(req, res) {
	console.log('\n\n\n*****login*****\n\n','req.headers', req.headers)
	console.log('req.secret',req.secret)
	console.log('req.session',req.session)
	console.log('req.url',req.url)
	console.log('req._remoteAddress',req._remoteAddress)

	passportMiddleware.authenticate('twitter')(req,res);
}
//var login = passportMiddleware.authenticate('twitter');

var twitterCallback = function(req, res) {

	console.log('')
	console.log('\n\n\n*****login*****\n\n','req.headers', req.headers)
	console.log('req.secret',req.secret)
	console.log('req.session',req.session)
	console.log('req.url',req.url)
	res.redirect('/forbidden')
}

//var twitterCallback = passportMiddleware.authenticate('twitter', {
					// 	successReturnToOrRedirect: '/', 
					// 	failureRedirect: '/' 
					// });
var logout = function(req, res) {
	req.logout();
	res.redirect('/');
}				




