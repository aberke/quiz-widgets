
var mongooseConfig = {
	url: process.env.DOTCLOUD_DB_MONGODB_URL || process.env.LOCAL_MONGODB_URL,
	login: process.env.DOTCLOUD_DB_MONGODB_LOGIN || null,
	pass: process.env.DOTCLOUD_DB_MONGODB_PASSWORD || null
};

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

mongoose.connect(mongooseConfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongoose database connection error:'));
db.once('open', function callback () {
  console.log('mongoose database open... YAY');
});




var userSchema = new Schema({
	twitter_id: 			{type: String, default: null},
	twitter_username: 		{type: String, default: null},
	twitter_displayname: 	{type: String, default: null},
	date_created: 			{ type: Date, default: Date.now },
	quizList: 				[{ type: ObjectId, ref: 'Quiz' }] // need to push quiz on to user upon quiz creation)
});
var shareSchema = new Schema({
	/* The share model is either owned by a Quiz or an Outcome, since both are sharable */
	_quiz: 				{type: ObjectId, ref: 'Quiz', default: null},
	_outcome: 			{type: ObjectId, ref: 'Outcome', default: null}, 
	caption: 			{type: String, default: null},
	pic_url: 			{type: String, default: null},
	description:  		{type: String, default: null},
	link: 		 		{type: String, default: null},
	/* for stats */
	fbCount: 			{type: Number, default: 0},
	twitterCount: 		{type: Number, default: 0},
})
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
	
	startedCount: 		{ type: Number, default: 0},
	completedCount: 	{ type: Number, default: 0},

});
var questionSchema = new Schema({
	_quiz: 		 {type: ObjectId, ref: 'Quiz'},
	index: 		 Number, // questions are ordered -- deprecating -- let quiz.questionList handle
	text:  		 String,
	answerList:  [{type: ObjectId, ref: 'Answer'}],
});
var outcomeSchema = new Schema({
	_quiz:  	 {type: ObjectId, ref: 'Quiz'},
	share: 		 {type: ObjectId, ref: 'Share', default: null},
	index: 		 Number, // ordered -- deprecating -- let quiz.outcomeList handle
	text:   	 {type: String, default: null},
	description: {type: String, default: null},
	pic_url: 	 {type: String, default: null},
	pic_style: 	 {type: String, default: "bottom-right"}, // options: 'float-right' 'bottom-right', 'cover', 'contain'
	pic_credit:  {type: String, default: null},
	count:  	 { type: Number, default: 0}, // number of times its been the outcome
});
var answerSchema = new Schema({
	_question:  	{type: ObjectId, ref: 'Question'},
	_outcome: 		{type: ObjectId, ref: 'Outcome'}, // the outcome it adds a point to if selected
	text:   		String,
	pic_url: 		{type: String, default: null},
	pic_style: 		{type: String, default: "bottom-right"}, // options: 'bottom-right', 'cover', 'contain'
	pic_credit: 	{type: String, default: null},
	count:  		{ type: Number, default: 0}, // number of times it's been picked
});

exports.User 	 = User  	= mongoose.model('User', userSchema);
exports.Quiz 	 = Quiz 	= mongoose.model('Quiz', quizSchema);
exports.Share 	 = Share 	= mongoose.model('Share', shareSchema);
exports.Answer   = Answer 	= mongoose.model('Answer', answerSchema);
exports.Question = Question = mongoose.model('Question', questionSchema);
exports.Outcome  = Outcome  = mongoose.model('Outcome', outcomeSchema);



