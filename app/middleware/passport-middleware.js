/* passport-twitter authentication middleware 

	Is this really middleware though?
*/

var passport 		= require('passport'),
	TwitterStrategy = require('passport-twitter').Strategy,

	config 			= require('./../config.js');


var Passport = function(app, User) {
	/* 
		Interacts with the user Model
			Schema: {
				twitter_id: 			userData.id,
				twitter_username: 		userData.username,
				twitter_displayname: 	userData.displayName,
			}
			- just uses the twitter_id and user.create()
	*/

	var _setup = function(app) {
	    
	    app.use(passport.initialize());
	    app.use(passport.session());
	
		passport.serializeUser(function(user, done) {
			done(null, user.twitter_id);
		});

		passport.deserializeUser(function(id, done) {
		  User.findByTwitterID(id, function(err, user) {
		    done(err, user);
		  });
		});

		var strategy = _strategy();
		passport.use(strategy);
	}
	var _strategy = function() {
		var s = new TwitterStrategy({
				consumerKey: config.TWITTER_CONSUMER_KEY,
				consumerSecret: (config.TWITTER_CONSUMER_SECRET),
				callbackURL: (config.WWW_HTTP_URL + "auth/twitter/callback"),
			},
			function(token, tokenSecret, profile, done) {
				User.findByTwitterID(profile.id, function(err, user){
					if (err || user) { return done(err, user); }
					/* else make a new User */
					User.create(profile, done);
				});
			});
		return s;
	}
	_setup(app);

	return passport;
}
module.exports = Passport;




