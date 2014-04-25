/* authentication routes 

	Using twitter OAuth for users login/logout
		- uses passport-middleware for creating/serializing/deserializing users

*/

/* pass user Model to passport */
var models = require('./../models/quiz-models.js'),
	User   = require('./../models/user-model.js');


var AuthRoutes = function(app) {

	/* must be called before passport or passportMiddleware can be used */
	var passportMiddleware = require('./../middleware/passport-middleware.js')(app, User);

	
	var _registerEndpoints = function (app) {
		app.get('/auth/user', _user); 
		app.get('/auth/login', _login);
		app.get('/auth/logout', _logout);
		app.get('/auth/twitter/callback', _twitterCallback);
	};

	/* '/auth/user': return basic user authentication for logged in user 
					 return null if no user logged in
	*/
	var _user = function(req, res) {
		res.send(req.user || null);
	}
	/* '/auth/login': make request to twitter */
	var _login = passportMiddleware.authenticate('twitter');
	/* '/auth/twitter/callback': twitter returns data via this endpoint */
	var _twitterCallback = passportMiddleware.authenticate('twitter', {
							successReturnToOrRedirect: '/', 
							failureRedirect: '/' 
						});
	var _logout = function(req, res) {
		req.logout();
		res.redirect('/');
	}

	
	_registerEndpoints(app);

	return {
		registerEndpoints: _registerEndpoints,
	}
};
module.exports = AuthRoutes;
				