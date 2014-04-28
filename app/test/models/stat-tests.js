/* Test coverage for Stat model 

	Schema
	{
		_quiz: 			ObjectId,
		model_type: 	String, // ['Answer', 'Outcome', 'started','restarted','completed', other]
		model_id: 		String,
		count: 			{ type: Number, default: 0},
	}

*/


var assert 	= require('assert'),
	Stat 	= require('./../../models/stats-models.js');



describe('Stat tests', function() {
	var quizID_answer = "5356538058b5ff3faba4ba7d";
	var quizID_completed = "5356538058b5ff3faba4ba7e";
	// create dummy statData for answer
	var statData_answer = {
		_quiz: quizID_answer,
		model_type: 'Answer',
		model_id: 'ANSWER-ID',
	};
	// create dummy statData for completed
	var statData_completed = {
		_quiz: quizID_completed,
		model_type: 'completed',
		model_id: 'null',
	};

	beforeEach(function(done) {
		Stat.model.remove({}, function() {
			Stat.increment(statData_answer, done);
		});
	});

	it('finds all with Stat.findAll', function(done) {
		Stat.findAll(function(err, data) {
			assert.equal(data.length, 1);
			done(err);
		});
	});
	it('finds stats for just quiz with Stat.findByQuiz', function(done) {
		Stat.findByQuiz(quizID_completed, function(err, data) {
			assert.equal(data.length, 0);
		});
		Stat.findByQuiz(quizID_answer, function(err, data) {
			assert.equal(data.length, 1);
			done(err);
		});
	});
	it('finds just quiz related stats with Stat.findAllQuiz', function(done) {
		Stat.increment(statData_completed, function() {
			Stat.findAllQuiz(function(err, data) {
				assert.equal(data.length, 1);
				assert.equal(data[0].model_id, 'null');
				done(err);
			});
		});
	});
	it('deletes stats for given quiz with Stat.removeAllQuiz', function(done) {
		// add the stat and remove it and assert it's not there
		Stat.increment(statData_completed, function() {
			Stat.removeAllQuiz(quizID_completed, function() {
				Stat.findByQuiz(quizID_completed, function(err, data) {
					assert.equal(data.length, 0);
					done(err);
				});
			});
		});
	});

	it ('increments with Stat.increment', function(done) {
		// increment statData_answer once and statData_completed twice
		Stat.increment(statData_completed, function() {
		Stat.increment(statData_completed, function() {
			Stat.findByQuiz(quizID_completed, function(err, completedStats) {
				assert.equal(completedStats[0].count, 2);
			});
			Stat.findByQuiz(quizID_answer, function(err, answerStats) {
				assert.equal(answerStats[0].count, 1);
				done(err);
			});
		});});
	});
});