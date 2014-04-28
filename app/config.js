
/* config.js

*/
var config = {

	// testing flag for things like authentication middleware
	"testing": (process.env.TESTING || false),

	// need session secret to use express.session
	"session_secret": (process.env.SESSION_SECRET || 'no-secrets'),

	// dotcloud doesn't have automatically set env variable for port, but know its on 8080
	"port":  (process.env.WWW_PORT || 8080),

	// used for items like TwitterStrategy callbackURL in passport-middleware
	"WWW_HTTP_URL": (process.env.PRODUCTION_WWW_HTTP_URL || process.env.WWW_HTTP_URL || "http://127.0.0.1:8080/"),


	"data": {

		// dotcloud gives us our master + slave database urls -- take the first -- MongoStore won't understand a list
		"url": (((process.env.DOTCLOUD_DB_MONGODB_URL || process.env.MONGODB_URL || "mongodb://localhost/quiz-widgets").split(',')[0])),
		
		// dotcloud having issue authenticating any db other than 'admin'... :-(
		"db" : (process.env.DOTCLOUD_DB_MONGODB_URL ? 'admin' : 'quiz-widgets'),
	},

	// basic authentication used in authentication-middleware
	"BASIC_AUTH_USER": (process.env.BASIC_AUTH_USER || "huffpost"),
	"BASIC_AUTH_PASSWORD": (process.env.BASIC_AUTH_PASSWORD || ""),

	// always secret - no valid defaults
	"TWITTER_CONSUMER_KEY": (process.env.TWITTER_CONSUMER_KEY || "SET--TWITTER_CONSUMER_KEY"),
	"TWITTER_CONSUMER_SECRET": (process.env.TWITTER_CONSUMER_SECRET || "SET--TWITTER_CONSUMER_SECRET"),


	/* list of user _ids (not twitter_id) that never need verification  -- currently just HuffpostLabs' 
		- why not twitter_id, which would allow same WHITELIST regardless or database?
			- because would mean longer lookup time -- slower middleware
			- quiz has reference to _user as user._id
	*/
	"ADMIN_WHITELIST": ['533c8d0497de9b93004619db'],


};
module.exports = config;