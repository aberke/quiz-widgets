/* custom authentication middleware */

var express = require('express'),
	util 	= require('./../util.js'),
	models  = require('./../models.js');


/* list of user ids that never need verification  -- currently just AlexandraBerke's and HuffpostCode's */
var ADMIN_WHITELIST = ['525eb49143fdec9000000002', '525f365742342c9300000001'];



exports.basicAuth = express.basicAuth(process.env.BASIC_AUTH_USER, process.env.BASIC_AUTH_PASSWORD);

var sendForbiddenViewResponse = function(res) {
	res.send(401);
	res.redirect('/forbidden');
}
var sendForbiddenEndpointResponse = function(res) {
	res.send(401);
}


var verifyQuizOwner = function(req, successCallback, deniedCallback) {
	
	/* peel userID out of the passport session info */
	if (! req.user) { return deniedCallback();}
	var userID = req.user._id.toString();

	models.findQuizPartial(req.params.quizID, function(err, quiz){
		if (err) { 
			util.handleError(err);
			return deniedCallback();
		}
		if (! (quiz._user.toString() == userID || ADMIN_WHITELIST.indexOf(userID) >= 0)) {
			return deniedCallback();
		}
		successCallback();
	});
}

/* Verifies that a valid user is logged in */
exports.verifyUser = function(req, res, next) {
	if (! req.user) { return sendForbiddenViewResponse(res); }
	next();
}

/* 
Verifies that user accessing protected endpoints does own quiz
	(or user is an admin)
		- pulls ":quizID" and verifies that user in session owns that quiz 
*/
exports.verifyQuizViewAccess = function(req, res, next) {
	verifyQuizOwner(req, next, function() { sendForbiddenViewResponse(res); });
}
exports.verifyQuizEndpointAccess = function(req, res, next) {
	verifyQuizOwner(req, next, function() { sendForbiddenEndpointResponse(res); });
}




