/* API tests */

var assert 			= require("assert"),
	http 			= require("http"),


	User 			= require('./../../models/user-model.js'),
	Share 			= require('./../../models/share-model.js'),
	Outcome 		= require('./../../models/outcome-model.js'),
	Question 		= require('./../../models/question-answer-models.js').Question
	Answer  		= require('./../../models/question-answer-models.js').Answer,
	
	quiz_models 	= require('./../../models/quiz-models.js'),
	Quiz 			= quiz_models.Quiz,
	//Outcome 		= quiz_models.Outcome,
	Slide 			= quiz_models.Slide,

	server  		= require('./../../server.js'),
	port 			= 3337,
	session_cookie 	= null; // set it later




/* HELPER ---------------------------------------- */

var request = function(method, path, data, callback) {
	data = (data ? JSON.stringify(data) : '');
	var options = defaultOptions(path, method, data);
	
	var req = http.request(options, function(res) {
		var status = Number(res.statusCode);
		res.setEncoding('utf8');

		var response_data = '';
		res.on('data', function(d) { response_data += d; });
		res.on('end', function (chunk) {
			response_data += (chunk || '');
			if (status != 200) { return callback(new Error("request returned with " + status), response_data); }
			if (typeof response_data == "string" && response_data != "OK") { response_data = JSON.parse(response_data); }
			if (callback) callback(null, response_data);
		});
	});	
	req.on('error', function(e) { return callback(new Error(e), null); });

	if (data) {
		req.write(data);
	}
	req.end();	
}
function defaultOptions(path, method, data) {
	var options = {
		"host": "localhost",
		"port": port,
		"path": path,
		"method": method,
		"headers": { 'Content-Type': 'application/json', },
	};
	if (data) { options["headers"]["Content-Length"] = data.length; }
	return options;
}

var POST = function(path, data, callback) {
	request('POST', path, data, callback);
}
var PUT = function(path, data, callback) {
	request('PUT', path, data, callback);
}
function GET(path, callback) {
	request('GET', path, {}, callback);
}
function DELETE(path, callback) {
	request('DELETE', path, {}, callback);
}
/* ---------------------------------------- HELPER */

