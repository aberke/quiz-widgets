/* Question and Answer models 

	Each Quiz has a questionList
	Each Question has an answerList

*/


var mongo 	= require('./mongo.js'),
	ObjectId= mongo.ObjectId;


var Question = function() {

	var _model = mongo.Model('Question', {
		_quiz: 		 {type: ObjectId, ref: 'Quiz'},
		text:  		 String,
		answerList:  [{type: ObjectId, ref: 'Answer'}],
	});
	var create = function(questionData, callback) {
		if (!callback) { callback = function() { return null; }}
		/* return new question model in addition to calling callback on save
			for cases when question must be pushed to questionList immediately,
			such as in Quiz.create
		*/
		if (!questionData._quiz) { return callback('Question must reference _quiz', null); }
		if (!questionData.answerList || !questionData.answerList.length) { return callback('Question must have Answers in AnswerList', null); }
		var question = new _model({
			_quiz: 	(questionData._quiz),
			text: 	(questionData.text || null),
		});

		var numCalled = 0; // tally up the number of mongo functions we're waiting on before can call callback
		var totalCalls = 0; // +1 for each question in questionList and quiz.outcomeList.share
		/* complete callback when all calls have executed OR when there is an error */
		var call = function(err, answer) {
			numCalled += 1;
			if (err) { return callback(err); }
			question.answerList.push(answer);
			if (numCalled >= totalCalls) {
				question.save(function(err) { callback(err, question); });
			}
		}
		for(var i=0; i<questionData.answerList.length; i++) {
			totalCalls += 1;
			questionData.answerList[i]._question = question._id;
			Answer.create(questionData.answerList[i], call);
		}
		return question;
	}
	var all = function(callback) {
		_model.find()
			.populate('AnswerList')
			.exec(callback);
	}
	var find = function(questionID, callback) {
		_model.findById(questionID)
			.populate('answerList')
			.exec(callback);
	}
	var remove = function(questionID, callback) {
		Answer.model.remove({ _question: questionID }).exec(function(err) {
			if (err) { return callback(err); }
			_model.remove({ _id: questionID }).exec(callback);
		});
	}
	var update = function(questionID, questionData, callback) {
		_model.findById(questionID)
			.populate('answerList')
			.exec(function(err, question) {
			if (err || !question) { return callback(err || "Question does not exist"); }

			console.log('questionData', questionData)
			question.text = (questionData.text || question.text);
		
			var numCalled = 0; // tally up the number of mongo functions we're waiting on before can call callback
			var totalCalls = 0; // +1 for each question in questionList and quiz.outcomeList.share
			/* complete callback when all calls have executed OR when there is an error */
			var call = function(index) {
				return function(err, answer) {
					numCalled += 1;
					if (err) { return callback(err); }
					if (index < 0) {
						question.answerList.push(answer);
					} else {
						question.answerList[index] = answer;
					}
					if (numCalled >= totalCalls) {
						question.save(function(err) { callback(err, question); });
					}
				}
			}
			for(var i=0; i<questionData.answerList.length; i++) {
				totalCalls += 1;
				if (!questionData.answerList[i]._id) {
					questionData.answerList[i]._question = questionID;
					Answer.create(questionData.answerList[i], call(-1));
				} else {
					Answer.update(questionData.answerList[i]._id, questionData.answerList[i], call(i));
				}
			}

		});
	}
	var addAnswer = function(questionID, answerData, callback) {
		_model.findById(questionID).exec(function(err, question) {
			if (err || !question) { return callback(err || "Question does not exist"); }

			answerData._question = questionID;
			Answer.create(answerData, function(err, answer) {
				if (err) { return callback(err); }
				question.answerList.push(answer._id);
				question.save(function(err) { callback(err, answer); });
			});
		});
	}
	var removeAnswer = function(questionID, answerID, callback) {
		_model.findById(questionID).exec(function(err, question) {
			if (err || !question) { return callback(err || "Question does not exist"); }

			var index = question.answerList.indexOf(answerID);
			if (index < 0) { return callback("Question does not own Answer " + answerID); }
			Answer.remove(answerID, function(err) {
				if (err) { return callback(err); }
				question.answerList.splice(index, 1);
				question.save(callback);
			});
		});		
	}

	return {
		create: 		create,
		all: 			all,
		find: 			find,
		remove: 		remove,
		update: 		update,

		addAnswer: 		addAnswer,
		removeAnswer: 	removeAnswer,

		// used by Testing
		model:  _model,
	}
}();
var Answer = function() {
	/* Answer for Quizzes of type 'default-quiz' all must point to an outcome
		for 'trivia-quiz', they do not point to an outcome, and are either correct or not correct
	*/
	var _model = mongo.Model('Answer', {
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

	var create = function(answerData, callback){
		if (!callback) { callback = function() { return null; }}
		if (!answerData._question) { return callback('Answer must refer to _question', null); }
		var answer = new _model({
			_question: 	answerData._question,
			_outcome: 	(answerData._outcome 	|| null),
			text: 		(answerData.text 		|| null),
			pic_url: 	(answerData.pic_url 	|| null),
			pic_style: 	(answerData.pic_style	|| null),
			pic_credit: (answerData.pic_credit	|| null),
			correct: 	(answerData.correct 	|| false),
		});
		answer.save(function(err) { callback(err, answer); });
	}
	var remove = function(answerID, callback) {
		_model.remove({ _id: answerID }).exec(callback);
	}
	var update = function(answerID, answerData, callback) {
		_model.findById(answerID).exec(function(err, answer) {
			if (err || !answer) { return callback(err || "No such Answer " + answerID); }

			answer.text 	  = (answerData.text 		|| answer.text);
			answer.pic_url 	  = (answerData.pic_url 	|| answer.pic_url);
			answer.pic_credit = (answerData.pic_credit 	|| answer.pic_credit);
			answer.pic_style  = (answerData.pic_style 	|| answer.pic_style);
			answer._outcome   = (answerData._outcome 	|| answer._outcome);
			answer.correct    = (answerData.correct		|| answer.correct);
			answer.save(function(err) { callback(err, answer); });
		});
	}
	var all = function(callback) {
		_model.find().exec(callback);
	}

	return {
		all: 				all,
		create: 			create,
		remove: 			remove,

		update: 			update,

		// Helpful for testing and used by Question
		model: 				_model,
	}
}();
exports.Answer = Answer;
exports.Question = Question;

