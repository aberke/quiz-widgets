
var mongooseConfig = {
	url: process.env.DOTCLOUD_DB_MONGODB_URL || process.env.LOCAL_MONGODB_URL,
	login: process.env.DOTCLOUD_DB_MONGODB_LOGIN || null,
	pass: process.env.DOTCLOUD_DB_MONGODB_PASSWORD || null
};

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;

mongoose.connect(mongooseConfig.url);
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'mongoose database connection error:'));
db.once('open', function callback () {
  console.log('mongoose database open... YAY');
});


var userSchema = new Schema({
	twitter_id: 	String,
	twitter_name: 	String,
	date_created: 	{ type: Date, default: Date.now },
	quizList: 		[{ type: ObjectId, ref: 'Quiz' }] // need to push quiz on to user upon quiz creation)
});

var quizSchema = new Schema({
	_user: {type: ObjectId, ref: 'User'},
	title: {type: String, default: null},
	date_created: { type: Date, default: Date.now },
	questionList: [{ type: ObjectId, ref: 'Question' }],
	outcomeList:  [{ type: ObjectId, ref: 'Outcome' }],
});

var questionSchema = new Schema({
	_quiz: 		 {type: ObjectId, ref: 'Quiz'},
	index: 		 Number, // questions are ordered
	text:  		 String,
	answer1: 	 { type: ObjectId, ref: 'Answer'},
	answer2: 	 { type: ObjectId, ref: 'Answer'},
});

var outcomeSchema = new Schema({
	_quiz:  	 {type: ObjectId, ref: 'Quiz'},
	index: 		 Number, // ordered
	text:   	 String,
	pic_url: 	 String,
	count:  	 Number, // number of times its been the outcome
});
var answerSchema = new Schema({
	_quiz:  	{type: ObjectId, ref: 'Quiz'},
	_outcome: 	{type: ObjectId, ref: 'Outcome'}, // the outcome it adds a point to if selected
	text:   	String,
	pic_url: 	String,
	count:  	Number, // number of times it's been picked
});













