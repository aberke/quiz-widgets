/* Slide Model

	When a Quiz needs an extra slide that is not an Outcome or Answer slide
		- Quiz.extraSlide
		- currently only used as answer-key in trivia-quiz's
*/

var mongo 	= require('./mongo.js'),
	ObjectId= mongo.ObjectId;



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
	var update = function(slideID, slideData, callback) {
		_model.findById(slideID, function(err, slide) {
			if (err || !slide) { return callback(err || 'No such Slide ' + slideID); }
			if ("blob" in slideData) { slide.blob = slideData.blob; }
			slide.save(function(err) { callback(err, slide); });
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
module.exports = Slide;