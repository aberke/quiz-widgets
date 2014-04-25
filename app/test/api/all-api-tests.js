/* API tests */

var assert 			= require("assert"),
	http 			= require("http"),



	User 			= require('./../models/user-model.js'),

	server  		= require('./../server.js'),
	port 			= 3337,
	session_cookie 	= null; // set it later


/* ------------ run stats-api tests ---------------- */
var stats_api_tests = require('./stats-api-tests.js');



/* HELPER ---------------------------------------- */


function defaultOptions(path, method) {
	var options = {
		"host": "localhost",
		"port": port,
		"path": path,
		"method": method,
		"headers": {
			"Cookie": session_cookie,
		}
	};
	return options;
}
function GETdata(path, callback) {
	var headers = defaultOptions(path, "GET");		
	http.get(headers, function(res) {
		assert.equal(res.statusCode, 200);
		res.on('data', function (d) {
			var body = JSON.parse(d.toString('utf8'));
			callback(body);
		});
	});	
}
function POSTdata(path, data, callback) {
	var qstring = JSON.stringify(data);
	var options = defaultOptions(path, 'POST');
	var req = http.request(options, function (res) {
		res.on('data', function (d) {
			var body = JSON.parse(d.toString('utf8'));
			callback(body);
		});
	});
	req.write(qstring);
	req.end();
}
/* ---------------------------------------- HELPER */

describe('API', function() {
	var user = null;
	var userID = null;
	var quiz = null;
	var quizID = null;

	/* add user and quiz
		 can only create users through model or middleware (not API)
	*/
	beforeEach(function(done) {
		// must add user before can add quiz since quiz created with _user
		var fakeTwitterProfile = {
			id: 			'TEST-TWITTER-ID',
			username: 		'TEST-USERNAME',
			displayName: 	'TEST-DISPLAYNAME',
		};
		User.create(fakeTwitterProfile, function(err, doc) {
			user = doc;
			userID = doc._id.toString();

			var quizData = {
				_user: 		  		userID,
				title: 		  		'TEST-QUIZ-TITLE',
				questionList: 		[],
				outcomeList:  		[],
			};
			// console.log('POSTdata', quizData)
			// POSTdata('/api/quiz', quizData, function(retData) {
			// 	console.log('retData',retData)
			// });

			done(err);
		});
	});
	afterEach(function(done) {
		User.model.remove({}, done);
	});

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

 

	it('should be listening at localhost:' + port, function(done) {
		var headers = defaultOptions('/api/qwe', 'GET');
		http.get(headers, function (res) {
			assert.equal(res.statusCode, 404);
			done();
		});
	});

	describe('user', function() {
		it('/api/user/all returns all users -- only user is default TEST user', function(done) {		
			GETdata('/api/user/all', function(data) {
				assert.equal(data.length, 1);
				assert.equal(data[0]._id, userID);
				done();
			});
		});
		it('/api/user/:id returns user by _id', function(done) {
			GETdata('/api/user/' + userID, function(data) {
				assert.equal(data._id, userID);
				done();
			});
		});
		it('/api/user/:id/quizzes returns user quizzes', function(done) {
			GETdata('/api/user/' + userID + '/quizzes', function(data) {
				assert.equal(data.quizList, []);
				done();
			});
		});
	});

	describe('changing ownership of quiz', function() {

	});

});

