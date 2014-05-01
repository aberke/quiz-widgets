/* Share model */

var mongoose 			= require('mongoose'),
	mongo 				= require('./mongo.js'),
	ObjectId 			= mongo.ObjectId;

var Share = function() {
	var _model = mongo.Model('Share', {
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
	var update = function(shareID, shareData, callback) {
		_model.findById(shareID)
			.exec(function(err, share) {
				if (err || !share) { return callback(err); }

				if ("link" in shareData) 		{ share.link = shareData.link; }
				if ("caption" in shareData) 	{ share.caption = shareData.caption; }
				if ("pic_url" in shareData) 	{ share.pic_url = shareData.pic_url; }
				if ("description" in shareData) { share.description = shareData.description; }
				
				share.save(function(err) { callback(err, share); });
			});
	}
	var incrementFB = function(shareID, callback) {
		_model.update(
			{ _id: shareID }, // query
			{ $inc: { fbCount: 1 } }, {} // the update
		).exec(function(err) { callback(err); });
	}
	var incrementTwitter = function(shareID, callback) {
		_model.update(
			{ _id: shareID }, // query
			{ $inc: { twitterCount: 1 } }, {} // the update
		).exec(function(err) { callback(err); });
	}
	var create = function(shareData, callback) {
		if (!shareData._quiz && !shareData._outcome) { return callback('Share must reference _quiz or _outcome', null); }
		var share = new _model({
			_quiz: 			(shareData._quiz 		|| null),
			_outcome: 		(shareData._outcome 	|| null),
			caption: 		(shareData.caption  	|| null),
			pic_url: 		(shareData.pic_url  	|| null),
			description: 	(shareData.description  || null),
			link: 			(shareData.link 		|| null),
			fbCount: 		(shareData.fbCount 		|| 0),
			twitterCount: 	(shareData.twitterCount || 0),
		});
		share.save(function(err) { if(callback) callback(err, share); });
		return share; // for the impatient like Quiz.create()
	}
	var remove = function(shareID, callback) {
		_model.remove({ _id: shareID }).exec(callback);
	}
	return {
		create: 			create,
		remove: 			remove,
		update: 			update,
		incrementFB: 		incrementFB,
		incrementTwitter: 	incrementTwitter,

		model: 	_model,
	}
}();
module.exports = Share;