exports.deleteOutcome = function(outcomeID, callback) {
	/* will Share.remove return an error if outcome doesn't own a share? */
	Share.remove({ _outcome: outcomeID}, function (err) { console.log('Share.remove err:', err); });
	Outcome.remove({ _id: outcomeID}, callback);
}
exports.deleteQuestion = function(questionID, callback) {
	/* removes answers then, on success, the question */
	Answer.remove({ _question: questionID}, function(err) {
		if (err) { return callback(err); }
		Question.remove({ _id: questionID}, callback);
	});
};
exports.deleteAnswer = function(answerID, callback) {
	Answer.findOne({ _id: answerID })
		.populate('_question')
		.exec(function(err, answer) {
            if (err) { return callback(err); }

            var index = answer._question.answerList.indexOf(answer._id);
            if (index == -1) { return callback(err); }
            answer._question.answerList.splice(index, 1);
            answer._question.save(function(err) {
            	if (err) { return callback(err); }
            	answer.remove(callback);
            });
		});
};

var deleteQuestion = function(questionID, callback) {
	var otherComplete = false;
	/* delete all its answers too */
	Answer.remove({ _question: questionID}, function(err) {
		if (err || otherComplete) { return callback(err); }
		otherComplete = true;
	});
	Question.remove({ _id: questionID}, function(err) {
		if (err || otherComplete) { return callback(err); }
		otherComplete = true;
	});
}

exports.deleteQuiz = function(quizID, callback) {
	var numCalled = 0; // tally up the number of mongo functions we're waiting on before can call callback
	var totalCalls = 0; // +1 for each question in questionList and quiz.outcomeList.share
	/* complete callback when all calls have executed OR when there is an error */
	var call = function(err) {
		numCalled += 1;
		if ((numCalled >= totalCalls) || err) {
			callback(err);
		}
	}

	/* delete all the questions and the answers */
	Question.find({ _quiz: quizID})
			.exec(function(err, questions) {
				for (var i=0; i<questions.length; i++) {
					totalCalls += 1;
					deleteQuestion(questions[i]._id, call);
				}
			});
	Outcome.find({ _quiz: quizID})
			.exec(function(err, outcomes) {
				for (var j=0; j<outcomes.length; j++) {
					totalCalls += 2; // itself and its share
					Share.remove({ _outcome: outcomes[j]._id}, call);
					outcomes[j].remove(call);
				}
			});
	totalCalls += 2;
	Share.remove({ _quiz: quizID }, call);
	Quiz.remove({ _id: quizID }, call);
}


/* doesn't handle saving answer */
var addAnswer = exports.addAnswer = function(answerData, question, callback) {
	var answer = new Answer({
		_question:  question,
		_outcome: 	answerData._outcome, // the outcome it adds a point to if selected
		text:   	answerData.text,
		pic_url: 	(answerData.pic_url   || null),
		pic_credit: (answerData.pic_credit|| null),
		pic_style:  (answerData.pic_style || "bottom-right"),
	});
	question.answerList.push(answer);
	question.save();
	answer.save(function(err) {
		if (callback) { callback(err, answer); }
	});
}
exports.newShare = function(quiz, outcome, shareData, callback) { // callback: function(err, data)
	/* a share is owned by either a quiz or an outcome.  so either quiz or outcome is null */
	var share = new Share({
		_quiz: 		quiz,
		_outcome: 	outcome,
		caption: 	(shareData.caption 		|| null),
		description:(shareData.description  || null),
		pic_url: 	(shareData.pic_url 		|| null),
		link:  		(shareData.link 		|| null),
	});
	share.save(function(err) {
		if (err) { return callback(err, null); }
		callback(null, share);
	});
}

