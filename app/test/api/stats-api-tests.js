/* test coverage for stats-api 



*/

var assert 			= require("assert"),
	http 			= require("http"),


	Stat 			= require('./../../models/stats-models.js'),

	server  		= require('./../../server.js'),
	port 			= 3337,
	session_cookie 	= null; // set it later


/* ------------ run stats-api tests ---------------- */
var stats_api_tests = require('./stats-api-tests.js');



/* HELPER ---------------------------------------- */


function options(path, method) {
	return {
		"host": "localhost",
		"port": port,
		"path": path,
		"method": "GET",
	};
}
function request(path, callback) {
	var headers = options(path, "GET");		
	http.get(headers, function(res) {
		assert.equal(res.statusCode, 200);
		res.on('data', function (d) {
			var body = JSON.parse(d.toString('utf8'));
			callback(body);
		});
	});	
}
/* ---------------------------------------- HELPER */

describe('stats-API', function() {
	var quizID = "5356538058b5ff3faba4ba7d";
	var outcomeID = "5356538058b5ff3faba4ba7f";
	var answerIDlist = [
		"5356538058b5ff3faba4ba7g",
		"5356538058b5ff3faba4ba7h",
		"5356538058b5ff3faba4ba7i",
	];
	
	// start server before -- close server after
	beforeEach(function (done) {
		server.listen(port, function (err) {
			console.log('\nAPI test server listening on port ' + port + '\n');
			done(err);
		});
	});
	afterEach(function() {
		server.close();
	});
	//clear out all the existing stats for our quizID
	beforeEach(function(done) {
		Stat.model.remove({ _quiz: quizID }, done);
	});

	it('increments started count', function(done) {
		// increment started count twice 
		request('/stats/' + quizID + '/increment/started_null', function(data) {
		request('/stats/' + quizID + '/increment/started_null', function(data) {
			request('/stats/' + quizID + '/all', function(data) {
				assert.equal(data.length, 1);
				var stat = data[0];
				assert.equal(stat.model_id, 'null');
				assert.equal(stat.model_type, 'started');
				assert.equal(stat.count, 2);
				done();
			});
		});});
	});
	it ('increments completed count', function(done) {
		// increment count twice 
		request('/stats/' + quizID + '/increment/completed_null', function(data) {
		request('/stats/' + quizID + '/increment/completed_null', function(data) {
			request('/stats/' + quizID + '/all', function(data) {
				assert.equal(data.length, 1);
				var stat = data[0];
				assert.equal(stat.model_id, 'null');
				assert.equal(stat.model_type, 'completed');
				assert.equal(stat.count, 2);
				done();
			});
		});});
	});
	it ('increments restarted count', function(done) {
		// increment count twice 
		request('/stats/' + quizID + '/increment/restarted_null', function(data) {
		request('/stats/' + quizID + '/increment/restarted_null', function(data) {
			request('/stats/' + quizID + '/all', function(data) {
				assert.equal(data.length, 1);
				var stat = data[0];
				assert.equal(stat.model_id, 'null');
				assert.equal(stat.model_type, 'restarted');
				assert.equal(stat.count, 2);
				done();
			});
		});});
	});
	it ('increments outcome count', function(done) {
		// increment count twice 
		request('/stats/' + quizID + '/increment/Outcome_' + outcomeID, function(data) {
		request('/stats/' + quizID + '/increment/Outcome_' + outcomeID, function(data) {
			request('/stats/' + quizID + '/all', function(data) {
				assert.equal(data.length, 1);
				var stat = data[0];
				assert.equal(stat.model_id, outcomeID);
				assert.equal(stat.model_type, 'Outcome');
				assert.equal(stat.count, 2);
				done();
			});
		});});
	});
	it ('increments answers counts', function(done) {
		var dataString = ("/stats/" + quizID+ "/increment/");
		for (var i=0; i<answerIDlist.length; i++) {
			dataString += ("-Answer_" + answerIDlist[i]);
		}
		// increment count twice 
		request(dataString, function(data) {
		request(dataString, function(data) {
			request('/stats/' + quizID + '/all', function(data) {
				assert.equal(data.length, answerIDlist.length);
				var stat = data[0];
				assert.equal(stat.model_type, 'Answer');
				assert.equal(stat.count, 2);
				done();
			});
		});});
	});
	it('makes full completed PUT', function(done) {
		/* 3 x increment counts for quiz, outcome and each chosenAnswer */
		var dataString = ("/stats/" + quizID + "/increment/");
		dataString+= ("completed_null");
		dataString+= ("-Outcome_" + outcomeID);
		for (var i=0; i<answerIDlist.length; i++) {
			dataString+= ("-Answer_" + answerIDlist[i]);
		} 
		request(dataString, function(data) {
		request(dataString, function(data) {
		request(dataString, function(data) {
			request('/stats/' + quizID + '/all', function(data) {
				assert.equal(data.length, answerIDlist.length + 2);
				for (var j=0; j<data.length; j++) {
					// TODO: LOOK UP LIST CHECKER
					//assert.inList(data[j].model_type, ['Answer','Outcome','completed'])
					assert.equal(data[j].count, 3);
				}
				done();
			});
		});});});
	});
	it ('retrieves all stats and all quiz stats as different items', function() {
		var dataString = ("/stats/" + quizID + "/increment/");
		dataString+= ("completed_null");
		dataString+= ("-Outcome_" + outcomeID);
		for (var i=0; i<answerIDlist.length; i++) {
			dataString+= ("-Answer_" + answerIDlist[i]);
		} 
		request(dataString, function(data) {
		request(dataString, function(data) {
		request(dataString, function(data) {
			request('/stats/all/quiz', function(data) {
				assert.equal(data.length, answerIDlist + 1);
			});
			request('/stats/all', function(data) {
				assert.equal(data.length, answerIDlist.length + 2);
				done();
			});
		});});});
	});
});