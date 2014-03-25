
var util 		= require('./../util.js'),
	models 		= require('./../models.js');





exports.registerEndpoints = function (app) {
	app.get('/api/user/all', GETallUsers);


	app.post('/api/quiz', POSTquiz);
	
	app.get('/api/quiz/all', GETallQuizes);
	app.get('/api/quiz/:id', GETquiz);
	app.put('/api/quiz/:id', PUTquiz);
	app.delete('/api/quiz/:id', DELETEquiz);
	app.put('/api/quiz/:id/share', PUTquizShare);
	app.put('/api/quiz/:id/increment-started-count', PUTquizIncrementStartedCount);
	app.put('/api/quiz/:id/increment-completed-count', PUTquizIncrementCompletedCount);

	app.post('/api/answer', POSTanswer);
	app.get('/api/answer/all', GETallAnswers);
	app.put('/api/answer/:id', PUTanswer);
	app.delete('/api/answer/:id', DELETEanswer);

	app.post('/api/question', POSTquestion);
	app.get('/api/question/all', GETallQuestions);
	app.get('/api/question/:id', GETquestion);
	app.put('/api/question/:id', PUTquestion);
	app.delete('/api/question/:id', DELETEquestion);

	app.post('/api/outcome', POSToutcome); /* it must have its _quiz id set */
	app.get('/api/outcome/all', GETallOutcomes);
	app.get('/api/outcome/:id', GEToutcome);
	app.put('/api/outcome/:id', PUToutcome);
	app.delete('/api/outcome/:id', DELETEoutcome);
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
var POSTanswer = function(req, res) {
	var answerData = req.body;

	/* make sure question exists -- get it before creating answer and then push to answerList */
	models.findQuestion(answerData._question, function(err, question) {
		if (err || !question) { return res.send(500, util.handleError(err)); }

		models.addAnswer(answerData, question, function(err, answer) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.send(200, answer);
		});
	});
}
var POSTquestion = function(req, res) {
	var questionData = req.body;
	models.findQuiz(questionData._quiz, function(err, quiz) {
		if (err || !quiz) { return res.send(500, util.handleError(err)); }

		models.newQuestion(questionData, function(err, new_question) {
			if (err) { return res.send(500, util.handleError(err)); }
			
			quiz.questionList.push(new_question);
			quiz.save(function(err) {
				if (err) { return res.send(500, util.handleError(err)); }
				res.send(200, new_question);
			});
		});
	});
}
var POSToutcome = function(req, res) {
	var outcomeData = req.body;
	/* make sure the quiz exists -- get it before creating the outcome and then push it to outcomeList */
	models.findQuiz(outcomeData._quiz, function(err, quiz) {
		if (err || !quiz) { return res.send(500, util.handleError(err)); }

		outcomeData.index = quiz.outcomeList.length + 1;
		models.newOutcome(outcomeData, function(err, newOutcome) {
			if (err) { return res.send(500, util.handleError(err)); }

			quiz.outcomeList.push(newOutcome);
			quiz.save(function(err) {
				if (err) { return res.send(500, util.handleError(err)); }
				res.send(200, newOutcome);
			});
		});
	});
};
var PUToutcome = function(req, res) {
	var outcomeData = req.body;

	models.findOutcome(req.params.id, function(err, outcome) {
		if (err || !outcome) { return res.send(500, util.handleError(err)); }

		outcome.index = outcomeData.index;
		outcome.text = outcomeData.text;
		outcome.description = outcomeData.description;
		outcome.pic_url = outcomeData.pic_url;
		outcome.pic_credit = outcomeData.pic_credit;
		outcome.pic_style  = outcomeData.pic_style;
		outcome.save(function(err) {
			if (err) { res.send(500, util.handleError(err)); }
			res.send(outcome);
		});
	});
}
/* doesn't worry about handling answers it owns -- just its own fields */
var PUTquestion = function(req, res) {
	var questionData = req.body;

	models.findQuestion(req.params.id, function(err, question) {
		if (err || !question) { return res.send(500, util.handleError(err)); }

		question.text  = questionData.text;
		question.save(function(err) {
			if (err) { res.send(500, util.handleError(err)); }
			res.send(question);
		});
	});
};
var PUTanswer = function(req, res) {
	var answerData = req.body;

	models.findAnswer(req.params.id, function(err, answer) {
		if (err || !answer) { return res.send(500, util.handleError(err)); }

		answer.text 	  = answerData.text;
		answer.pic_url 	  = answerData.pic_url;
		answer.pic_credit = answerData.pic_credit;
		answer.pic_style  = answerData.pic_style;
		answer._outcome   = answerData._outcome;
		answer.save(function(err) {
			if (err) { res.send(500, util.handleError(err)); }
			res.send(answer);
		});
	});
}
/* doesn't worry about handling any models it owns -- just its own fields */
var PUTquiz = function(req, res) {
	var quizData = req.body;

	models.findQuizPartial(req.params.id, function(err, quiz) {
		if (err || !quiz) { return res.send(500, util.handleError(err)); }

		quiz.title = quizData.title;
		quiz.pic_url = quizData.pic_url;
		quiz.pic_credit = quizData.pic_credit;
		quiz.refresh_icon_url = quizData.refresh_icon_url;
		quiz.save(function(err) {
			if (err){ return res.send(500, util.handleError(err)); }
			res.send(quiz);
		});
	});
};
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
var GETquestion = function(req, res) {
	models.findQuestion(req.params.id, function(err, question) {
		if (err) return res.send(500, util.handleError(err));
		res.send(200, question);
	});
}

/* --------------- DELETE ---------------------- */

var deleteCallback = function(res, err) {
	if (err) { return res.json(500, {error: util.handleError(err)}); }
	res.json(200);
}

var DELETEoutcome = function(req, res) {
	models.deleteOutcome(req.params.id, function (err) { deleteCallback(res, err); });
}
var DELETEanswer = function(req, res) {
	models.deleteAnswer(req.params.id, function(err) {
		deleteCallback(res, err);
		// if (err) { return res.json(500, {error: util.handleError(err)}); }
		// res.json(200);
	});
};
var DELETEquestion = function(req, res) {
	models.deleteQuestion(req.params.id, function(err) { deleteCallback(res, err); });
};

var DELETEquiz = function(req, res) {
	models.deleteQuiz(req.params.id, function(err) {
		if (err) { return res.json(500, {error: util.handleError(err)}); }
		res.json(200);
	});
}