/* doesn't save outcome or add share -- just does the construction */
var constructOutcome = function(outcomeData) {
	var new_outcome = new Outcome({
		_quiz:  	 outcomeData._quiz,
		// index: 		 outcomeData.index, // ordered
		text:   	 outcomeData.text,
		description: (outcomeData.description|| null),
		pic_url: 	 (outcomeData.pic_url 	 || null),
		pic_style: 	 (outcomeData.pic_style  || "bottom-right"),
		pic_credit:  (outcomeData.pic_credit || null),
	});
	return new_outcome;
}
exports.newOutcome = function(outcomeData, callback) {
	var new_outcome = constructOutcome(outcomeData);
	var newOutcomeShare = new Share({_outcome: new_outcome});
	newOutcomeShare.save(function(err) {
		if (err) { return callback(err, null); }

		new_outcome.share = newOutcomeShare;
		new_outcome.save(function(err) {
			callback(err, new_outcome);
		});
	});
}
exports.newQuestion = function(questionData, callback) {
	var new_question = new Question({
		_quiz: 		questionData._quiz,
		text: 		questionData.text,
	});
	new_question.save(function(err) { callback(err, new_question); });
}
exports.newUser = function(userData, callback) { // userData is twitter profile info object
	var user = new User({
		twitter_id: 			userData.id,
		twitter_username: 		userData.username,
		twitter_displayname: 	userData.displayName,
	});
	user.save(function(err) {
		if (err) { console.log('ERROR IN MONGOOSE-MODELS newUser save'); }
		callback(err, user);
	});
}

