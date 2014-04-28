
var mongo 	= require('./mongo.js'),
	ObjectId= mongo.ObjectId,
	Schema  = mongo.Schema;


var User = function() {

	var _model = mongo.Model('User', {
		twitter_id: 			{type: String, default: null},
		twitter_username: 		{type: String, default: null},
		twitter_displayname: 	{type: String, default: null},
		date_created: 			{ type: Date, default: Date.now },
		quizList: 				[{ type: ObjectId, ref: 'Quiz' }], // need to push quiz on to user upon quiz creation)
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

module.exports = User();




