/* passport-twitter authentication middleware */

var passport 		= require('passport'),
    models 			= require('./../models'),
	TwitterStrategy = require('passport-twitter').Strategy;


module.exports = function() {
	
	passport.serializeUser(function(user, done) {
		done(null, user.twitter_id);
	});

	passport.deserializeUser(function(id, done) {
	  models.User.findOne({twitter_id: id}, function(err, user) {
	    done(err, user);
	  });
	});

	var strategy = new TwitterStrategy({
			consumerKey: process.env.TWITTER_CONSUMER_KEY,
			consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
			callbackURL: ((process.env.PRODUCTION_WWW_HTTP_URL || process.env.LOCAL_WWW_HTTP_URL) + "auth/twitter/callback"),
		},
		function(token, tokenSecret, profile, done) {
			models.User.findOne({twitter_id: profile.id}, function(err, user){
				if (err || user) { return done(err, user); }
				/* else make a new User */
				models.newUser(profile, done);
			});
		}
	);
	passport.use(strategy);

	return passport;
}






