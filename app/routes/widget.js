
var models 		= require('./../models.js');




exports.serveQuiz = function(req, res) {
	models.findQuiz(req.params.id, function(err, quiz) {
		if (err) return res.send(500, handleError(err));


		
		res.jsonp(200, quiz);
	});
}