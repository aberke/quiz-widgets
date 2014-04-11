
var util 					= require('./../util.js'),
	models 					= require('./../models.js'),
    authMiddleware  		= require('./../middleware/authentication-middleware.js'),
    verifyQuizAPIAccess		= authMiddleware.verifyQuizAPIAccess;





exports.registerEndpoints = function (app) {
	app.get('/api/user/all', GETallUsers);
	app.get('/api/user/:id', GETuser);
	app.get('/api/user/:id/quizzes', GETuserQuizzes);
	app.put('/api/user/:userID/claim-quiz/:quizID', PUTuserClaimQuiz);
	app.put('/api/user/:userID/relinquish-quiz/:quizID', verifyQuizAPIAccess, PUTuserRelinquishQuiz);

	
	app.get('/api/quiz/all', GETallQuizes);
	app.get('/api/answer/all', GETallAnswers);
	app.get('/api/outcome/all', GETallOutcomes);
	app.get('/api/question/all', GETallQuestions);

	app.get('/api/quiz/:quizID', GETquiz);
	//app.get('/api/outcome/:id', GEToutcome);
	//app.get('/api/question/:id', GETquestion);

	app.post('/api/quiz', POSTquiz);
	app.post('/api/quiz/:quizID/answer', verifyQuizAPIAccess, POSTanswer);
	app.post('/api/quiz/:quizID/outcome', verifyQuizAPIAccess, POSToutcome); /* it must have its _quiz id set */
	app.post('/api/quiz/:quizID/question', verifyQuizAPIAccess, POSTquestion);
	
	app.put('/api/quiz/:quizID', verifyQuizAPIAccess, PUTquiz);
	app.put('/api/quiz/:quizID/share', verifyQuizAPIAccess, PUTquizShare);
	app.put('/api/quiz/:quizID/answer/:id', verifyQuizAPIAccess, PUTanswer);
	app.put('/api/quiz/:quizID/outcome/:id/share', verifyQuizAPIAccess, PUToutcomeShare);
	app.put('/api/quiz/:quizID/outcome/:id', verifyQuizAPIAccess, PUToutcome);
	app.put('/api/quiz/:quizID/question/:id', verifyQuizAPIAccess, PUTquestion);

	app.delete('/api/quiz/:quizID', verifyQuizAPIAccess, DELETEquiz);
	app.delete('/api/quiz/:quizID/answer/:id', verifyQuizAPIAccess, DELETEanswer);
	app.delete('/api/quiz/:quizID/outcome/:id', verifyQuizAPIAccess, DELETEoutcome);
	app.delete('/api/quiz/:quizID/question/:id', verifyQuizAPIAccess, DELETEquestion);



	/* JSONP hacks -- these are GET requests because they're with JSONP */
	/* these shares could belong to a quiz or an outcome -- API doesn't care */
	app.get('/api/share/:id/increment-fb-count', PUTshareIncrementFBCount);
	app.get('/api/share/:id/increment-twitter-count', PUTshareIncrementTwitterCount);
}

/* --------------- API --------------------- */




