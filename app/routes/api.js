
var util 		= require('./../util.js'),
	models 		= require('./../models.js');





exports.registerEndpoints = function (app) {
	app.get('/api/user/all', GETallUsers);
	app.get('/api/user/:id', GETuser);
	app.get('/api/user/:id/quizzes', GETuserQuizzes);
	app.put('/api/user/:userID/claim-quiz/:quizID', PUTuserClaimQuiz);
	app.put('/api/user/:userID/relinquish-quiz/:quizID', PUTuserRelinquishQuiz);


	app.post('/api/quiz', POSTquiz);
	
	app.get('/api/quiz/all', GETallQuizes);
	app.get('/api/quiz/:id', GETquiz);
	app.put('/api/quiz/:id', PUTquiz);
	app.delete('/api/quiz/:id', DELETEquiz);
	app.put('/api/quiz/:id/share', PUTquizShare);
	app.put('/api/quiz/:id/increment-started-count', PUTquizIncrementStartedCount);

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
	app.put('/api/outcome/:id/share', PUToutcomeShare);

	//app.put('/api/answer/:id/increment-count', PUTanswerIncrementCount);

	/* JSONP hacks -- these are GET requests because they're with JSONP */
	app.get('/api/quiz/:id/increment-started-count', PUTquizIncrementStartedCount);
	//app.get('/api/quiz/:id/increment-completed-count', PUTquizIncrementCompletedCount);
	//app.get('/api/answer/:id/increment-count', PUTanswerIncrementCount);
	app.get('/api/share/:id/increment-fb-count', PUTshareIncrementFBCount);
	app.get('/api/share/:id/increment-twitter-count', PUTshareIncrementTwitterCount);



	/* The problem:
			-- how to PUT completions for the most items at once in one request
					- more in 1 request == less load on server when a quiz goes viral
			-- max URL length is 2000 characters and must leave room for JSONP stuff
		
		The plan:
			-- make PUTs like /api/completed/quiz/:quizID/outcome/:outcomeID/answer/:answerID/answer/:answerID
							  /api/completed/answer/:answerID/answer/:answerID/...etc
	*/
	app.get('/api/completed/:completedData', PUTcompletedData);
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
/* mapped to by PUT '/api/user/:userID/relinquish-quiz/:quizID' */
var PUTuserRelinquishQuiz = function(req, res) {
	models.User.findOne({_id: req.params.userID}, function(err, user) {
		if (err || !user) { return res.send(500, util.handleError(err)); }
		// user with UNpopulated quizList
		var index = user.quizList.indexOf(req.params.quizID);
		if (index < 0) { return res.send(500, util.handleError('User ' + user._id + ' an not relinquish-quiz ' + req.params.quizID)); }
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





	// });
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
var quizIncrementCompletedCount = function(quizID) {
	models.findQuizPartial(quizID, function(err, quiz) {
		if (err || !quiz) { return res.send(500); }

		quiz.completedCount = quiz.completedCount + 1;
		quiz.save(function(err) { if (err) { util.handleError(err); } });
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
var outcomeIncrementCount = function(outcomeID) {
	models.findOutcome(outcomeID, function(err, outcome) {
		if (err || !outcome) { return res.send(500); }

		outcome.count = outcome.count + 1;
		outcome.save(function(err) { if (err) { util.handleError(err); } });
	});
}
/* helper to PUTcompletedData */
var answerIncrementCount = function(answerID) {
	models.findAnswer(answerID, function(err, answer) {
		if (err || !answer) { return util.handleError(err); }

		answer.count = answer.count + 1;
		answer.save(function(err) { if (err) { util.handleError(err); } });
	});
}
var PUTcompletedData = function(req, res) {
	var completedDataString = req.params.completedData;

	var completedDataArray = completedDataString.split('-');
	for (var i=0; i<completedDataArray.length; i+=2) {
		var type = completedDataArray[i];
		var id 	 = completedDataArray[i+1];

		if (type == 'quiz') {
			quizIncrementCompletedCount(id);
		} else if (type == 'outcome') {
			outcomeIncrementCount(id);
		} else if (type == 'answer') {
			answerIncrementCount(id);
		} else {
			console.log('ERROR: PUTcompletedData of unknown type:', type);
		}
	}
}

var deleteCallback = function(res, err) {
	if (err) { return res.json(500, {error: util.handleError(err)}); }
	res.json(200);
}

var DELETEoutcome = function(req, res) {
	models.deleteOutcome(req.params.id, function (err) { deleteCallback(res, err); });
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
	models.findUserQuizzes(req.user.id, GETcallback(res));
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
	models.findQuiz(req.params.id, function(err, quiz) {
		if (err) return res.send(500, util.handleError(err));		
		res.jsonp(200, quiz); /* NEED JSONP */
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

