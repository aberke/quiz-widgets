
var mongoose 			= require('mongoose'),
	mongo 				= require('./mongo.js'),
	ObjectId 			= mongo.ObjectId,
	Schema  			= mongo.Schema,

	User				= require('./user-model.js'),
	Share				= require('./share-model.js'),
	Outcome 			= require('./outcome-model.js'),
	Question 			= require('./question-answer-models.js').Question;



/* ------------------- SCHEMA DEFINITIONS -------------------

var userSchema = new Schema({
	twitter_id: 			{type: String, default: null},
	twitter_username: 		{type: String, default: null},
	twitter_displayname: 	{type: String, default: null},
	date_created: 			{ type: Date, default: Date.now },
	quizList: 				[{ type: ObjectId, ref: 'Quiz' }] // need to push quiz on to user upon quiz creation)
});
var quizSchema = new Schema({
	_user: 		  		{type: ObjectId, ref: 'User', default: null},
	title: 		  		{type: String, default: null},
	pic_url: 	  		{type: String, default: null},
	pic_credit: 		{type: String, default: null},
	date_created: 		{ type: Date, default: Date.now },
	questionList: 		[{ type: ObjectId, ref: 'Question' }],
	outcomeList:  		[{ type: ObjectId, ref: 'Outcome' }],
	share: 				{type: ObjectId, ref: 'Share', default: null},
	refresh_icon_url: 	{type: String, default: null},
	custom_styles: 		{type: String, default: null}, // a string of CSS rules 


	// for backwards compatibility 
	startedCount: 		{ type: Number, default: 0},
	completedCount: 	{ type: Number, default: 0},

	// For Trivia ----  type: 'trivia-quiz'
	type: 				{type: String, default: 'default-quiz'},
	extraSlide: 		{type: ObjectId, ref: 'Slide', default: null},
});
var outcomeSchema = new Schema({
	_quiz:  	 {type: ObjectId, ref: 'Quiz'},
	share: 		 {type: ObjectId, ref: 'Share', default: null},
	text:   	 {type: String, default: null},
	description: {type: String, default: null},
	pic_url: 	 {type: String, default: null},
	pic_style: 	 {type: String, default: "bottom-right"}, // options: 'float-right' 'bottom-right', 'cover', 'contain'
	pic_credit:  {type: String, default: null},

	// for backwards compatibility 
	count:  	 { type: Number, default: 0}, // number of times its been the outcome

	// for quizzes of type 'trivia-quiz' 
	rules: 		 {
					min_correct: {type: Number, default: 0},
					//max_correct: Number,		
				 },
});
var answerSchema = new Schema({
	_question:  	{type: ObjectId, ref: 'Question'},
	_outcome: 		{type: ObjectId, ref: 'Outcome', default: null}, // the outcome it adds a point to if selected
	text:   		String,
	pic_url: 		{type: String, default: null},
	pic_style: 		{type: String, default: "bottom-right"}, // options: 'bottom-right', 'cover', 'contain'
	pic_credit: 	{type: String, default: null},

	// for backwards compatibility
	count:  		{ type: Number, default: 0}, // number of times it's been picked

	// for quizzes of type 'trivia-quiz'
	correct: 		{ type: Boolean, default: 'false'},
});
var shareSchema = new Schema({
	// The share model is either owned by a Quiz or an Outcome, since both are sharable
	_quiz: 				{type: ObjectId, ref: 'Quiz', default: null},
	_outcome: 			{type: ObjectId, ref: 'Outcome', default: null}, 
	caption: 			{type: String, default: null},
	pic_url: 			{type: String, default: null},
	description:  		{type: String, default: null},
	link: 		 		{type: String, default: null},
	// for stats
	fbCount: 			{type: Number, default: 0},
	twitterCount: 		{type: Number, default: 0},
});
var slideSchema = new Schema({
	_quiz: 		 		{type: ObjectId, ref: 'Quiz'},
	blob: 				{type: String, default: null},
});
var questionSchema = new Schema({
	_quiz: 		 {type: ObjectId, ref: 'Quiz'},
	text:  		 String,
	answerList:  [{type: ObjectId, ref: 'Answer'}],
});
------------------- SCHEMA DEFINITIONS ------------------- */

