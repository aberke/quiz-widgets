// basic index tests
var Quiz = require('./../app/models/quiz-model.js');


describe('quiz widget landing page', function() {
	var ptor = protractor.getInstance();

	beforeEach(function() {
		ptor.get('/');
	});

	it('tests header', function() {
		var header = element(by.id('header'));
		expect(header.isDisplayed()).toBeTruthy();

		var nav = header.findElement(by.tagName('nav'));
		expect(nav.isDisplayed()).toBeTruthy();
	});

	describe('test quizzes show up correctly', function() {
		// TODO: BEFOREEACH -- POST QUIZ WITH CONTROLLER
		beforeEach(function() {
				var quizData = {
					_user: 'TEST-USER',
					title: 'TEST-TITLE',
					outcomeList:  		[{ _id:'0', description:'OUTCOME-0' }],
					questionList: 		[{answerList: [{ _outcome:'0' },{ _outcome:'1' }]}],
				};
		});
		// TODO: AFTEREACH == REMOVE QUIZ WITH CONTROLLER

		it('tests quiz shows up', function() {
			expect(element(by.css('.huffpostlabs-quiz')).isDisplayed()).toBeTruthy();
			expect(element(by.css('.huffpostlabs-quiz .slides-container')).isDisplayed()).toBeTruthy();
		});
	});










});