/* 
Tests for quiz-logic.js

using mocha: http://visionmedia.github.io/mocha/ 

Run tests:
	- if mocha not already installed: $ sudo npm install -g mocha
	- mocha tests all files matching pattern ./test/*.js
		- so from outside /test, run $mocha


Testing just the quiz logic - not the user experience

*/


var assert 		= require("assert"),
	quizLogic 	= require("../quiz-logic"),
	TriviaLogic = quizLogic.TriviaLogic;



describe('Trivia Quiz Logic', function() {
	var triviaQuestionList = [
		// Q1: answer2- true
		// Q2: answer2- true
		// Q3: answer3- true
			{answerList: [{correct: false},{correct: true},{correct: false},]},
			{answerList: [{correct: false},{correct: true},{correct: false},]},
			{answerList: [{correct: false},{correct: true},]},	
		];
	var triviaOutcomeList = [
			{text: 'MIN-CORRECT-0', rules: {min_correct: 0}},
			{text: 'MIN-CORRECT-1', rules: {min_correct: 1}},
			{text: 'MIN-CORRECT-3', rules: {min_correct: 3}},
		];
	var triviaQuizData = {
		'questionList': triviaQuestionList,
		'outcomeList': triviaOutcomeList,
	}
	var logic = new TriviaLogic(triviaQuizData);

	function answerCorrect(iterations) { /* answer correct iteration times */
		for (var i=0; i<iterations; i++) {
			logic.answer(1);
		}
	}
	function answerIncorrect(iterations) { /* answer correct iteration times */
		for (var i=0; i<iterations; i++) {
			logic.answer(0);
		}
	}


	/* Note that reset function automatically tested - it's in the beforeEach */
	beforeEach(function(){
		logic.reset();
	});
	describe('answer function', function() {
		it('should return answer given index', function() {
			var question1_answer1 = triviaQuizData.questionList[0]
			assert.equal(triviaQuestionList[0].answerList[0], logic.answer(0));
			assert.equal(triviaQuestionList[1].answerList[1], logic.answer(1));
			assert.equal(triviaQuestionList[2].answerList[2], logic.answer(2));
		});
		it('should return null if answer() is called past questionList length', function() {
			answerCorrect(3);
			assert.equal(null, logic.answer(2));
		});
		it('should return null if answer() is called with invalid index', function() {
			assert.equal(null, logic.answer(3));
		});
	});
	describe('outcome function', function() {
		it('should return null before quiz complete', function() {
			assert.equal(null, logic.outcome());
			logic.answer(2);
			assert.equal(null, logic.outcome());
		});
		it('handles 0 answers right where there is a matching rule', function() {
			answerIncorrect(3);
			assert.equal(triviaQuizData.outcomeList[0], logic.outcome());
		});
		it('handles 1 answer right where there is a matching rule', function() {
			answerIncorrect(2);
			answerCorrect(1);
			assert.equal(triviaQuizData.outcomeList[1], logic.outcome());
		});
		it('handles 2 answers right where there is not a matching rule', function() {
			answerIncorrect(1);
			answerCorrect(2);
			assert.equal(triviaQuizData.outcomeList[1], logic.outcome());
		});
		it('handles all answers right where there is a matching rule', function() {
			answerCorrect(3);
			assert.equal(triviaQuizData.outcomeList[2], logic.outcome());
		});
	});

	describe('correct function', function() {
		it('should know I always hit incorrect answer', function(){
			assert.equal(0, logic.correct());
			logic.answer(2);
			assert.equal(0, logic.correct());
			logic.answer(2);
			assert.equal(0, logic.correct());
			logic.answer(0);
		});
		it('should know I always hit correct answer', function(){
			for (var i=0; i<4; i++) {
				assert.equal(i, logic.correct());
				answerCorrect(1);
			}
		});
	});

});