var POSTquiz = function(req, res) {
	/* newQuiz expects the _user to be in the quizData
		- why not insert it here from the request?
		because maybe the editor kept that browser window open forever on the /new page,
			editing away
			meanwhile the session was lost on the server
			but I can't throw away their hard work.
	*/
	models.newQuiz(req.body, function(err, quiz) {
		res.send(quiz);
	});
}
var POSTanswer = function(req, res) {
	var answerData = req.body;

	/* make sure question exists -- get it before creating answer and then push to answerList */
	models.findQuestion(answerData._question, function(err, question) {
		if (err || !question) { return res.send(500, util.handleError(err)); }

		// handles question.answerList.push and answer.save -- DOES NOT SAVE QUESTION
		models.addAnswer(answerData, question, function(err, answer) {
			if (err) { return res.send(500, util.handleError(err)); }
			question.save(function(err) {
				if (err) { return res.send(500, util.handleError(err)); }
				res.send(200, answer);
			});
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

		// need outcomeData.index ??
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
/* mapped to by PUT '/api/user/:userID/relinquish-quiz/:quizID' */
var PUTuserRelinquishQuiz = function(req, res) {
	models.User.findOne({_id: req.params.userID}, function(err, user) {
		if (err || !user) { return res.send(500, util.handleError(err)); }
		// user with UNpopulated quizList
		var index = user.quizList.indexOf(req.params.quizID);
		if (index < 0) { return res.send(500, util.handleError('User ' + user._id + ' can not relinquish-quiz ' + req.params.quizID)); }
		user.quizList.splice(index, 1);
		user.save(function(err) {
			if (err) { return res.send(500, util.handleError(err)); }

			models.findQuiz(req.params.quizID, function(err, quiz) {
				if (err || !quiz) { return res.send(500, util.handleError(err)); }
				quiz._user = null;
				quiz.save(function(err) {
					if (err) { return res.send(500, util.handleError(err)); }
					res.send(200, quiz);
				});
			});
		});
	});
}

/* mapped to by PUT '/api/user/:userID/claim-quiz/:quizID' */
var PUTuserClaimQuiz = function(req, res) {
	/* a user can only claim an orphaned quiz 
		- get the quiz and make sure it's an orphan -- return 500 if not
		- get the user
			- assign the user to the quiz._user
			- add the quiz to the user.quizList
	*/
	models.findQuizPartial(req.params.quizID, function(err, quiz) {
		if (err || !quiz) { return res.send(500, util.handleError(err)); }
		if (quiz._user) { return res.send(500, util.handleError('User ' + req.params.userID + ' tried to claim Quiz ' + quiz._id + ', already owned by user ' + quiz._user)); }
	
		models.findUser(req.params.userID, function(err, user) {
			if (err || !user) { return res.send(500, util.handleError(err)); }

			quiz._user = user;
			quiz.save(function(err) { if (err){ return res.send(500, util.handleError(err)); }});
		
			user.quizList.push(quiz);
			user.save(function(err) { 
				if (err){ return res.send(500, util.handleError(err)); }
				res.send(200, quiz);
			});
		});
	});

}

/* doesn't worry about handling any models it owns -- just its own fields */
var PUTquiz = function(req, res) {
	var quizData = req.body;

	models.findQuiz(req.params.quizID, function(err, quiz) {
		if (err || !quiz) { return res.send(500, util.handleError(err)); }

		quiz.title 				= quizData.title;
		quiz.pic_url 			= quizData.pic_url;
		quiz.pic_credit 		= quizData.pic_credit;
		quiz.custom_styles 		= quizData.custom_styles;
		quiz.refresh_icon_url 	= quizData.refresh_icon_url;
		quiz.save(function(err) {
			if (err){ return res.send(500, util.handleError(err)); }
			res.send(quiz);
		});
	});
};
var PUTquizShare  = function(req, res) {
	var shareData = req.body;

	models.findQuiz(req.params.quizID, function(err, quiz) {
		if (err || !quiz) { return res.send(500); }

		if (!quiz.share) {
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

		if (!outcome.share) {
			models.newShare(null, outcome, shareData, function(err, share) {
				outcome.share = share;
				outcome.save(function(err) {
					if (err){ return res.send(500, util.handleError(err)); }
					res.send(share);
				});
			});
		} else {
			outcome.share.caption 	  = shareData.caption;
			outcome.share.pic_url 	  = shareData.pic_url;
			outcome.share.description = shareData.description;
			outcome.share.save(function(err) {
				if (err){ return res.send(500, util.handleError(err)); }
				res.send(outcome.share);
			});
		}
	});
}
/* actually hit by a GET jsonp request */
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
/* actually hit by a GET jsonp request */
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


/* ------------------ GET ----------------------- */

/* generates the callback function for the non-JSONP GET's */
var GETcallback = function(response) {

	var callback = function(err, result) { // closure around response
		if (err) { return response.send(500, util.handleError(err)); }
		response.send(200, result);
	}
	return callback;
}

var GETuserQuizzes = function(req, res) {
	models.findUserQuizzes(req.params.id, GETcallback(res));
};

var GETallAnswers = function(req, res){
	models.allAnswers(GETcallback(res));
};
var GETallQuestions = function(req, res){
	models.allQuestions(GETcallback(res));
};
var GETallQuizes = function(req, res){
	models.allQuizes(GETcallback(res));
};
var GETallUsers = function(req, res){
	models.allUsers(GETcallback(res));
};
var GETallOutcomes = function(req, res) {
	models.allOutcomes(GETcallback(res));
}
/* ---------- GET singletons ---------- */
var GEToutcome = function(req, res) {
	models.findOutcome(req.params.id, GETcallback(res));
}
var GETquestion = function(req, res) {
	models.findQuestion(req.params.id, GETcallback(res));
}
var GETuser = function(req, res) {
	models.findUser(req.params.id, GETcallback(res));
}

var GETquiz = function(req, res) {
	/* not using helper callback because NEED JSONP */
	models.findQuiz(req.params.quizID, function(err, quiz) {
		if (err) return res.send(500, util.handleError(err));		
		res.jsonp(200, quiz); /* NEED JSONP */
	});
}

/* --------------- DELETE ---------------------- */

/* generates the callback */
var DELETEcallback = function(response) {

	var callback = function(err) { // closure around response
		if (err) { return response.send(500, util.handleError(err)); }
		response.send(200);
	}
	return callback;
}

var DELETEoutcome = function(req, res) {
	models.deleteOutcome(req.params.id, DELETEcallback(res));
}
var DELETEanswer = function(req, res) {
	models.deleteAnswer(req.params.id, DELETEcallback(res));
};
var DELETEquestion = function(req, res) {
	models.deleteQuestion(req.params.id, DELETEcallback(res));
};
var DELETEquiz = function(req, res) {
	models.deleteQuiz(req.params.quizID, DELETEcallback(res));
}

