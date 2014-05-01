
var util 					= require('./common-util.js'),

    authMiddleware  		= require('./../middleware/authentication-middleware.js'),
    verifyQuizAPIAccess		= authMiddleware.verifyQuizAPIAccess,
			
	Quiz 					= require('./../models/quiz-model.js'),
    User 					= require('./../models/user-model.js'),
	Slide					= require('./../models/slide-model.js'),
    Share 					= require('./../models/share-model.js'),
    Outcome 				= require('./../models/outcome-model.js'),
    Question 				= require('./../models/question-answer-models.js').Question,
    Answer 					= require('./../models/question-answer-models.js').Answer;



var APIroutes = function(app) {

	var _registerEndpoints = function (app) {

		app.get('/api/user/all', GETallUsers);
		app.get('/api/user/:id', GETuser);
		app.get('/api/user/:id/quizzes', GETuserQuizzes);
		app.put('/api/user/:userID/claim-quiz/:quizID', PUTuserClaimQuiz);
		app.put('/api/user/:userID/relinquish-quiz/:quizID', verifyQuizAPIAccess, PUTuserRelinquishQuiz);

		
		app.get('/api/quiz/all', GETallQuizes);
		app.get('/api/slide/all', GETallSlides);
		app.get('/api/answer/all', GETallAnswers);
		app.get('/api/outcome/all', GETallOutcomes);
		app.get('/api/question/all', GETallQuestions);

		app.get('/api/quiz/:quizID', GETquiz);
		app.get('/api/quiz/:quizID/outcome/:id', GEToutcome);
		app.get('/api/quiz/:quizID/question/:id', GETquestion);

		app.post('/api/quiz', POSTquiz);
		app.post('/api/quiz/:quizID/slide', verifyQuizAPIAccess, POSTslide);
		app.post('/api/quiz/:quizID/outcome', verifyQuizAPIAccess, POSToutcome);
		app.post('/api/quiz/:quizID/question', verifyQuizAPIAccess, POSTquestion);
		app.post('/api/quiz/:quizID/question/:questionID/answer', verifyQuizAPIAccess, POSTanswer);
		
		app.put('/api/quiz/:quizID', verifyQuizAPIAccess, PUTquiz);
		app.put('/api/quiz/:quizID/share', verifyQuizAPIAccess, PUTquizShare);
		app.put('/api/quiz/:quizID/slide/:id', verifyQuizAPIAccess, PUTslide);
		app.put('/api/quiz/:quizID/outcome/:id/share', verifyQuizAPIAccess, PUToutcomeShare);
		app.put('/api/quiz/:quizID/outcome/:id', verifyQuizAPIAccess, PUToutcome);
		app.put('/api/quiz/:quizID/question/:id', verifyQuizAPIAccess, PUTquestion);
		app.put('/api/quiz/:quizID/question/:questionID/answer/:id', verifyQuizAPIAccess, PUTanswer);

		app.delete('/api/quiz/:quizID', verifyQuizAPIAccess, DELETEquiz);
		app.delete('/api/quiz/:quizID/slide/:id', verifyQuizAPIAccess, DELETEslide);
		app.delete('/api/quiz/:quizID/answer/:id', verifyQuizAPIAccess, DELETEanswer);
		app.delete('/api/quiz/:quizID/outcome/:id', verifyQuizAPIAccess, DELETEoutcome);
		app.delete('/api/quiz/:quizID/question/:id', verifyQuizAPIAccess, DELETEquestion);
		app.delete('/api/quiz/:quizID/question/:questionID/answer/:id', verifyQuizAPIAccess, DELETEanswer);



		/* JSONP hacks -- these are GET requests because they're with JSONP */
		/* these shares could belong to a quiz or an outcome -- API doesn't care */
		app.get('/api/share/:id/increment-fb-count', PUTshareIncrementFBCount);
		app.get('/api/share/:id/increment-twitter-count', PUTshareIncrementTwitterCount);
	}

	/* --------------- API --------------------- */

	var POSTquiz = function(req, res) {
		/* Quiz.create expects the _user to be in the quizData
			- why not insert it here from the request?
			because maybe the editor kept that browser window open forever on the /new page,
				editing away
				meanwhile the session was lost on the server
				but I can't throw away their hard work.
		*/
		Quiz.create(req.body, util.sendDataOrError(res));
	}
	var POSTanswer = function(req, res) {
		var answerData = req.body;
		Question.addAnswer(req.params.questionID, answerData, util.sendDataOrError(res));
	}
	var POSTquestion = function(req, res) {
		var questionData = req.body;
		Quiz.addQuestion(req.params.quizID, questionData, util.sendDataOrError(res));
	}
	var POSToutcome = function(req, res) {
		var outcomeData = req.body;
		Quiz.addOutcome(req.params.quizID, outcomeData, util.sendDataOrError(res));
	};
	var POSTslide = function(req, res) {
		var slideData = req.body;
		Quiz.addSlide(req.params.quizID, slideData, util.sendDataOrError(res));
	}
	var PUTslide = function(req, res) {
		var slideData = req.body;
		Slide.update(req.params.id, slideData, util.sendDataOrError(res));
	}
	var PUToutcome = function(req, res) {
		var outcomeData = req.body;
		Outcome.update(req.params.id, outcomeData, util.sendDataOrError(res));
	}
	/* also updates the answers */
	var PUTquestion = function(req, res) {
		var questionData = req.body;
		Question.update(req.params.id, questionData, util.sendDataOrError(res));
	};
	var PUTanswer = function(req, res) {
		var answerData = req.body;
		Answer.update(req.params.id, answerData, util.sendDataOrError(res));
	}
	/* mapped to by PUT '/api/user/:userID/relinquish-quiz/:quizID' */
	var PUTuserRelinquishQuiz = function(req, res) {
		User.removeQuiz(req.params.userID, req.params.quizID, function(err, user) {
			if (err){ return res.send(500, util.handleError(err)); }
			
			Quiz.setUser(req.params.quizID, null, util.sendDataOrError(res));
		});
	};

	/* mapped to by PUT '/api/user/:userID/claim-quiz/:quizID' */
	var PUTuserClaimQuiz = function(req, res) {
		/* a user can only claim an orphaned quiz 
			- get the quiz and make sure it's an orphan -- return 500 if not
			- get the user
				- assign the user to the quiz._user
				- add the quiz to the user.quizList
		*/
		Quiz.findPartial(req.params.quizID, function(err, quiz) {
			if (err || !quiz) { return res.send(500, util.handleError(err)); }
			if (quiz._user) { return res.send(500, util.handleError('User ' + req.params.userID + ' tried to claim Quiz ' + quiz._id + ', already owned by user ' + quiz._user)); }
		
			User.addQuiz(req.params.userID, req.params.quizID, function(err, user) {
				Quiz.setUser(req.params.quizID, req.params.userID, util.sendDataOrError(res));
			});
		});
	}

	/* doesn't worry about handling any models it owns -- just its own fields */
	var PUTquiz = function(req, res) {
		var quizData = req.body;
		Quiz.update(req.params.quizID, quizData, util.sendDataOrError(res));
	};
	var PUTquizShare  = function(req, res) {
		var shareData = req.body;
		Quiz.updateShare(req.params.quizID, shareData, util.sendDataOrError(res));
	}
	var PUToutcomeShare = function(req, res) {
		var shareData = req.body;
		Outcome.updateShare(req.params.id, shareData, util.sendDataOrError(res));
	}
	/* actually hit by a GET jsonp request */
	var PUTshareIncrementTwitterCount = function(req, res) {
		Share.incrementTwitter(req.params.id, util.sendDataOrError(res));
	}
	/* actually hit by a GET jsonp request */
	var PUTshareIncrementFBCount = function(req, res) {
		Share.incrementFB(req.params.id, util.sendDataOrError(res));
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
		Quiz.findByUser(req.params.id, GETcallback(res));
	};

	var GETallSlides = function(req, res) {
		Slide.all(GETcallback(res));
	}
	var GETallAnswers = function(req, res){
		Answer.all(GETcallback(res));
	};
	var GETallQuestions = function(req, res){
		Question.all(GETcallback(res));
	};
	var GETallQuizes = function(req, res){
		Quiz.all(GETcallback(res));
	};
	var GETallUsers = function(req, res){
		User.all(GETcallback(res));
	};
	var GETallOutcomes = function(req, res) {
		Outcome.all(GETcallback(res));
	}
	/* ---------- GET singletons ---------- */
	var GEToutcome = function(req, res) {
		Outcome.find(req.params.id, GETcallback(res));
	}
	var GETquestion = function(req, res) {
		Question.find(req.params.id, GETcallback(res));
	}
	var GETuser = function(req, res) {
		User.find(req.params.id, GETcallback(res));
	}

	var GETquiz = function(req, res) {
		/* not using helper callback because NEED JSONP */
		Quiz.find(req.params.quizID, function(err, quiz) {
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
		Quiz.removeOutcome(req.params.quizID, req.params.id, DELETEcallback(res));
	}
	var DELETEanswer = function(req, res) {
		Question.removeAnswer(req.params.questionID, req.params.id, DELETEcallback(res));
	};
	var DELETEquestion = function(req, res) {
		Quiz.removeQuestion(req.params.quizID, req.params.id, DELETEcallback(res));
	};
	var DELETEslide = function(req, res) {
		Quiz.removeSlide(req.params.quizID, req.params.id, DELETEcallback(res));
	}
	var DELETEquiz = function(req, res) {
		Quiz.remove(req.params.quizID, DELETEcallback(res));
	}


	_registerEndpoints(app);
}
module.exports = APIroutes;

