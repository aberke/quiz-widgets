/* Outcome model */


var mongo 	= require('./mongo.js'),
	ObjectId= mongo.ObjectId,

	Share   = require('./share-model.js');



var Outcome = function() {
	var _model = mongo.Model('Outcome', {
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
		rules: 		{
						min_correct: {type: Number, default: 0},
					},
	});

	var create = function(outcomeData, callback) {
		/* return the outcome so that Quiz can immediately push it to list
			in scenarios where it can't wait like Quiz.Create
		*/
		if (!outcomeData._quiz) { return callback('Outcome must reference _quiz', null); }
		var outcome = new _model({
			_quiz: 		outcomeData._quiz,
			text: 		(outcomeData.text || null),
			description:(outcomeData.description || null),
			pic_url: 	(outcomeData.pic_url || null),
			pic_style: 	(outcomeData.pic_style || null),
			pic_credit: (outcomeData.pic_credit || null)
		});
		outcome.share = Share.create({ _outcome: outcome });
		if (outcomeData.rules) {
			outcome.rules = outcomeData.rules;
		}
		outcome.save(function(err) { if(callback) callback(err, outcome); });
		return outcome;
	}
	var find = function(outcomeID, callback) {
		_model.findById(outcomeID).exec(callback);
	}
	var all = function(callback) {
		_model.find().exec(callback);
	}
	var updateShare = function(outcomeID, shareData, callback) {
		_model.findById(outcomeID).exec(function(err, outcome) {
			if (err || !outcome) { return callback(err || 'Outcome does not exist'); }
			
			if (!outcome.share) {
				Share.create(shareData, function(err, share) {
					if (err) { return callback(err); }
					outcome.share = share._id;
					outcome.save(function(err) { callback(err, share); });
				});
			} else {
				Share.update(outcome.share, shareData, callback);
			}
		});
	}
	var update = function(outcomeID, outcomeData, callback) {
		_model.findById(outcomeID).exec(function(err, outcome) {
			if (err || !outcome) { return callback(err || 'Outcome does not exist'); }
			
			outcome.text 			  = (outcomeData.text || outcome.text);
			outcome.description 	  = (outcomeData.description || outcome.description);
			outcome.pic_url 		  = (outcomeData.pic_url || outcome.pic_url);
			outcome.pic_credit  	  = (outcomeData.pic_credit || outcome.pic_credit);
			outcome.pic_style   	  = (outcomeData.pic_style || outcome.pic_style);
			outcome.rules			  = (outcomeData.rules || outcome.rules);
			outcome.save(function(err) { callback(err, outcome); });
		});
	}
	var remove = function(outcomeID, callback) {
		Share.model.remove({ _outcome: outcomeID }).exec(function (err) {
			if (err) { return callback('Share.remove err:', err);  }
			_model.remove({ _id: outcomeID }).exec(callback);
		});
	}
	return {
		find: 				find,
		all: 				all,
		create: 			create,
		remove: 			remove,
		update: 			update,
		updateShare: 		updateShare,

		// Helpful for testing
		model: 				_model,
	}
}();
exports.Outcome = Outcome;





module.exports = Outcome;