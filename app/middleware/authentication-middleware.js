/* custom authentication middleware */

var express = require('express'),
	util 	= require('./../util.js'),
	models  = require('./../models.js');




exports.basicAuth = express.basicAuth(process.env.BASIC_AUTH_USER, process.env.BASIC_AUTH_PASSWORD);

var sendForbiddenResponse = function(res) {
	res.send(401);
	res.redirect('/forbidden');
}

/* list of user ids that never need verification  -- currently just Alex Berke's and HuffpostCode's */
var admin_whitelist = ['525eb49143fdec9000000002', '525f365742342c9300000001'];


/* Verifies that a valid user is logged in */
exports.verifyUser = function(req, res, next) {
	if (! req.user) { return sendForbiddenResponse(res); }
	next();
}

/* 
Verifies that user accessing protected endpoints does own quiz
	(or user is an admin)
		- pulls ":quizID" and verifies that user in session owns that quiz 
*/
exports.verifyQuizOwner = function(req, res, next) {
	models.findQuizPartial(req.params.quizID, function(err, quiz){
		if (err) { return res.send(500, util.handleError(err)); }

		/* peel userID out of the passport session info */
		if (! req.user) { return sendForbiddenResponse(res);}
		var userID = req.user._id.toString();

		if (! (quiz._user.toString() == userID || admin_whitelist.indexOf(userID) >= 0)) {
			return sendForbiddenResponse(res);
		}

		next();
	});
}
