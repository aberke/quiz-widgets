/* Question and Answer models 

	Each Quiz has a questionList
	Each Question has an answerList

*/


var mongo 	= require('./mongo.js'),
	ObjectId= mongo.ObjectId,
	Schema  = mongo.Schema;


var Answer = function() {

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

	var create = function(userData, callback) { // userData is twitter profile info object	
		var user = new _model({
			twitter_id: 			userData.id,
			twitter_username: 		userData.username,
			twitter_displayname: 	userData.displayName,
		});
		user.save(function(err) { callback(err, user); });
	}
	var findByTwitterID = function(id, callback) {
		_model.findOne({twitter_id: id})
			.exec(callback);
	}		
	var find = function(userID, callback) {
		_model.findById(userID)
			.exec(callback);
	};
	var all = function(callback){
		_model.find()
			.exec(callback);
	};
	/* used in Quiz.create() when new quiz saved */
	var addQuiz = function(userID, quizID, callback) {
		_model.findById(userID)
			.exec(function(err, user) {
				if (err || !user) { return callback(err, null); }
				if (user.quizList.indexOf(quizID) > -1) { return callback('User with _id '+userID+' already owns quiz with _id ' + quizID, null); }
				
				user.quizList.push(quizID);
				user.save(function(err) { callback(err, user); });
			});
	}
	var removeQuiz = function(userID, quizID, callback) {
		_model.findById(userID)
			.exec(function(err, user) {
				if (err || !user) { return callback(err, null); }
				
				var index = user.quizList.indexOf(quizID);
				if (index < 0) { return callback('quiz _id ' + quizID + ' not owned by user with _id ' + userID, null); }
				
				user.quizList.splice(index, 1);
				user.save(function(err) { callback(err, user); });
			})
	}
	var quizzes = function(userID, callback) {
		Quiz.find({_user: userID})
			.populate('_user')
			.populate('questionList')
			.populate('outcomeList')
			.exec(callback);
	}

	return {
		all: 				all,
		find: 				find,
		create: 			create,
		addQuiz: 			addQuiz,
		removeQuiz: 		removeQuiz,
		findByTwitterID: 	findByTwitterID,

		// Helpful for testing
		model: 				_model,
	}
};

module.exports = {
	//Question: Question(),
	Answer:   Answer(),
};