describe('API', function() {
	var user = null;
	var userID = null;
	var quizData = {
		_user: 		  		null, // set once user POST calls back
		title: 		  		'TEST-QUIZ-TITLE',
		outcomeList:  		[{ _id:'0', description:'OUTCOME-0' },{ _id:'1', description:'OUTCOME-1' }],
		questionList: 		[{answerList: [{ _outcome:'0' },{ _outcome:'1' }]}],
	};
	var quiz = null;
	var quizID = null;


	/* SETUP/TEARDOWN ---------------------------------------- */

	// start server before -- close server after
	beforeEach(function (done) { server.listen(port, done); });
	afterEach(function() { server.close(); });

	// clear out our models
	beforeEach(function(done) { User.model.remove({}, done); });
	beforeEach(function(done) { Quiz.model.remove({}, done); });
	beforeEach(function(done) { Slide.model.remove({}, done); });
	beforeEach(function(done) { Share.model.remove({}, done); });
	beforeEach(function(done) { Outcome.model.remove({}, done); });
	beforeEach(function(done) { Question.model.remove({}, done); });
	beforeEach(function(done) { Answer.model.remove({}, done); });

	// add 1 user and 1 quiz such that user owns quiz
	beforeEach(function(done) {
		//can only create users through model or middleware (not API)
		var userTwitterProfile = {
			id: 			'TEST-TWITTER-ID',
			username: 		'TEST-USERNAME',
			displayName: 	'TEST-DISPLAYNAME',
		};
		User.create(userTwitterProfile, function(err, doc) {
			if (err) { return done(err); }
			user = doc;
			userID = doc._id.toString();
			done(err);
		});
	});
	beforeEach(function(done) {
		quizData._user = userID;
		POST('/api/quiz', quizData, function(err, doc) {
			if (err) { return done(err); }
			quiz = doc;
			quizID = doc._id;
			done();
		});
	});
	/* ---------------------------------------- SETUP/TEARDOWN */
 
	it('should be listening at localhost:' + port, function(done) {
		var headers = defaultOptions('/api/qwe', 'GET');
		http.get(headers, function (res) {
			assert.equal(res.statusCode, 404);
			done();
		});
	});


	/* /api/user/* tests ---------------------------------------- */
	describe('/api/user/*', function() {
		it('GET /api/user/all', function(done) {
			GET('/api/user/all', function(err, data) {
				assert.equal(data.length, 1);
				assert.equal(data[0]._id, userID);
				done(err);
			});
		});
		it('GET /api/user/:id', function(done) {
			GET('/api/user/' + userID, function(err, data) {
				assert.equal(data.twiter_id, user.twiter_id);
				done(err);
			});
		});
		it('GET /api/user/:id/quizzes', function(done) {
			GET('/api/user/' + userID + '/quizzes', function(err, data) {
				assert.equal(data.length, 1);
				done(err);
			});
		});
		it('PUT /api/user/:userID/relinquish-quiz/:quizID and /api/user/:userID/claim-quiz/:quizID', function(done) {
			PUT('/api/user/' + userID + '/relinquish-quiz/' + quizID, {}, function(err, data) {
				assert.equal(err, null);
				// user should not own any quizzes and our quiz should not reference that user
				GET('/api/user/' + userID + '/quizzes', function(err, data) {
					assert.equal(data.length, 0);
				});
				GET('/api/quiz/' + quizID, function(err, data) {
					assert.equal(data._user, null);
				});
				PUT('/api/user/' + userID + '/claim-quiz/' + quizID, {}, function(err, data) {
					assert.equal(err, null);
					// user should own quiz and quiz should reference our user
					GET('/api/user/' + userID + '/quizzes', function(err, data) {
						assert.equal(data.length, 1);
						assert.equal(data[0]._id, quizID);
					});
					GET('/api/quiz/' + quizID, function(err, data) {
						assert.equal(data._user._id, userID);
						done(err);
					});	
				});
			});
		});
	});
	/* ---------------------------------------- /api/user/* tests */

	/* /api/quiz/:quizID/slide/* tests -------------------------- */
	describe('/api/quiz/:quizID/slide/*', function() {
		// '/api/quiz/:quizID/slide' implicitely tested by beforeEach
		var slideID;
		beforeEach(function(done) {
			var slideData = {
				blob: "TEST-SLIDE-CONTENT"
			}
			POST('/api/quiz/' + quizID + '/slide', slideData, function(err, data) {
				slideID = data._id;
				done(err);
			});
		});
		it ('GET /api/slide/all', function(done) {
			GET('/api/slide/all', function(err, data) {
				assert.equal(data.length, 1);
				assert.equal(data[0]._id, slideID);
				done(err);
			});
		});
		it ('DELETE /api/quiz/:quizID/slide/:id', function(done) {
			DELETE('/api/quiz/' + quizID + '/slide/' + slideID, function(err) {
				GET('/api/quiz/' + quizID, function(err, data) {
					assert.equal(data.extraSlide, null);
				});	
				GET('/api/slide/all', function(err, data) {
					assert.equal(data.length, 0);
					done(err);
				});

			});
		});
		it ('PUT /api/quiz/:quizID/slide', function(done) {
			var putData = { blob: "NEW-SLIDE-CONTENT" };
			PUT('/api/quiz/' + quizID + '/slide/' + slideID, putData, function(err, data) {
				assert.equal(data.blob, putData.blob);
				GET('/api/slide/all', function(err, data) {
					assert.equal(data.length, 1);
					assert.equal(data[0].blob, putData.blob);
					assert.equal(data[0]._quiz, quizID);
					done(err);
				});
			});
		});
	});
	/* -------------------------- /api/quiz/:quizID/slide/* tests */

	/* /api/quiz/--------/share tests ---------------------------- */
	describe('share tests', function() {
		it ('PUT /api/quiz/:quizID/share', function(done) {
			var putData = {
				link: "http://huffingtonpost.com",
				description: "TEST-DESCRIPTION",
				pic_url: "http://huffingtonpost.com/favicon.ico",
				caption: "TEST-CAPTION",
			};
			GET('/api/quiz/' + quizID, function(err, data) {
				assert.equal(data.share._quiz, 		quizID);
				assert.equal(data.share.link, 		null);
				assert.equal(data.share.pic_url, 	null);
				assert.equal(data.share.caption, 	null);
				assert.equal(data.share.description,null);
				PUT('/api/quiz/' + quizID + '/share', putData, function(err, data) {
					GET('/api/quiz/' + quizID, function(err, data) {
						assert.equal(data.share.link, 		putData.link);
						assert.equal(data.share.pic_url, 	putData.pic_url);
						assert.equal(data.share.caption, 	putData.caption);
						assert.equal(data.share.description,putData.description);
						done(err);
					});
				});
			});	
		});
		it ('PUT /api/quiz/:quizID/outcome/:id/share', function(done) {
			var putData = {
				link: "http://huffingtonpost.com",
				description: "TEST-DESCRIPTION",
				pic_url: "http://huffingtonpost.com/favicon.ico",
				caption: "TEST-CAPTION",
			};
			GET('/api/quiz/' + quizID, function(err, data) {
				assert.equal(data.outcomeList[0].share._outcome, 	data.outcomeList[0]._id);
				assert.equal(data.outcomeList[0].share.link, 		null);
				assert.equal(data.outcomeList[0].share.pic_url, 	null);
				assert.equal(data.outcomeList[0].share.caption, 	null);
				assert.equal(data.outcomeList[0].share.description, null);
				PUT('/api/quiz/' + quizID + '/outcome/' + quiz.outcomeList[0] + '/share', putData, function(err, data) {
					GET('/api/quiz/' + quizID, function(err, data) {
						assert.equal(data.outcomeList[0].share.link, 		putData.link);
						assert.equal(data.outcomeList[0].share.pic_url, 	putData.pic_url);
						assert.equal(data.outcomeList[0].share.caption, 	putData.caption);
						assert.equal(data.outcomeList[0].share.description, putData.description);
						done(err);
					});
				});
			});	
		});
		it ('Quiz Share /api/share/:id/increment-fb-count AND /api/share/:id/increment-twitter-count', function(done) {
			var shareID;
			GET('/api/quiz/' + quizID, function(err, data) {
				shareID = data.share._id;
				assert.equal(data.share.fbCount, 0);
				assert.equal(data.share.twitterCount, 0);
				// increment fb-count x2, twitter-count x3 (GET due to JSONP hack)
				GET('/api/share/' + shareID + '/increment-fb-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-fb-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-twitter-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-twitter-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-twitter-count', function(err, data) {
					GET('/api/quiz/' + quizID, function(err, data) {
						assert.equal(data.share.fbCount, 2);
						assert.equal(data.share.twitterCount, 3);
						done(err);
					});
				});});});});});
			});
		});
		it ('Outcome Share /api/share/:id/increment-fb-count AND /api/share/:id/increment-twitter-count', function(done) {
			var shareID;
			GET('/api/quiz/' + quizID, function(err, data) {
				shareID = data.outcomeList[0].share._id;
				assert.equal(data.outcomeList[0].share.fbCount, 0);
				assert.equal(data.outcomeList[0].share.twitterCount, 0);
				// increment fb-count x2, twitter-count x3 (GET due to JSONP hack)
				GET('/api/share/' + shareID + '/increment-fb-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-fb-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-twitter-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-twitter-count', function(err, data) {
				GET('/api/share/' + shareID + '/increment-twitter-count', function(err, data) {
					GET('/api/quiz/' + quizID, function(err, data) {
						assert.equal(data.outcomeList[0].share.fbCount, 2);
						assert.equal(data.outcomeList[0].share.twitterCount, 3);
						done(err);
					});
				});});});});});
			});
		});
	});
	/* ---------------------------- /api/quiz/--------/share tests */

	/* /api/quiz/:quizID/outcome/* tests ------------------------- */
	describe('/api/quiz/:quizID/outcome/*', function() {
		// POST /api/quiz/:quizID/outcome implicitely tested by beforeEach		
		var outcomeData = {
			text: 'TEST-OUTCOME-TEXT',
			description: 'TEST-OUTCOME-DESCRIPTION',
			pic_url: "http://huffingtonpost.com/favicon.ico",
			pic_credit: "TEST-PIC-CREDIT"
		};
		var outcomeID;
		beforeEach(function(done) {
			POST('/api/quiz/' + quizID + '/outcome', outcomeData, function(err, data) {
				assert.equal(data._quiz, quizID);
				assert.equal(data.text, outcomeData.text);
				assert.equal(data.description, outcomeData.description);
				assert.equal(data.pic_url, outcomeData.pic_url);
				assert.equal(data.pic_credit, outcomeData.pic_credit);
				assert.equal(data.pic_style, null);
				outcomeID = data._id;
				done(err);
			});
		});
		it ('tests POST Quiz properly POSTed first outcome', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				assert.equal(data.outcomeList[0]._id, quiz.outcomeList[0]);
				assert.equal(data.outcomeList[0].text, null);
				assert.equal(data.outcomeList[0].description, quizData.outcomeList[0].description);
				assert.equal(data.outcomeList[0].pic_url, null);
				assert.equal(data.outcomeList[0].pic_credit, null);
				done(err);
			});
		})
		it('tests POST adds out outcome to our quiz.outcomeList', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				assert.equal(data.outcomeList.length, 3);
				// first 2 outcomes should be initially posted ones
				assert.equal(data.outcomeList[2].text, outcomeData.text);
				assert.equal(data.outcomeList[2].description, outcomeData.description);
				assert.equal(data.outcomeList[2].pic_url, outcomeData.pic_url);
				assert.equal(data.outcomeList[2].pic_credit, outcomeData.pic_credit);
				assert.equal(data.outcomeList[2].pic_style, null);
				done(err);
			});
		});
		it ('tests POST outcome maintains order', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				assert.equal(data.outcomeList[0]._id, quiz.outcomeList[0]);
				assert.equal(data.outcomeList[1]._id, quiz.outcomeList[1]);
				assert.equal(data.outcomeList[2]._id, outcomeID);
				done(err);
			});
		});
		it('GET /api/outcome/all', function(done) {
			GET('/api/outcome/all', function(err, data) {
				assert.equal(data.length, 3);
				done(err);
			});
		});
		it('DELETE /api/quiz/:quizID/outcome/:id', function(done) {
			DELETE('/api/quiz/' + quizID + '/outcome/' + outcomeID, function(err) {
				GET('/api/outcome/all', function(err, data) {
					assert.equal(data.length, 2);
					assert.equal(data[0]._id, quiz.outcomeList[0]);
				});
				GET('/api/quiz/' + quizID, function(err, data) {
					assert.equal(data.outcomeList.length, 2);
					assert.equal(data.outcomeList[0]._id, quiz.outcomeList[0]);
					done(err);
				});
			});
		});
		it ('PUT /api/quiz/:quizID/outcome/:id', function(done) {
			var putData = {
				text: 'NEW-OUTCOME-TEXT',
				pic_style: 'NEW-PIC-STYLE',
				pic_credit: 'NEW-PIC-CREDIT',
			}
			PUT('/api/quiz/' + quizID + '/outcome/' + outcomeID, putData, function(err, data) {
				assert.equal(data._quiz, quizID);
				assert.equal(data.text, putData.text);
				assert.equal(data.description, outcomeData.description);
				assert.equal(data.pic_style, putData.pic_style);
				assert.equal(data.pic_credit, putData.pic_credit);
				assert.equal(data.pic_url, outcomeData.pic_url);
				GET('/api/quiz/' + quizID, function(err, data) {
					assert.equal(data.outcomeList.length, 3);

					assert.equal(data.outcomeList[0]._id, quiz.outcomeList[0]);
					assert.equal(data.outcomeList[0].text, null);
					assert.equal(data.outcomeList[0].description, quizData.outcomeList[0].description);
					assert.equal(data.outcomeList[0].pic_url, null);
					assert.equal(data.outcomeList[0].pic_credit, null);

					assert.equal(data.outcomeList[1]._id, quiz.outcomeList[1]);
					assert.equal(data.outcomeList[1].text, null);
					assert.equal(data.outcomeList[1].description, quizData.outcomeList[1].description);
					assert.equal(data.outcomeList[1].pic_url, null);
					assert.equal(data.outcomeList[1].pic_credit, null);

					assert.equal(data.outcomeList[2]._id, outcomeID);
					assert.equal(data.outcomeList[2].text, putData.text);
					assert.equal(data.outcomeList[2].description, outcomeData.description);
					assert.equal(data.outcomeList[2].pic_url, outcomeData.pic_url);
					assert.equal(data.outcomeList[2].pic_credit, putData.pic_credit);
					assert.equal(data.outcomeList[2].pic_style, putData.pic_style);
				
					done(err);
				});
			});
		});
	});
	/* ------------------------- /api/quiz/:quizID/outcome/* tests */

	/* /api/quiz/:quizID/question/:questionID/answer/* tests ---- */
	describe('/api/quiz/:quizID/question/:questionID/answer/* tests', function() {
		var questionID;
		var answerData;
		var answerID;
		beforeEach(function(done) {
			questionID = quiz.questionList[0];
			answerData = {
				_question: questionID,
				_outcome:  quiz.outcomeList[0],
				text: "TEST-ANSWER-TEXT",
				pic_url: 'http://huffingtonpost.com/favicon.ico',
			};
			POST('/api/quiz/' + quizID + '/question/' + questionID + '/answer', answerData, function(err, data) {
				answerID = data._id;
				done(err);
			});
		});
		it ('GET /api/answer/all', function(done) {
			GET('/api/answer/all', function(err, data) {
				assert.equal(data.length, 3);
				done(err);
			});
		});
		it ('tests POST Answer maintains order', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				var answerList = data.questionList[0].answerList;
				assert.equal(answerList[0].text, quizData.questionList[0].answerList[0].text);
				assert.equal(answerList[1].text, quizData.questionList[0].answerList[1].text);
				assert.equal(answerList[2].text, answerData.text);
				done(err);
			});
		});
		it ('tests initial POST Quiz correctly inserted initial answers', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				var answerList = data.questionList[0].answerList;
				assert.equal(answerList[0]._question, data.questionList[0]._id);
				assert.equal(answerList[0]._outcome, data.outcomeList[0]._id);
				assert.equal(answerList[1]._outcome, data.outcomeList[1]._id);
				assert.equal(answerList[1]._question, data.questionList[0]._id);
				done(err);
			});
		});
		it('POSTs correctly', function(done) {
			GET('/api/answer/all', function(err, data) {
				assert.equal(data.length, 3);
			});
			GET('/api/quiz/' + quizID, function(err, data) {
				var a = data.questionList[0].answerList[2];
				assert.equal(a._id, answerID);
				assert.equal(a._question, answerData._question);
				assert.equal(a._outcome, answerData._outcome);
				assert.equal(a.text, answerData.text);
				assert.equal(a.pic_url, answerData.pic_url);
				assert.equal(a.pic_style, null);
				assert.equal(a.pic_credit, null);
				done(err);
			});
		});
		it ('DELETE /api/quiz/:quizID/question/:questionID/answer/:id', function(done) {
			DELETE('/api/quiz/' + quizID + '/question/' + questionID + '/answer/' + answerID, function(err) {
				GET('/api/answer/all', function(err, data) {
					assert.equal(data.length, 2);
				});
				GET('/api/quiz/' + quizID, function(err, data) {
					var answerList = data.questionList[0].answerList;
					assert.equal(answerList.length, 2);
					// make sure it deleted the correct Answer
					assert.equal(answerList[0].text, quizData.questionList[0].answerList[0].text);
					assert.equal(answerList[1].text, quizData.questionList[0].answerList[1].text);
					done(err);
				});
			});
		});
		it ('PUT /api/quiz/:quizID/question/:questionID/answer/:id', function(done) {
			var putData = {
				text: "NEW-ANSWER-TEXT",
				pic_style: "cover",
				pic_credit: "TEST-CREDIT",
			};
			PUT('/api/quiz/' + quizID + '/question/' + questionID + '/answer/' + answerID, putData, function(err, data) {
				assert.equal(data.text, putData.text);
				assert.equal(data.pic_url, answerData.pic_url);
				assert.equal(data.pic_style, putData.pic_style);
				assert.equal(data.pic_credit, putData.pic_credit);

				GET('/api/quiz/' + quizID, function(err, data) {
					var answerList = data.questionList[0].answerList;
					assert.equal(answerList[2].text, putData.text);
					assert.equal(answerList[2].pic_url, answerData.pic_url);
					assert.equal(answerList[2].pic_style, putData.pic_style);
					assert.equal(answerList[2].pic_credit, putData.pic_credit);
					done(err);
				});
			});
		});
	});
	/* ---- /api/quiz/:quizID/question/:questionID/answer/* tests */

	/* /api/quiz/:quizID/question/* tests ----------------------- */
	describe('/api/quiz/:quizID/question/* tests ', function() {
		var questionData;
		var question;
		var questionID;
		beforeEach(function(done) {
			questionData = {
				text: "TEST-QUESTION-TEXT",
				answerList: [
					{ text: "TEST-ANSWER-1", _outcome: quiz.outcomeList[0] },
					{ text: "TEST-ANSWER-2", pic_url: "http://huffingtonpost.com/favicon", pic_credit: "PIC-CREDIT", pic_style: "float-right", _outcome: quiz.outcomeList[0] },
				],
			};
			POST('/api/quiz/' + quizID + '/question', questionData, function(err, data) {
				assert.equal(data._quiz, quizID);
				question = data;
				questionID = data._id;
				done(err);
			});
		});
		it ('GET /api/question/all', function(done) {
			GET('/api/question/all', function(err, data) {
				assert.equal(data.length, 2);
				done(err);
			});
		});
		it ('tests POST Question maintains order', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				assert.equal(data.questionList[0]._id, quiz.questionList[0]);
				assert.equal(data.questionList[1]._id, questionID);
				done(err);
			});
		});
		it ('tests initial POST Quiz correctly inserted initial question', function(done) {
			GET('/api/quiz/' + quizID, function(err, data) {
				var q = data.questionList[0];
				assert.equal(q._id, quiz.questionList[0]);
				assert.equal(q._quiz, quizID);
				assert.equal(q.text, quizData.questionList[0].text);
				assert.equal(q.answerList.length, 2);
				assert.equal(q.answerList[0]._question, q._id);
				assert.equal(q.answerList[0]._outcome, quiz.outcomeList[0]);
				assert.equal(q.answerList[0].text, quizData.questionList[0].answerList[0].text);
				assert.equal(q.answerList[1]._question, q._id);
				assert.equal(q.answerList[1]._outcome, quiz.outcomeList[1]);
				assert.equal(q.answerList[1].text, quizData.questionList[0].answerList[1].text);
				done(err);
			});
		});
		it('POSTs correctly', function(done) {
			GET('/api/answer/all', function(err, data) {
				assert.equal(data.length, 4);
			});
			GET('/api/quiz/' + quizID, function(err, data) {
				var q = data.questionList[1];
				assert.equal(q._id, questionID);
				assert.equal(q._quiz, quizID);
				assert.equal(q.text, questionData.text);
				assert.equal(q.answerList.length, 2);
				assert.equal(q.answerList[0]._question, q._id);
				assert.equal(q.answerList[0]._outcome, quiz.outcomeList[0]);
				assert.equal(q.answerList[0].text, questionData.answerList[0].text);
				assert.equal(q.answerList[1]._question, q._id);
				assert.equal(q.answerList[1]._outcome, quiz.outcomeList[0]);
				assert.equal(q.answerList[1].text, questionData.answerList[1].text);
				done(err);
			});
		});
		it ('DELETE /api/quiz/:quizID/question/:id', function(done) {
			DELETE('/api/quiz/' + quizID + '/question/' + questionID, function(err) {
				GET('/api/question/all', function(err, data) {
					assert.equal(data.length, 1);
				});
				GET('/api/answer/all', function(err, data) {
					assert.equal(data.length, 2);
				});
				GET('/api/quiz/' + quizID, function(err, data) {
					assert.equal(data.questionList.length, 1);
					assert.equal(data.questionList[0]._id, quiz.questionList[0]);
					done(err);
				});
			});
		});
		it ('PUT /api/quiz/:quizID/question/:id', function(done) {
			var putData = questionData;
			putData.text = "NEW-QUESTION-TEXT";
			putData.answerList[0]._id = question.answerList[0];
			putData.answerList[1]._id = question.answerList[1];
			putData.answerList[0].text = "NEW-ANSWER-TEXT";
			putData.answerList[0].pic_url = "http://huffingtonpost.com/favicon";
			putData.answerList[1].pic_credit = "NEW-CREDIT";
			putData.answerList[2] = { text: "ADDITIONAL-ANSWER", _outcome: quiz.outcomeList[0] };
			/* previously  questionData = {
				text: "TEST-QUESTION-TEXT",
				answerList: [
					{ text: "TEST-ANSWER-1", _outcome: quiz.outcomeList[0] },
					{ text: "TEST-ANSWER-2", pic_url: "http://huffingtonpost.com/favicon", pic_credit: "PIC-CREDIT", pic_style: "float-right", _outcome: quiz.outcomeList[0] },
				],
			}; */
			PUT('/api/quiz/' + quizID + '/question/' + questionID, putData, function(err, data) {
				console.log(data)
				assert.equal(data.text, putData.text);
				assert.equal(data.answerList.length, 3);
				assert.equal(data.answerList[0]._outcome, putData.answerList[0]._outcome);
				assert.equal(data.answerList[0].text, putData.answerList[0].text);
				assert.equal(data.answerList[0].pic_url, putData.answerList[0].pic_url);
				assert.equal(data.answerList[0].pic_style, null);
				assert.equal(data.answerList[0].pic_credit, null);


				assert.equal(data.answerList[1]._outcome, putData.answerList[1]._outcome);
				assert.equal(data.answerList[1].text, putData.answerList[1].text);
				assert.equal(data.answerList[1].pic_url, putData.answerList[1].pic_url);
				assert.equal(data.answerList[1].pic_style, putData.answerList[1].pic_style);
				assert.equal(data.answerList[1].pic_credit, putData.answerList[1].pic_credit);

				assert.equal(data.answerList[2]._question, questionID);
				assert.equal(data.answerList[2]._outcome, putData.answerList[0]._outcome);
				assert.equal(data.answerList[2].text, putData.answerList[2].text);
				assert.equal(data.answerList[2].pic_url, null);
				assert.equal(data.answerList[2].pic_style, null);
				assert.equal(data.answerList[2].pic_credit, null);

				GET('/api/quiz/' + quizID, function(err, data) {
					var question = data.questionList[1];
					assert.equal(question.text, putData.text);
					assert.equal(question.answerList.length, 3);
					assert.equal(question.answerList[0]._outcome, putData.answerList[0]._outcome);
					assert.equal(question.answerList[0].text, putData.answerList[0].text);
					assert.equal(question.answerList[0].pic_url, putData.answerList[0].pic_url);
					assert.equal(question.answerList[0].pic_style, null);
					assert.equal(question.answerList[0].pic_credit, null);


					assert.equal(question.answerList[1]._outcome, putData.answerList[1]._outcome);
					assert.equal(question.answerList[1].text, putData.answerList[1].text);
					assert.equal(question.answerList[1].pic_url, putData.answerList[1].pic_url);
					assert.equal(question.answerList[1].pic_style, putData.answerList[1].pic_style);
					assert.equal(question.answerList[1].pic_credit, putData.answerList[1].pic_credit);

					assert.equal(question.answerList[2]._question, questionID);
					assert.equal(question.answerList[2]._outcome, putData.answerList[0]._outcome);
					assert.equal(question.answerList[2].text, putData.answerList[2].text);
					assert.equal(question.answerList[2].pic_url, null);
					assert.equal(question.answerList[2].pic_style, null);
					assert.equal(question.answerList[2].pic_credit, null);

					done(err);
				});
			});
		});
	});
	/* ----------------------- /api/quiz/:quizID/question/* tests */

	/* /api/quiz/* tests ---------------------------------------- */
	describe('/api/quiz/*', function() {
		//it('GET /api/quiz/*')
	});

	/* ---------------------------------------- /api/quiz/* tests */


	/* trivia-quiz tests ---------------------------------------- */
	/* ---------------------------------------- trivia-quiz tests */




});

