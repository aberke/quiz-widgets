/* custom authentication middleware */

var express = require('express'),
	util 	= require('./../util.js'),
	models  = require('./../models.js');


/* list of user ids that never need verification  -- currently just HuffpostLabs' */
var ADMIN_WHITELIST = ['533c8d0497de9b93004619db'];



exports.basicAuth = express.basicAuth(process.env.BASIC_AUTH_USER, process.env.BASIC_AUTH_PASSWORD);


var sendForbiddenResponse = function(res, err) {
	res.send(401, (err || ''));
}
var sendForbiddenViewResponse = function(res, err) {
	sendForbiddenResponse(res, err);
	res.redirect('/forbidden');
}


var verifyQuizOwner = function(req, successCallback, deniedCallback) {
	/* I assume that any endpoint that is routed through this middleware
		container /quiz/:quizID */
	var quizID = req.params.quizID;
	if (!quizID) { return deniedCallback('endpoint without a :quizID was routed to verifyQuizOwner'); }
	
	/* peel userID out of the passport session info */
	if (! req.user) { return deniedCallback('User not logged in');}
	var userID = req.user._id.toString();

	models.findQuizPartial(quizID, function(err, quiz){
		if (err || !quiz) { 
			return deniedCallback(util.handleError(err, 'Error retrieving quiz when verifying quiz owner'));
		}
		if (! (quiz._user.toString() == userID || ADMIN_WHITELIST.indexOf(userID) >= 0)) {
			return deniedCallback('Logged in user does not own quiz');
		}
		successCallback();
	});
}

/* Verifies that a valid user is logged in */
exports.verifyUser = function(req, res, next) {
	if (! req.user) { return sendForbiddenViewResponse(res, 'User not logged in'); }
	next();
}

/* 
Verifies that user accessing protected endpoints does own quiz
	(or user is an admin)
		- pulls ":quizID" and verifies that user in session owns that quiz 
*/
exports.verifyQuizViewAccess = function(req, res, next) {
	verifyQuizOwner(req, next, function(err) { sendForbiddenViewResponse(res, err); });
}
exports.verifyQuizAPIAccess = function(req, res, next) {
	verifyQuizOwner(req, next, function(err) { sendForbiddenResponse(res, err); });
}




