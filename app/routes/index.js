

var models 		= require('./../models.js');




/* --------------- ROUTING --------------------- */
exports.serveBase = function(req, res) {
	res.sendfile('static/html/base.html');
}




/* --------------- API --------------------- */

exports.POSTQuiz = function(req, res) {
	console.log('req.body', req.body)

	models.newQuiz(req.body, function(err, quiz) {
		res.send(quiz);
	});
}




exports.serveAllQuestions = function(req, res){
	models.allQuestions(function (err, questions){
		if (err) return res.send(handleError(err));
		res.send(questions);
	});
};
exports.serveAllQuizes = function(req, res){
	models.allQuizes(function (err, quizes){
		if (err) return res.send(handleError(err));
		res.send(quizes);
	});
};
exports.serveAllUsers = function(req, res){
	models.allUsers(function (err, users){
		if (err) return res.send(handleError(err));
		res.send(users);
	});
};



exports.test = function(req, res) {
	res.send('test')
}



/* privateErr is something I just print while publicErr is okay to return to user */
function handleError(privateErr, publicErr){
	console.log('*****!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!******');
	console.log(privateErr, publicErr);
	console.log('*****!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!******');
	return (publicErr || 'ERROR');
}