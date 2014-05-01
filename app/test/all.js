/* Run all the tests with mocha

*/

/* connect to mongo */
var Mongo 			= require('./../models/mongo.js'),
	DB 				= Mongo.connectDB('mongodb://localhost/quiz-widgets-test');


console.log('run all of the tests..')

/* run widget tests */
var quiz_logic_tests = require('./widget/quiz-logic_test.js');

/* run model tests */
var all_model_tests = require('./models/all-model-tests.js');	

/* run the routes tests */
var api_tests   = require('./routes/api-tests.js');
var stats_api_tests = require('./routes/stats-api-tests.js');