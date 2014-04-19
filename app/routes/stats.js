/* stats API for quiz 

	Any count regarding a quiz is stored in a model:

		var statSchema = new Schema({
			_quiz: 			ObjectId,
			model_type: 	String, // ['Answer', 'Outcome', 'started-count','restarted-count','completed-count', other]
			model_id: 		String, // _id of model, or 'null' (if for 'started-count', 'restarted-count', or 'completed-count')
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


var util 		= require('./../util.js'),
	Stat 		= require('./../models.js').Stat;





exports.registerEndpoints = function (app) {
	app.get('/stats/all', GETallStats);
	app.get('/stats/all/quiz', GETallStatsQuiz); // all stats where model is quiz
	app.get('/stats/:quizID/all', GETquizStats);
	

	/* The problem:
			-- how to PUT completions for the most items at once in one request
					- more in 1 request == less load on server when a quiz goes viral
			-- max URL length is 2000 characters and must leave room for JSONP stuff
		The plan:
			-- make PUTs like /stats/:quizID/increment/outcome-outcomeID-answer-answerID-answer-answerID...etc
	*/
	app.put('/stats/:quizID/increment/:data', PUTincrementData);
	/* JSONP hacks -- these are GET requests because they're with JSONP */
	app.get('/stats/:quizID/increment/:data', PUTincrementData);
}


var GETallStats = function(req, res) {
	Stat.find()
		.exec(function(err, stats) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.send(stats);
		});
}
var GETallStatsQuiz = function(req, res) {
	Stat.find({ model_id: "null" })
		.exec(function(err, stats) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.send(stats);
		});
}
var GETquizStats = function(req, res) {
	Stat.find({ _quiz: req.params.quizID })
		.exec(function(err, stats) {
			if (err) { return res.send(500, util.handleError(err)); }
			res.send(stats);
		});
};


/*  parameter: raw dataString
	output:    list of 'tuples' [model_type, model_id]
*/
var parseData = function(dataString) {
	var dataTuples = [];
	var dataArray  = dataString.split('-');
	for ( var i=0; i<dataArray.length; i+=2 ) {
		var type   = dataArray[i];
		var id 	   = dataArray[i+1];
		dataTuples.push([type, id]);
	}
	return dataTuples;
}

var PUTincrementData = function(req, res) {
	var quizID = req.params.quizID;
	var dataString = (req.params.data || '');
	var dataTuples = parseData(dataString);

	for (var i in dataTuples) {
		var tuple = dataTuples[i];
		model_type = tuple[0];
		model_id = tuple[1];

		Stat.update(
				{ _quiz: quizID, model_type: model_type, model_id: model_id}, // query
				{ $inc: { count: 1 } }, // the update
				{ upsert: true} // AKA if you don't find it, create it
			).exec(util.handleError);
	}
	res.send(200, dataTuples);
}
/*
	var statSchema = new Schema({
		_quiz: 			ObjectId,
		model_type: 	String, // ['Answer', 'Outcome', 'started','restarted','completed', other]
		model_id: 		String, // _id of model, or 'null' (if for 'started', 'restarted', or 'completed')
		count: 			{ type: Number, default: 0},
	});
*/

















