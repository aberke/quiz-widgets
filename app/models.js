
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
	twitter_id: 	String,
	twitter_name: 	String,
	date_created: 	{ type: Date, default: Date.now },
	quizList: 		[{ type: ObjectId, ref: 'Quiz' }] // need to push quiz on to user upon quiz creation)
});
var shareSchema = new Schema({
	/* The share model is either owned by a Quiz or an Outcome, since both are sharable */
	_quiz: 				{type: ObjectId, ref: 'Quiz', default: null},
	_outcome: 			{type: ObjectId, ref: 'Outcome', default: null}, 
	caption: 			{type: String, default: null},
	pic_url: 			{type: String, default: null},
	description:  		{type: String, default: null},
	/* for stats */
	fbCount: 	{ type: Number, default: 0},
	twitterCount:{ type: Number, default: 0},
})
var quizSchema = new Schema({
	_user: 		  		{type: ObjectId, ref: 'User', default: null},
	title: 		  		{type: String, default: null},
	pic_url: 	  		{type: String, default: null},
	date_created: 		{ type: Date, default: Date.now },
	questionList: 		[{ type: ObjectId, ref: 'Question' }],
	outcomeList:  		[{ type: ObjectId, ref: 'Outcome' }],
	share: 				{type: ObjectId, ref: 'Share', default: null},
	
	startedCount: 		{ type: Number, default: 0},
	completedCount: 	{ type: Number, default: 0},

});
var questionSchema = new Schema({
	_quiz: 		 {type: ObjectId, ref: 'Quiz'},
	index: 		 Number, // questions are ordered
	text:  		 String,
	answer1: 	 { type: ObjectId, ref: 'Answer'},
	answer2: 	 { type: ObjectId, ref: 'Answer'},
});
var outcomeSchema = new Schema({
	_quiz:  	 {type: ObjectId, ref: 'Quiz'},
	share: 		 {type: ObjectId, ref: 'Share', default: null},
	index: 		 Number, // ordered
	text:   	 String,
	pic_url: 	 String,
	count:  	 { type: Number, default: 0}, // number of times its been the outcome
});
var answerSchema = new Schema({
	_question:  {type: ObjectId, ref: 'Question'},
	_outcome: 	{type: ObjectId, ref: 'Outcome'}, // the outcome it adds a point to if selected
	text:   	String,
	pic_url: 	String,
	count:  	{ type: Number, default: 0}, // number of times it's been picked
});

exports.User 	 = User  	= mongoose.model('User', userSchema);
exports.Quiz 	 = Quiz 	= mongoose.model('Quiz', quizSchema);
exports.Share 	 = Share 	= mongoose.model('Share', shareSchema);
exports.Answer   = Answer 	= mongoose.model('Answer', answerSchema);
exports.Question = Question = mongoose.model('Question', questionSchema);
exports.Outcome  = Outcome  = mongoose.model('Outcome', outcomeSchema);


var newAnswer = function(answerData, question, outcomeDict) {
	var answer = new Answer({
		_question:  question,
		_outcome: 	outcomeDict[answerData.outcome.index], // the outcome it adds a point to if selected
		text:   	answerData.text,
		pic_url: 	answerData.pic_url,
	});
	return answer;
}
exports.newShare = function(quiz, outcome, shareData, callback) { // callback: function(err, data)
	/* a share is owned by either a quiz or an outcome.  so either quiz or outcome is null */
	var share = new Share({
		_quiz: 		quiz,
		_outcome: 	outcome,
		caption: 	(shareData.caption || null),
		description:(shareData.description || null),
		pic_url: 	(shareData.pic_url || null)
	});
	share.save(function(err) {
		if (err) { return callback(err, null); }
		callback(null, share);
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
		//_user: ?
		title: 		  quizData.title,
		pic_url: 	  quizData.pic_url,
	});
	var newShare = new Share({_quiz: newQuiz});
	newShare.save();
	newQuiz.share = newShare;

	var outcomeDict = {}; // maps {index: outcome} since answerData just has the index
	for (var i=0; i<quizData.outcomeList.length; i++) {
		var outcomeData = quizData.outcomeList[i];
		var newOutcome = new Outcome({
			_quiz:  	 newQuiz,
			index: 		 outcomeData.index, // ordered
			text:   	 outcomeData.text,
			pic_url: 	 outcomeData.pic_url,
		});
		outcomeDict[outcomeData.index] = newOutcome;
		newQuiz.outcomeList.push(newOutcome);
		newOutcome.save();
	}
	console.log('\n\noutcomeDict', outcomeDict)
	for (var i=0; i<quizData.questionList.length; i++) {
		var questionData = quizData.questionList[i];
		var newQuestion = new Question({
			_quiz:  	 newQuiz,
			index: 		 questionData.index, // ordered
			text:   	 questionData.text,
		});

		var newAnswer1 = newAnswer(questionData.answer1, newQuestion, outcomeDict);
		newAnswer1.save();
		newQuestion.answer1 = newAnswer1;

		var newAnswer2 = newAnswer(questionData.answer2, newQuestion, outcomeDict);
		newAnswer2.save();
		newQuestion.answer2 = newAnswer2;

		console.log('\n\noutcome', newQuestion)
		newQuestion.save();
		newQuiz.questionList.push(newQuestion);
	}
	console.log('\n\n111111 newQuiz', newQuiz)
	newQuiz.save(function(err) {
		if (err) { return callback(err, null); }
		callback(null, newQuiz)
	});
}

exports.findQuiz = function(quizID, callback) {
	/* get FULLY POPULATED quiz */
	Quiz.findById(quizID)
		.populate('outcomeList')
		.populate('questionList')
		.populate('share')
		.exec(function(err, quiz) {
			if (err || !quiz) { return callback(new Error('Error in models.findQuiz'), null); }

			var options = [{
				path: 'questionList.answer1',
				model: 'Answer'
			},{
				path: 'questionList.answer2',
				model: 'Answer'
			},{
				path: 'outcomeList.share',
				model: 'Share'
			}];

			Quiz.populate(quiz, options, function(err, data) {
				if (err || !data) { return callback(new Error('Error in models.findQuiz'), null); }
				
				callback(null, quiz)
			});
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


exports.allUsers = function(callback){
	User.find()
		.populate('quizList')
		.exec(callback);
};
exports.allQuizes = function(callback){
	Quiz.find()
		.populate('questionList')
		.populate('outcomeList')
		.exec(callback);
};
exports.allQuestions = function(callback){
	Question.find()
		.populate('answer1')
		.populate('answer2')
		.exec(callback);
};
exports.allOutcomes = function(callback){
	Outcome.find().exec(callback);
};
exports.allAnswers = function(callback){
	Answer.find().exec(callback);
};





