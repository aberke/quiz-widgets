/* passport-twitter authentication middleware */

var passport = require('passport'),
	TwitterStrategy = require('passport-twitter').Strategy;


module.exports = function(models) {

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
			callbackURL:  (process.env.PRODUCTION_WWW_HTTP_URL || process.env.LOCASTHOST_WWW_HTTP_URL) + "auth/twitter/callback"
		},
		function(token, tokenSecret, profile, done) {
			models.findOrCreateUser(profile, function(err, user) { return done(err, user); });
		}
	);

	passport.use(strategy);

	return passport;
}