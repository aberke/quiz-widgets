/* custom authentication middleware */

var express = require('express'),
	mongoose_models = require('./../models.js');


exports.basicAuth = express.basicAuth(process.env.ADMIN_BASIC_AUTH_USER, process.env.ADMIN_BASIC_AUTH_PASSWORD);

var sendForbiddenResponse = function(res) {
	/* just redirect to home */
	res.send(401);
	return res.redirect(process.env.PRODUCTION_WWW_HTTP_URL || process.env.LOCASTHOST_WWW_HTTP_URL);
}

/* list of user ids that never need verification  -- currently just Alex Berke's and HuffpostCode's */
var admin_whitelist = ['525eb49143fdec9000000002', '525f365742342c9300000001'];

/* 
Verifies that user accessing protected endpoints does own blogcast
	(or user is in admin_whitelist)
	intended to be used on endpoints /blogcast/:id/*
		- pulls ":id" as blogcastID and verifies that user in session owns that blogcast 
*/
exports.verifyUserOwnsBlogcast = function(req, res, next) {
	mongoose_models.blogcastByID(req.params.id, function(err, blogcast){
		if (err) return res.send(500);

		/* peel userID out of the passport session info */
		if (! req.user) return sendForbiddenResponse(res);
		var userID = req.user._id.toString();

		if (! (blogcast._user.toString() == userID || admin_whitelist.indexOf(userID) >= 0)) {
			return sendForbiddenResponse(res);
		}

		next();
	});
}
