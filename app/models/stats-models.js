
var mongo 	= require('./mongo.js'),
	ObjectId= mongo.ObjectId;



var Stat = function() {
	/* Stat exists for each model logged and then stats for quizzes
		model_type refers to type of that model
			Answer stats -- model_type = 'Answer'
			Outcome stats - model_type = 'Outcome'
			Quiz stats 	  - model_type = 'started'/'restarted'/'completed'
	
		Read more in routes/stats-api.js
	*/
	var _model = mongo.Model('Stat', {
		_quiz: 			ObjectId,
		model_type: 	String, // ['Answer', 'Outcome', 'started','restarted','completed', other]
		model_id: 		String,
		count: 			{ type: Number, default: 0},
	});

	var findAll = function(callback) {
		_model.find()
			.exec(callback);
	}
	var findByQuiz = function(quizID, callback) {
		_model.find({ _quiz: quizID })
			.exec(callback);
	}
	var findAllQuiz = function(callback) {
		/* return all quiz stats (where model is quiz) */
		_model.find({ model_id: "null" })
			.exec(callback);

	}
	/* called by Quiz.remove -- remove all stats belonging to quiz */
	var removeAllQuiz = function(quizID, callback) {
		_model.remove({ _quiz: quizID })
			.exec(callback);
	}
	var increment = function(statData, callback) {
		_model.update(
			{ 	_quiz: statData._quiz,
				model_type: statData.model_type, 
				model_id: statData.model_id
			}, // query
			{ $inc: { count: 1 } }, // the update
			{ upsert: true} // if you don't find it, create it
		).exec(callback);
	}

	return {
		findAll: 	 	findAll,
		findByQuiz:  	findByQuiz,
		findAllQuiz: 	findAllQuiz,
		removeAllQuiz: 	removeAllQuiz,
		increment: 	 	increment,

		model: 			_model,
	}
}();
module.exports = Stat;