/* Slide -------------------------------------------------------- */
var Slide = function() {
	var _model = mongo.Model('Slide', {
		_quiz: 		 		{type: ObjectId, ref: 'Quiz'},
		blob: 				{type: String, default: null},
	});
	var create = function(slideData, callback) {
		if (!slideData._quiz) { return callback('Slide must reference _quiz', null); }
		var slide = new _model({
			_quiz: 	slideData._quiz,
			blob: 	(slideData.blob || null)
		});
		slide.save(function(err) { callback(err, slide); });
		return slide; // for the impatient, like Quiz.create()
	}
	var all = function(callback) {
		_model.find().exec(callback);
	}
	// TODO: USE UPDATE
	var update = function(slideID, slideData, callback) {
		_model.findById(slideID)
			.exec(function(err, slide) {
				if (err || !slide) { return callback(err); }
				slide._quiz = (slideData._quiz || slide._quiz);
				slide.blob  = (slideData.blob || slide.blob);
				slide.save(callback);
			});
	}
	var remove = function(slideID, callback) {
		_model.remove({ _id: slideID }).exec(callback);
	}
	return {
		create: create,
		all: 	all,
		update: update,
		remove: remove,
		model:  _model,
	}
}();
exports.Slide = Slide;
/* ------------------------------------------------------ Slide */



