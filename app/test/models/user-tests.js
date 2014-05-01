/* tests for User model 
	Schema:
	{
		twitter_id: 			{type: String, default: null},
		twitter_username: 		{type: String, default: null},
		twitter_displayname: 	{type: String, default: null},
		date_created: 			{ type: Date, default: Date.now },
		quizList: 				[{ type: ObjectId, ref: 'Quiz' }], // need to push quiz on to user upon quiz creation)
	}

	Tests each of the public facing functions of User
		- User.create 			-- implictely tested by use in the beforeEach
		- User.model (property) -- implicitely tested by use in the afterEach
		- user.all
		- User.find
		- User.findByTwitterID
		- User.addQuiz
		- User.removeQuiz
*/

var assert 	= require('assert'),
	User 	= require('./../../models/user-model.js');



describe('User tests', function() {
	var currentUser = null;

	beforeEach(function(done) {
		User.model.remove({}, done);
	});
	beforeEach(function(done) {
		User.create({
			id: 'TEST-USER-TWITTER-ID', //
			username: 'TEST-TWITTER-USERNAME',
			displayName: 'TEST-TWITTER-DISPLAYNAME',
		}, function(err, doc) {
			currentUser = doc;
			done(err);
		});
	});



	it('User.all finds all users', function(done) {
		User.all(function(err, docs) {
			assert.equal(docs.length, 1);
			done(err);
		});
	});
	it('User.find finds user by id', function(done) {
		User.find(currentUser._id, function(err, doc) {
			assert.equal(doc.twitter_id, currentUser.twitter_id);
			assert.equal(doc.twitter_username, currentUser.twitter_username);
			assert.equal(doc.twitter_displayname, currentUser.twitter_displayname);
			assert.equal(doc.quizList.length, 0);
			done(err);
		});
	});
	it('User.findByTwitterID finds user by twitter-id', function(done) {
		User.findByTwitterID(currentUser.twitter_id, function(err, doc) {
			assert.equal(doc.twitter_username, currentUser.twitter_username);
			done(err);
		});
	});
	describe ('add and remove quizzes from quizList', function(done) {
		// dummy ObjectId needs to resemble a real _id
		var quizID = '532afd1f776c59000007f2a2';

		beforeEach(function(done) {
			User.addQuiz(currentUser._id, quizID, done);
		});

		it('User.addQuiz adds quiz to quizList', function(done) {
			User.find(currentUser._id, function(err, doc) {
				assert.equal(doc.quizList.length, 1);
				assert.equal(doc.quizList[0], '532afd1f776c59000007f2a2');
				done(err);
			})
		});
		it('User.removeQuiz remove quiz from quizList', function(done) {
			User.removeQuiz(currentUser._id, quizID, function(err, doc) {
				User.find(currentUser._id, function(err, doc) {
					assert.equal(doc.quizList.length, 0);
					done(err);
				});
			});
		});
	});
});