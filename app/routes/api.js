
var util 		= require('./../util.js'),
	models 		= require('./../models.js');





exports.registerEndpoints = function (app) {
	app.get('/api/user/all', GETallUsers);
	app.get('/api/question/all', GETallQuestions);

	app.post('/api/quiz', POSTquiz);
	app.get('/api/quiz/all', GETallQuizes);
	app.get('/api/quiz/:id', GETquiz);
	app.delete('/api/quiz/:id', DELETEquiz);


	app.get('/api/outcome/all', GETallOutcomes);
	app.get('/api/outcome/:id', GEToutcome);
	app.put('/api/outcome/:id/increment-count', PUToutcomeIncrementCount);

	app.put('/api/answer/:id/increment-count', PUTanswerIncrementCount);

	/* JSONP hacks -- these are GET requests because they're with JSONP */
	app.get('/api/outcome/:id/increment-count', PUToutcomeIncrementCount);
	app.get('/api/answer/:id/increment-count', PUTanswerIncrementCount);
}

/* --------------- API --------------------- */

var POSTquiz = function(req, res) {
	console.log('POSTquiz', req.body)

	models.newQuiz(req.body, function(err, quiz) {
		res.send(quiz);
	});
}


var PUToutcomeIncrementCount = function(req, res) {
	models.findOutcome(req.params.id, function(err, outcome) {
		if (err) return res.send(500, util.handleError(err));

		outcome.count = outcome.count + 1;
		outcome.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.jsonp(200);
		});
	});
}
var PUTanswerIncrementCount = function(req, res) {
	models.findAnswer(req.params.id, function(err, answer) {
		if (err) return res.send(500, util.handleError(err));

		answer.count = answer.count + 1;
		answer.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.jsonp(200);
		});
	});
}


var GETallQuestions = function(req, res){
	models.allQuestions(function (err, questions){
		if (err) return res.send(util.handleError(err));
		res.send(questions);
	});
};
var GETallQuizes = function(req, res){
	models.allQuizes(function (err, quizes){
		if (err) return res.send(util.handleError(err));
		res.send(quizes);
	});
};
var GETallUsers = function(req, res){
	models.allUsers(function (err, users){
		if (err) return res.send(util.handleError(err));
		res.send(users);
	});
};
var GETallOutcomes = function(req, res) {
	models.allOutcomes(function (err, outcomes) {
		if (err) return res.send(util.handleError(err));
	})
}


var GETquiz = function(req, res) {
	models.findQuiz(req.params.id, function(err, quiz) {
		if (err) return res.send(500, util.handleError(err));		
		res.jsonp(200, quiz);
	});
}
var GEToutcome = function(req, res) {
	models.findOutcome(req.params.id, function(err, outcome) {
		if (err) return res.send(500, util.handleError(err));
		res.send(200, outcome);
	});
}

/* --------------- DELETE ---------------------- */


var DELETEquiz = function(req, res) {
	models.findQuiz(req.params.id, function(err, quiz) {
		if (err) return res.send(500, util.handleError(err));	
		
		quiz.remove(function (err) {
			if (err) { return res.json(500, {error: handleError(err)}); }
			res.json(200);
		});
	});
}