var Quiz = function() {

	var _model = mongo.Model('Quiz', {
		_user: 		  		{ type: ObjectId, ref: 'User', default: null},
		title: 		  		{ type: String, default: null},
		pic_url: 	  		{ type: String, default: null},
		pic_credit: 		{ type: String, default: null},
		date_created: 		{ type: Date, default: Date.now },
		questionList: 		[{type: ObjectId, ref: 'Question' }],
		outcomeList:  		[{type: ObjectId, ref: 'Outcome' }],
		share: 				{ type: ObjectId, ref: 'Share', default: null},
		refresh_icon_url: 	{ type: String, default: null},
		custom_styles: 		{ type: String, default: null}, // a string of CSS rules 


		// for backwards compatibility 
		startedCount: 		{ type: Number, default: 0},
		completedCount: 	{ type: Number, default: 0},

		// For Trivia ----  type: 'trivia-quiz'
		type: 				{type: String, default: 'default-quiz'},
		extraSlide: 		{type: ObjectId, ref: 'Slide', default: null},
	});

	var findPartial = function(quizID, callback) {
		_model.findById(quizID)
			.exec(callback);
	}
	var findByUser = function(userID, callback) {
		_model.find({_user: userID})
			.populate('_user')
			.populate('questionList')
			.populate('outcomeList')
			.exec(callback);
	}
	var find = function(quizID, callback) {	/* get FULLY POPULATED quiz 
		- Tricky situation: 
			a quiz has a questionList.  
			Each question in the questionList has an answerList
			Cannot populate both the questionList and each answerList all at once

		- Work around below:
			after populating the questionList, populate each answerList in a for loop
			only return the Quiz object once all populate calls have been executed
		*/
		var numCalled = 0; // tally up the number of mongo functions we're waiting on before can call callback
		var totalCalls = 0; // +1 for each question in questionList and quiz.outcomeList.share
		/* complete callback when all calls have executed OR when there is an error */
		var call = function(err, data) {
			numCalled += 1;
			if ((numCalled >= totalCalls) || err) {
				callback(err, data);
			}
		}

		_model.findById(quizID)
			.populate('_user')
			.populate('questionList')
			.populate('outcomeList')
			.populate('extraSlide')
			.populate('share')
			.exec(function(err, quiz) {
				if (err || !quiz) { return callback(new Error('Error in models.findQuiz'), null); }
				
				totalCalls += 1;
				_model.populate(quiz, { path: 'outcomeList.share', model: 'Share' }, function(err, data) {
					call(err, quiz);
				});
				
				for (var i=0; i<quiz.questionList.length; i++) {
					totalCalls += 1;
					_populateQuestionListHelper(quiz, i, call);
				}
		});
	}
	/* helper to Quiz.find() */
	var _populateQuestionListHelper = function(quiz, questionListIndex, callback) {
		var options = [{
			path: 'answerList',
			model: 'Answer'
		}];	
		Question.model.populate(quiz.questionList[questionListIndex], options, function(err, question) {
			callback(err, quiz);	
		});
	}
	var all = function(callback) {
		_model.find().exec(callback);
	}
	var removeSlide = function(quizID, slideID, callback) {
		_model.findById(quizID).exec(function(err, quiz) {
			if (err || !quiz) { return callback(err || 'Quiz does not exist'); }
			if (!quiz.extraSlide) { return callback(new Error('Quiz does not have extraSlide')); }
			
			Slide.remove(slideID, function(err) {
				if (err) { return callback(err); }
				quiz.extraSlide = null;
				quiz.save(function(err) { callback(err, quiz); });
			});
		});
	}
	var addSlide = function(quizID, slideData, callback) {
		_model.findById(quizID).exec(function(err, quiz) {
			if (err || !quiz) { return callback(err || 'Quiz does not exist'); }
			if (quiz.extraSlide) { return callback(new Error('Quiz already has extraSlide')); }
			
			slideData._quiz = quizID;
			Slide.create(slideData, function(err, slide) {
				if (err) { return callback(err); }
				
				quiz.extraSlide = slide;
				quiz.save(function(err) { callback(err, slide); });
			});
		});
	}
	var addOutcome = function(quizID, outcomeData, callback) {
		/* make sure the quiz exists -- get it, create outcome, push it to outcomeList */
		_model.findById(quizID, function(err, quiz) {
			if (err || !quiz) { return callback(err || 'Quiz does not exist'); }

			outcomeData._quiz = quizID;
			Outcome.create(outcomeData, function(err, outcome) {
				quiz.outcomeList.push(outcome._id);
				quiz.save(function(err) { callback(err, outcome); });
			});
		});
	}
	var removeOutcome = function(quizID, outcomeID, callback) {
		_model.findById(quizID).exec(function(err, quiz) {
			if (err || !quiz) { return callback(err || 'Quiz does not exist'); }

			var index = quiz.outcomeList.indexOf(outcomeID);
			if (index < 0) { return callback('Quiz does not own outcome ' + outcomeID); }
			Outcome.remove(outcomeID, function(err) {
				if (err) { return callback(err); }
				quiz.outcomeList.splice(index, 1);
				quiz.save(callback);
			});
		});
	}
	var addQuestion = function(quizID, questionData, callback) {
		/* make sure the quiz exists -- get it, create question, push it to questionList */
		_model.findById(quizID, function(err, quiz) {
			if (err || !quiz) { return callback(err || 'Quiz does not exist'); }

			questionData._quiz = quizID;
			Question.create(questionData, function(err, question) {
				if (err) { return callback(err); }
				quiz.questionList.push(question);
				quiz.save(function(err) { callback(err, question); });
			});
		});
	}
	var removeQuestion = function(quizID, questionID, callback) {
		_model.findById(quizID, function(err, quiz) {
			if (err || !quiz) { return callback(err || 'Quiz does not exist'); }

			var index = quiz.questionList.indexOf(questionID);
			if (index < 0) { return callback('Quiz does not own question ' + questionID); }
			Question.remove(questionID, function(err) {
				if (err) { return callback(err); }
				quiz.questionList.splice(index, 1);
				quiz.save(callback);
			});
		});
	}
	var create = function(quizData, callback) {
		/* REASONING for lax error checking and not waiting for saves to callback:
			Editors take a lot of effort and time when creating a new page
			they will be VERY upset if their work is lost

			tldr: make best effort to save as much as possible and return quiz as quickly as possible
		*/
		if (!quizData._user) { return callback('Invalid user', null); }
		if (!quizData.title || !quizData.title.length) { return callback('Invalid Quiz Title', null); }
		if (!quizData.questionList || !quizData.questionList.length) { return callback('Invalid Quiz Question List', null); }
		if (!quizData.outcomeList || (!quizData.outcomeList.length && (quizData.type != 'trivia-quiz'))) { return callback('Invalid Quiz Outcome List', null); }

		/* Create new quiz and push on the rest */
		var newQuiz = new _model({
			_user: 				quizData._user,
			title: 				quizData.title,
			pic_url: 			(quizData.pic_url 	 		|| null),
			pic_credit: 		(quizData.pic_credit 		|| null),
			custom_styles: 		(quizData.custom_styles 	|| null),
			refresh_icon_url: 	(quizData.refresh_icon_url 	|| null),

			type: 				(quizData.type 				|| 'default-quiz'),
		});
		newQuiz.share = Share.create({_quiz: newQuiz}, function(err, share) {});

		if (quizData.extraSlide) { // eg, answer-key for trivia-quiz
			newQuiz.extraSlide = Slide.create({ _quiz: newQuiz, blob: quizData.extraSlide.blob }, function(){});
		}
		/* Front-end handles outcome-answer relationships 
			by giving unsaved outcomes fake ID's
				- generated client-side by Math.random() so that answers could have something to refer to 
			Answers point to Outcomes by referencing these fake IDs
				- matching answers to outcomes by answerData._outcome == outcomeData._id
		*/
		var outcomeDict = {}; // maps {fakeID: outcome} since answerData just has the fake id
		for (var i=0; i<quizData.outcomeList.length; i++) {
			var outcomeData = quizData.outcomeList[i];
			outcomeData._quiz = newQuiz;
			// get unsaved model back right away for outcomeDict and pushing to outcomeList
			var newOutcome = Outcome.create(outcomeData)
			outcomeDict[outcomeData._id] = newOutcome;
			newQuiz.outcomeList.push(newOutcome);
		}
		for (var i=0; i<quizData.questionList.length; i++) {
			var questionData = quizData.questionList[i];
			questionData._quiz = newQuiz._id;
			// put outcomeDict to use
			for (var j=0; j<questionData.answerList.length; j++) {
				var o_tempID = questionData.answerList[j]._outcome;
				if (o_tempID) { // trivia Answers do not
					questionData.answerList[j]._outcome = outcomeDict[o_tempID];
				}
			}
			var newQuestion = Question.create(questionData);
			newQuiz.questionList.push(newQuestion);
		}
		// push quiz on to User's quiz list
		User.addQuiz(quizData._user, newQuiz, function(){});

		// Finally, save the quiz
		newQuiz.save(function(err) { callback(err, newQuiz); });
	}

	var remove = function(quizID, callback) {
		_model.findById(quizID)
			.exec(function(err, quiz) {
				if (err || !quiz) { return callback(err, null); }
			
				var numCalled = 0; // tally up the number of mongo functions we're waiting on before can call callback
				var totalCalls = 0; // +1 for each question in questionList and quiz.outcomeList.share
				/* complete callback when all calls have executed OR when there is an error */
				var call = function(err) {
					numCalled += 1;
					if ((numCalled >= totalCalls) || err) {
						callback(err);
					}
				}
				for (var q=0; q<quiz.questionList.length; q++) {
					totalCalls += 1;
					Question.remove(quiz.questionList[q], call);
				}
				for (var o=0; o<quiz.outcomeList.length; o++) {
					totalCalls += 1;
					Outcome.remove(quiz.outcomeList[o], call);
				}
				totalCalls += 3;
				Share.remove(quiz.share, call);
				Slide.remove(quiz.extraSlide, call);
				Stat.removeAllQuiz(quizID, call);
				// remove the quiz itself
				totalCalls += 1;
				_model.remove({ _id: quizID }, call);
			});
	}
	var updateShare = function(quizID, shareData, callback) {
		_model.findById(quizID).exec(function(err, quiz) {
			if (err) { return callback(err, null); }
			
			if (!quiz.share) {
				Share.create(shareData, function(err, share) {
					if (err) { return callback(err); }
					quiz.share = share._id;
					quiz.save(function(err) { callback(err, share); });
				});
			} else {
				Share.update(quiz.share, shareData, callback);
			}
		});
	}

	/* TODO -- REPLACE WITH UPDATE */
	var setUser = function(quizID, userID, callback) {
		_model.findById(quizID)
			.exec(function(err, quiz) {
				if (err || !quiz) { return callback(err); }
				quiz._user = userID;
				quiz.save(callback);
			});
	}
	/* TODO -- REPLACE WITH UPDATE */

	return {
		all: 			all,
		find: 			find,
		findPartial: 	findPartial,
		findByUser: 	findByUser,

		create: 	 	create,
		remove: 	 	remove,

		setUser: 	 	setUser,

		updateShare: 	updateShare,

		addSlide: 	 	addSlide,
		removeSlide: 	removeSlide,

		addOutcome: 	addOutcome,
		removeOutcome: 	removeOutcome,

		addQuestion: 	addQuestion,
		removeQuestion: removeQuestion,

		model: 		 	_model,
	}
}();
exports.Quiz = Quiz;



