
var util 		= require('./../util.js'),
	models 		= require('./../models.js');





exports.registerEndpoints = function (app) {
	app.get('/api/user/all', GETallUsers);


	app.get('/api/answer/all', GETallAnswers);
	app.get('/api/question/all', GETallQuestions);
	app.get('/api/question/:id', GETQuestion);

	app.post('/api/quiz', POSTquiz);
	app.get('/api/quiz/all', GETallQuizes);
	app.get('/api/quiz/:id', GETquiz);
	app.delete('/api/quiz/:id', DELETEquiz);
	app.put('/api/quiz/:id/share', PUTquizShare);
	app.put('/api/quiz/:id/increment-started-count', PUTquizIncrementStartedCount);
	app.put('/api/quiz/:id/increment-completed-count', PUTquizIncrementCompletedCount);

	app.get('/api/outcome/all', GETallOutcomes);
	app.get('/api/outcome/:id', GEToutcome);
	app.put('/api/outcome/:id/increment-count', PUToutcomeIncrementCount);
	app.put('/api/outcome/:id/share', PUToutcomeShare);

	app.put('/api/answer/:id/increment-count', PUTanswerIncrementCount);

	/* JSONP hacks -- these are GET requests because they're with JSONP */
	app.get('/api/quiz/:id/increment-started-count', PUTquizIncrementStartedCount);
	app.get('/api/quiz/:id/increment-completed-count', PUTquizIncrementCompletedCount);
	app.get('/api/outcome/:id/increment-count', PUToutcomeIncrementCount);
	app.get('/api/answer/:id/increment-count', PUTanswerIncrementCount);
	app.get('/api/share/:id/increment-fb-count', PUTshareIncrementFBCount);
	app.get('/api/share/:id/increment-twitter-count', PUTshareIncrementTwitterCount);
}

/* --------------- API --------------------- */

var POSTquiz = function(req, res) {
	models.newQuiz(req.body, function(err, quiz) {
		res.send(quiz);
	});
}

var PUTquizShare  = function(req, res) {
	var shareData = req.body;

	models.findQuiz(req.params.id, function(err, quiz) {
		if (err || !quiz) { return res.send(500); }

		if(quiz.share == null) {
			models.newShare(quiz, null, shareData, function(err, share) {
				quiz.share = share;
				quiz.save(function(err) {
					if (err){ return res.send(500, util.handleError(err)); }
					res.send(share);
				});
			});
		} 
		else {
			quiz.share.caption 	  = shareData.caption;
			quiz.share.pic_url 	  = shareData.pic_url;
			quiz.share.link 	  = shareData.link;
			quiz.share.description= shareData.description;
			quiz.share.save(function(err) {
				if (err){ return res.send(500, util.handleError(err)); }
				res.send(quiz.share);
			});
		}
	});
}
var PUToutcomeShare = function(req, res) {
	var shareData = req.body;

	models.findOutcome(req.params.id, function(err, outcome) {
		if (err || !outcome) { return res.send(500); }

		if(outcome.share == null) {
			models.newShare(null, outcome, shareData, function(err, share) {
				outcome.share = share;
				outcome.save(function(err) {
					if (err){ return res.send(500, util.handleError(err)); }
					res.send(share);
				});
			});
		} 
		else {
			outcome.share.caption 	  = shareData.caption;
			outcome.share.pic_url 	  = shareData.pic_url;
			outcome.share.description = shareData.description;
			outcome.share.save(function(err) {
				if (err){ return res.send(500, util.handleError(err)); }
				res.send(share);
			});
		}
	});
}
var PUTquizIncrementCompletedCount = function(req, res) {
	models.findQuizPartial(req.params.id, function(err, quiz) {
		if (err || !quiz) { return res.send(500); }

		quiz.completedCount = quiz.completedCount + 1;
		quiz.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.jsonp(200);
		});
	});
}
var PUTquizIncrementStartedCount = function(req, res) {
	models.findQuizPartial(req.params.id, function(err, quiz) {
		if (err || !quiz) { return res.send(500); }

		quiz.startedCount = quiz.startedCount + 1;
		quiz.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.jsonp(200);
		});
	});
}
var PUTshareIncrementTwitterCount = function(req, res) {
	models.findShare(req.params.id, function(err, share) {
		if (err || !share) { return res.send(500); }

		share.twitterCount = share.twitterCount + 1;
		share.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.jsonp(200);
		});
	});
}
var PUTshareIncrementFBCount = function(req, res) {
	models.findShare(req.params.id, function(err, share) {
		if (err || !share) { return res.send(500); }

		share.fbCount = share.fbCount + 1;
		share.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.jsonp(200);
		});
	});
}
var PUToutcomeIncrementCount = function(req, res) {
	models.findOutcome(req.params.id, function(err, outcome) {
		if (err || !outcome) { return res.send(500); }

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


var GETallAnswers = function(req, res){
	models.allAnswers(function (err, answers){
		if (err) return res.send(util.handleError(err));
		res.send(answers);
	});
};
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
	});
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
var GETQuestion = function(req, res) {
	models.findQuestion(req.params.id, function(err, question) {
		if (err) return res.send(500, util.handleError(err));
		res.send(200, question);
	});
}

/* --------------- DELETE ---------------------- */


var DELETEquiz = function(req, res) {
	models.deleteQuiz(req.params.id, function(err) {
		if (err) { return res.json(500, {error: util.handleError(err)}); }
		res.json(200);
	});
}

