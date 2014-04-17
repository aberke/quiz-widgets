/* 
Tests for quiz-logic.js

using mocha: http://visionmedia.github.io/mocha/ 

Run tests:
	- if mocha not already installed: $ sudo npm install -g mocha
	- mocha tests all files matching pattern ./test/*.js
		- so from outside /test, run $mocha


Testing just the quiz logic - not the user experience

*/


var assert 				= require("assert"),
	quizLogic 			= require("./../quiz-logic.js"),
	TriviaQuizLogic 	= quizLogic.TriviaQuizLogic,
	DefaultQuizLogic 	= quizLogic.DefaultQuizLogic;



/* --------------- Shared Test Functions ------------------ */

/******** Helpers *********/
function answer(logic, index, iterations) { /* answer with index iteration times */
	for (var i=0; i<iterations; i++) {
		logic.answer(index);
	}
}

/* ---- For answers ---- */
function shouldReturnAnswerGivenIndex(questionList, logic) {
	return function() {
		assert.equal(questionList[0].answerList[0], logic.answer(0));
		assert.equal(questionList[1].answerList[1], logic.answer(1));
		assert.equal(questionList[2].answerList[2], logic.answer(2));
	}
}
function shouldAnswerNullIfCalledPastQuestionListLength(questionList, logic) {
	return function() {
		answer(logic, 0, questionList.length);
		assert.equal(null, logic.answer(2));
	}
}
function shouldReturnNullIfAnswerCalledWithInvalidIndex(questionList, logic) {
	return function() {
		assert.equal(null, logic.answer(100));
		assert.equal(null, logic.answer(-1));
	}
}
/* ---- For answers ---- */

function shouldReturnOutcomeNullBeforeQuizComplete(logic) {
	return function() {
		assert.equal(null, logic.outcome());
		logic.answer(2);
		assert.equal(null, logic.outcome());
	}
}
/* --------------- Shared Test Functions above ------------------ */




describe('Default Quiz Logic', function() {
	var outcomeList = [
		{ _id:'0', text:'OUTCOME-0' },
		{ _id:'1', text:'OUTCOME-1' },
		{ _id:'2', text:'OUTCOME-2' },
	];
	var questionList = [
		{ _id: '0', answerList: [{ _question: '0', _outcome:'0' },{ _question: '0', _outcome:'1' }]},
		{ _id: '1', answerList: [{ _question: '1', _outcome:'0' },{ _question: '1', _outcome:'1' },{ _question: '1', _outcome:'2' }]},
		{ _id: '2', answerList: [{ _question: '2', _outcome:'2' },{ _question: '2', _outcome:'2' },{ _question: '2', _outcome:'1' }]},
	];
	var quizData = { 'questionList': questionList, 'outcomeList': outcomeList, };
	var logic = new DefaultQuizLogic(quizData);
	
	/* Note that reset function automatically tested - it's in the beforeEach */
	beforeEach(function(){
		logic.reset();
	});

	describe('answer function', function() {
		it('should return answer given index', shouldReturnAnswerGivenIndex(questionList, logic));
		it('should return null if answer() is called past questionList length', shouldAnswerNullIfCalledPastQuestionListLength(questionList, logic));
		it('should return null if answer() is called with invalid index', shouldReturnNullIfAnswerCalledWithInvalidIndex(questionList, logic));
	});
	describe('unchoose answer', function() {
		it('should fail for null answer', function() {
			var a0 = logic.answer(0);
			assert.equal(false, logic.unchooseAnswer());
			var a1 = logic.answer(0);
			assert.notEqual(a0, a1);
		});
		it('should fail for not most previous answer', function() {
			assert.equal(false, logic.unchooseAnswer(questionList[0].answerList[0]));
			var a0 = logic.answer(0);
			var a1 = logic.answer(0);
			assert.equal(false, logic.unchooseAnswer(a0));
			var a2 = logic.answer(0);
			assert.notEqual(a1, a2);
		});
		it('should decrement the question index', function() {
			var a0 = logic.answer(0);
			var a1 = logic.answer(0);
			assert.notEqual(a0, a1);
			logic.unchooseAnswer(a1);
			var a2 = logic.answer(0);
			assert.equal(a1, a2);
		});
		it('should decrement corresponding outcome', function() {
			var a0 = logic.answer(0);
			var a1 = logic.answer(0);
			logic.unchooseAnswer(a1);
			logic.unchooseAnswer(a0);
			answer(logic, 1, 3);
			assert.equal(quizData.outcomeList[1], logic.outcome());
		});
	});
	describe('outcome function', function() {
		it('should return null before quiz complete', shouldReturnOutcomeNullBeforeQuizComplete(logic));	
		it('should return correctOutcome', function() {
			answer(logic, 0, 3);
			assert.equal(quizData.outcomeList[0], logic.outcome());
			logic.reset();
			answer(logic, 1, 3);
			assert.equal(quizData.outcomeList[1], logic.outcome());
		});
	});
});


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
			{ _id: 0, text: 'MIN-CORRECT-1', rules: {min_correct: 1}},
			{ _id: 1, text: 'MIN-CORRECT-3', rules: {min_correct: 3}},
		];
	var triviaQuizData = {
		'questionList': triviaQuestionList,
		'outcomeList': triviaOutcomeList,
	};
	var logic = new TriviaQuizLogic(triviaQuizData);

	function answerCorrect(iterations) { /* answer correct iteration times */
		answer(logic, 1, iterations);
	}
	function answerIncorrect(iterations) { /* answer incorrect iteration times */
		answer(logic, 0, iterations);
	}



	/* Note that reset function automatically tested - it's in the beforeEach */
	beforeEach(function(){
		logic.reset();
	});
	describe('answer function', function() {
		it('should return answer given index', shouldReturnAnswerGivenIndex(triviaQuestionList, logic));
		it('should return null if answer() is called past questionList length', shouldAnswerNullIfCalledPastQuestionListLength(triviaQuestionList, logic));
		it('should return null if answer() is called with invalid index', shouldReturnNullIfAnswerCalledWithInvalidIndex(triviaQuestionList, logic));
	});
	describe('outcome function', function() {
		it('should return null before quiz complete', shouldReturnOutcomeNullBeforeQuizComplete(logic));
		it('returns outcome with just correct_count and total_count when there is no matching rule', function() {
			answerIncorrect(3);
			var o = logic.outcome();
			assert.notEqual(undefined, o.correct_count);
			assert.notEqual(undefined, o.total_count);
			assert.equal(undefined, o.text);
		});
		it('handles 1 answer right where there is a matching rule', function() {
			answerIncorrect(2);
			answerCorrect(1);
			assert.equal(triviaQuizData.outcomeList[0], logic.outcome());
		});
		it('handles 2 answers right where there is not a matching rule', function() {
			answerIncorrect(1);
			answerCorrect(2);
			assert.equal(triviaQuizData.outcomeList[0], logic.outcome());
		});
		it('handles all answers right where there is a matching rule', function() {
			answerCorrect(3);
			assert.equal(triviaQuizData.outcomeList[1], logic.outcome());
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




