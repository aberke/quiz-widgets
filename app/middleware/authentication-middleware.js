/* custom authentication middleware */

var util 	= require('./../routes/common-util.js'),
	Quiz    = require('./../models/quiz-model.js'),

	config 	= require('./../config.js');




var AuthenticationMiddleware = function() {

	/* list of user _ids (not twitter_id) that never need verification  -- currently just HuffpostLabs' 
		- why not twitter_id, which would allow same WHITELIST regardless or database?
			- because would mean longer lookup time -- slower middleware
			- quiz has reference to _user as user._id
	*/
	var _admin_whitelist = config.ADMIN_WHITELIST;

	var basicAuth = function(req, res, next) {
	    if (req.headers.authorization && req.headers.authorization.search('Basic ') === 0) {
	        // fetch login and password
	        if (new Buffer(req.headers.authorization.split(' ')[1], 'base64').toString() == config.BASIC_AUTH_USER + ':' + config.BASIC_AUTH_PASSWORD) {
	            next();
	            return;
	        }
	    }
	    console.log('Unable to authenticate user', req.headers.authorization);
	    res.header('WWW-Authenticate', 'Basic realm="Admin Area"');
	    _sendForbiddenResponse(res);
	}

	var _sendForbiddenResponse = function(res, err) {
		res.send(401, (err || ''));
	}
	var _sendForbiddenViewResponse = function(res, err) {
		_sendForbiddenResponse(res, err);
		res.redirect('/forbidden');
	}

	var _verifyQuizOwner = function(req, successCallback, deniedCallback) {
		/* I assume that any endpoint that is routed through this middleware
			container /quiz/:quizID */
		var quizID = req.params.quizID;
		if (!quizID) { return deniedCallback('endpoint without a :quizID was routed to verifyQuizOwner'); }
		
		if (config.testing == true || config.testing == 'true') { return successCallback(); }
		
		/* peel userID out of the passport session info */
		if (! req.user) { return deniedCallback('User not logged in');}
		var userID = req.user._id.toString();

		Quiz.findPartial(quizID, function(err, quiz){
			if (err || !quiz) { 
				return deniedCallback(util.handleError(err, 'Error retrieving quiz when verifying quiz owner'));
			}
			if (! (quiz._user.toString() == userID || _admin_whitelist.indexOf(userID) >= 0)) {
				return deniedCallback('Logged in user does not own quiz');
			}
			successCallback();
		});
	}

	/* Verifies that a valid user is logged in */
	var verifyUser = function(req, res, next) {
		if (config.testing == true || config.testing == 'true') { return next(); }
		
		if (! req.user) { return _sendForbiddenViewResponse(res, 'User not logged in'); }
		next();
	}

	/* 
	Verifies that user accessing protected endpoints does own quiz
		(or user is an admin)
			- pulls ":quizID" and verifies that user in session owns that quiz 
	*/
	var verifyQuizViewAccess = function(req, res, next) {
		_verifyQuizOwner(req, next, function(err) { _sendForbiddenViewResponse(res, err); });
	}
	var verifyQuizAPIAccess = function(req, res, next) {
		_verifyQuizOwner(req, next, function(err) { _sendForbiddenResponse(res, err); });
	}

	return {
		basicAuth: 				basicAuth,
		verifyUser: 			verifyUser,
		verifyQuizAPIAccess: 	verifyQuizAPIAccess,
		verifyQuizViewAccess: 	verifyQuizViewAccess,
	}
}();
module.exports = AuthenticationMiddleware;

