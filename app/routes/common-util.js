/* utility functions forall */


var Util = function() {

	var _handleError = function(privateErr, publicErr) {
		/* privateErr is something I just print while publicErr is okay to return to user */
		if (!privateErr) { return null; }
		console.log('*****!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!******');
		console.log(privateErr, publicErr);
		console.log('*****!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!******');
		return (publicErr || 'ERROR');
	}

	/* ------ Route function helpers --------------------
		Called with response object to wrap in closure
		Returns function utilizing the response
	*/
	// var _sendSuccess = function(res) {
	// 	return function(data) {
	// 		return res.send(data);
	// 	}
	// }
	// var _sendError = function(res) {
	// 	return function(err) {
	// 		return res.send(500, _handleError(err));
	// 	}
	// }
	var _sendDataOrError = function(res) {
		return function(err, data) {
			if (err) { return res.send(500, _handleError(err)); }
			res.send(data);
		}
	}
	/* ------ Route function helpers -------------------- */

	return {
		handleError: 		_handleError,
		sendDataOrError: 	_sendDataOrError,
	}
}();
module.exports = Util;