exports.newQuiz = function(quizData, callback) { // callback: function(err, data)
	
	// TODO: better error checking
	if (!quizData.title.length) { callback('Invalid Quiz Title', null); }
	if (!quizData.questionList.length) { callback('Invalid Quiz Question List', null); }
	if (!quizData.outcomeList.length) { callback('Invalid Quiz Outcome List', null); }

	/* Create new quiz.  
		Then create Outcomes and push on outcomes.
		Then for each question: create question, create answers
					--> push answers on to questions
				push questions on to quiz
	*/
	var newQuiz = new Quiz({
		_user: 				quizData._user,
		title: 				quizData.title,
		pic_url: 			(quizData.pic_url 	 		|| null),
		pic_credit: 		(quizData.pic_credit 		|| null),
		refresh_icon_url: 	(quizData.refresh_icon_url 	|| null),
	});
	var newShare = new Share({_quiz: newQuiz});
	newShare.save();
	newQuiz.share = newShare;

	var outcomeDict = {}; // maps {index: outcome} since answerData just has the index
	for (var i=0; i<quizData.outcomeList.length; i++) {
		var outcomeData = quizData.outcomeList[i];
		outcomeData._quiz = newQuiz;
		var newOutcome = constructOutcome(outcomeData);
		var newOutcomeShare = new Share({_outcome: newOutcome});
		newOutcomeShare.save();
		newOutcome.share = newOutcomeShare;
		newOutcome.save();
		/* outcomeData._id is fake - generated client-side by Math.random() so that answers could have something to refer to 
			matching answers to outcomes by answerData._outcome == outcomeData._id
		*/
		outcomeDict[outcomeData._id] = newOutcome;
		newQuiz.outcomeList.push(newOutcome);
	}
	for (var i=0; i<quizData.questionList.length; i++) {
		var questionData = quizData.questionList[i];
		var newQuestion = new Question({
			_quiz:  	 newQuiz,
			index: 		 questionData.index, // ordered
			text:   	 questionData.text,
		});

		for (var j=0; j<questionData.answerList.length; j++) {
			var answerData = questionData.answerList[j];
			answerData._outcome = outcomeDict[answerData._outcome];
			addAnswer(answerData, newQuestion); // handles question.answerList.push and answer.save
		}

		newQuestion.save();
		newQuiz.questionList.push(newQuestion);
	}
	console.log('\n\n***************\nnewQuiz', newQuiz)

	/* save the quiz and push it on to the user's quizList */
	newQuiz.save(function(err) {
		if (err) { return callback(err, null); }
		User.findById(quizData._user)
			.populate('quizList')
			.exec(function(err, user) {
				if (err) { return callback(err, null); }
				user.quizList.push(newQuiz);
				user.save(function(err) {
					callback(err, newQuiz);
				})
			});
	});
}
exports.findQuizPartial = function(quizID, callback) {
	/* I don't care about populating -- return just quiz */
	Quiz.findById(quizID).exec(function (err, data) {
		if (err || !data) { return callback(new Error('Error in models.findQuizPartial'), null); }
		
		callback(null, data);
	});
}
exports.findQuiz = function(quizID, callback) {
	/* get FULLY POPULATED quiz 

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

	Quiz.findById(quizID)
		.populate('_user')
		.populate('questionList')
		.populate('outcomeList')
		.populate('share')
		.exec(function(err, quiz) {
			if (err || !quiz) { return callback(new Error('Error in models.findQuiz'), null); }
			
			totalCalls += 1;
			Quiz.populate(quiz, { path: 'outcomeList.share', model: 'Share' }, function(err, data) {
				call(err, quiz);
			});
			
			for (var i=0; i<quiz.questionList.length; i++) {
				totalCalls += 1;
				populateQuestionListHelper(quiz, i, call);
			}
	});
}
/* helper to findQuiz */
var populateQuestionListHelper = function(quiz, questionListIndex, callback) {
	var options = [{ /* support backwards compatibility with answer1 and answer2... */
		path: 'answer1', /* TODO: take out once data migration complete */
		model: 'Answer'
	},{
		path: 'answer2', /* TODO: take out once data migration complete */
		model: 'Answer'
	},{
		path: 'answerList',
		model: 'Answer'
	}];	
	Question.populate(quiz.questionList[questionListIndex], options, function(err, question) {
		/* start the data migration 
			-- once this is called once for each I can get rid of handling answer1 and answer2 and take out of schema */
		if (question.answer1) {  /* TODO: take out once data migration complete */
			quiz.questionList[questionListIndex].answerList.push(question.answer1);
			quiz.questionList[questionListIndex].answer1 = null;
		}
		if (question.answer2) { /* TODO: take out once data migration complete */
			quiz.questionList[questionListIndex].answerList.push(question.answer2);
			quiz.questionList[questionListIndex].answer2 = null;
		}
		quiz.questionList[questionListIndex].save(); /* TODO: take out once data migration complete */
		quiz.save(); /* TODO: take out once data migration complete */
		callback(err, quiz);	
	});
}


exports.findQuestion = function(questionID, callback) {
	Question.findById(questionID)
		.populate('answerList')
		.exec(function(err, question) {
			if (err || !question) { return callback(new Error('Error in models.findQuestion'), null); }
			callback(null, question);
		});
}
exports.findOutcome = function(outcomeID, callback) {
	Outcome.findById(outcomeID)
		.populate('share')
		.exec(function(err, outcome) {
			if (err || !outcome) { return callback(new Error('Error in models.findOutcome'), null); }
			callback(null, outcome);
		});
}
exports.findAnswer = function(answerID, callback) {
	Answer.findById(answerID)
		.exec(function(err, answer) {
			if (err || !answer) { return callback(new Error('Error in models.findAnswer'), null); }
			callback(null, answer);
		});
}
exports.findShare = function(shareID, callback) {
	Share.findById(shareID)
		.exec(function(err, share) {
			if (err || !share) { return callback(new Error('Error in models.findShare'), null); }
			callback(null, share);
		});
}		
exports.findUser = function(userID, callback) {
	User.findById(userID)
		.populate('quizList')
		.exec(callback);
};
exports.findUserBy = function(object, callback) {
	User.findOne(object)
		.populate('quizList')
		.exec(callback);
};

exports.allUsers = function(callback){
	User.find()
		.populate('quizList')
		.exec(callback);
};
exports.allQuizes = function(callback){
	Quiz.find()
		.populate('_user')
		.populate('questionList')
		.populate('outcomeList')
		.exec(callback);
};
exports.allQuestions = function(callback){
	Question.find()
		.populate('answer1')
		.populate('answer2')
		.populate('answerList')
		.exec(callback);
};
exports.allOutcomes = function(callback){
	Outcome.find().exec(callback);
};
exports.allAnswers = function(callback){
	Answer.find().exec(callback);
};





