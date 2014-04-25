/* stats API for quiz 

	Any count regarding a quiz is stored in a model:

		var statSchema = new Schema({
			_quiz: 			ObjectId,
			model_type: 	String, // ['Answer', 'Outcome', 'started-count','restarted','completed', other]
			model_id: 		String, // _id of model, or 'null' (if for 'started', 'restarted-count', or 'completed')
			count: 			{ type: Number, default: 0},
		});

		- I make the assumption that no model_id will be repeated (reasonable assumption -- probability is crazy low and even lower that they would belong to same _quiz)

	All stats are updated with a PUT request
		- update with upsert
	
	- Advantage of separation into this model:
		don't lock any other models when writing to stats
			- there is a write lock per collection -- so keep this in separate collection
			- reads also blocked on writes to collection
				- often write to stats, rarely read
				- when i read from quiz, don't want database locked due to stats logging

*/


var util 		= require('./common-util.js'),
	Stat 		= require('./../models/stats-models.js');



var StatsAPIroutes = function(app) {

	var _registerEndpoints = function (app) {
		app.get('/stats/all', GETallStats);
		app.get('/stats/all/quiz', GETallStatsQuiz); // all stats where model is quiz
		app.get('/stats/:quizID/all', GETquizStats);
		

		/* The problem:
				-- how to PUT completions for the most items at once in one request
						- more in 1 request == less load on server when a quiz goes viral
				-- max URL length is 2000 characters and must leave room for JSONP stuff
			The plan:
				-- make PUTs like /stats/:quizID/increment/Outcome_outcomeID-Answer_answerID-Answer_answerID...etc
		*/
		/* consider this a PUT -- GET requests because they're with JSONP */
		app.get('/stats/:quizID/increment/:data', PUTincrementData);
	}

	var GETallStats = function(req, res) {
		Stat.findAll(util.sendDataOrError(res));
	}
	var GETallStatsQuiz = function(req, res) {
		Stat.findAllQuiz(sendDataOrError(res));
	}
	var GETquizStats = function(req, res) {
		Stat.findByQuiz(req.params.quizID, util.sendDataOrError(res));
	};
	var PUTincrementData = function(req, res) {
		var quizID = req.params.quizID;
		var dataString = (req.params.data || '');
		var dataTuples = _parseData(dataString);

		for (var i in dataTuples) {
			var tuple = dataTuples[i];
			var statData = {
				_quiz: 		quizID,
				model_id: 	tuple[1],
				model_type: tuple[0],
			}
			/* do nothing on success, and just yell really loud on fail */
			Stat.increment(statData, function(err, data){ if (err) { util.handleError(err); }});
		}
		res.send(200, dataTuples);
	}
	/*  parameter: raw dataString
		output:    list of 'tuples' [model_type, model_id]
	*/
	var _parseData = function(dataString) {
		var dataTuples = [];
		var dataArray  = dataString.split('-');
		for ( var i=0; i<dataArray.length; i++ ) {
			var d = dataArray[i].split('_');
			if (d.length == 2) { // if we actually have a type_id pair
				var type   = d[0];
				var id 	   = d[1];
				dataTuples.push([type, id]);
			}
		}
		return dataTuples;
	}


	_registerEndpoints(app);
}
module.exports = StatsAPIroutes;



