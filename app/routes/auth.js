/* authentication routes */

var authMiddleware  = require('./../middleware/authentication-middleware.js'),
	passportMiddleware = require('./../middleware/passport-middleware.js')();




exports.registerEndpoints = function (app) {
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

var login = passportMiddleware.authenticate('twitter');
var twitterCallback = passportMiddleware.authenticate('twitter', {
						successReturnToOrRedirect: '/', 
						failureRedirect: '/' 
					});
var logout = function(req, res) {
	req.logout();
	res.redirect('/');
}				




