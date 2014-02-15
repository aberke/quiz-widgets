

var HuffpostLabsQuizObject = function(container, quizData, completeCallback) {
	/* when the quiz is complete I'll send back data 
		worthwhile data: 
			list of chosen answers chosenAnswers = []
			which outcome resulted

			have map: {_outcomeID: outcomeObject}
			Each time an answer is chosen, 
				onclick='chooseAnswer1()' or onclick='chooseAnswer2()'
				a = currQuestion.answer1  or a = currQuestion.answer2
				chosenAnswers.push(a)
				incrementOutcome(a.outcome)

			leadingOutcome = null
			outcomesMap = {_outcomeID: outcomeObject}
			function incrementOutcome(outcomeID):
				o = outcomesMap[outcomeID]
				o.points += 1
				if o.points > leadingOutcome.points:
					leadingOutcome = o
				
	*/
	var questionList;
	var currQuestion;
	var nextQuestion;

	var outcomeMap; // {_outcomeID: outcomeObject}
	var leadingOutcome = null;
	var chosenAnswers = [];

	var containers;
	var currIndex = 0;
	var lastContainerIndex;

	var init = function() {
		containers = document.getElementsByClassName('swipe-slide');
		lastContainerIndex = containers.length - 1;

		questionList = quizData.questionList;
		currQuestion = questionList.shift();
		nextQuestion = questionList.shift();
		outcomeMap = createOutcomeMap(quizData.outcomeList);
		console.log('questionList', questionList, '\nnextQuestion', nextQuestion)
		console.log('\noutcomeMap', outcomeMap, 'leading_outcome', leadingOutcome)

		fillSlideContainer(0, buildQuestionContent(currQuestion));
		setupNextQuestion(nextQuestion, 0);

		enableSwipe();
	}
	function createOutcomeMap(outcomeList) {
		map = {};
		for (var i=0; i<outcomeList.length; i++) {
			var o = outcomeList[i];
			o.points = 0;
			map[o._id] = o;
		}
		return map;
	}
	function incrementOutcome(outcomeID) {
		var o = outcomeMap[outcomeID];
		o.points += 1;
		if (!leadingOutcome || o.points > leadingOutcome.points) {
			leadingOutcome = o;
		}
		return leadingOutcome;
	}
	function chooseAnswer(answer) {
		chosenAnswers.push(answer);
		incrementOutcome(answer._outcome);
	}
	function chooseAnswer1() {
		console.log('chooseAnswer1')
		a = currQuestion.answer1;
		chooseAnswer(a);
	}
	function chooseAnswer2() {
		console.log('chooseAnswer2')
		a = currQuestion.answer2;
		chooseAnswer(a);
	}
	function setupNextContent(index, content) {
	  var indexLeft = (index > 0) ? (index-1) : lastContainerIndex;
	  var indexRight = (index < lastContainerIndex) ? (index + 1) : 0;

	  fillSlideContainer(indexLeft, content);
	  fillSlideContainer(indexRight, content);
	}

	function setupOutcome(index) {
		var outcomeContent = buildOutcomeContent(leadingOutcome);
		setupNextContent(index, outcomeContent);
	}
	function setupNextQuestion(nextQuestion, index) {
	  var questionContent = buildQuestionContent(nextQuestion);
	  setupNextContent(index, questionContent);
	}
	function enableSwipe() {
		document.getElementById('prev-btn').onclick = mySwipe.prev;
		document.getElementById('next-btn').onclick = mySwipe.next;
	}
	function disableSwipe() {
		mySwipe = null;
		document.getElementById('prev-btn').onclick = function() {console.log('prev')};
		document.getElementById('next-btn').onclick = function() {console.log('next')};
	}

	function swipeStart(index, elem) {
		if (index < currIndex) {
			chooseAnswer1();
		} else {
			chooseAnswer2();
		}
	}
	var lastSwipe = false;
	function swipeEnd(index, elem) {
		currIndex = index;
	  	if (lastSwipe) {
	  		disableSwipe();
	  		return;
	  	}
		var nextQuestion = questionList.shift();
		if (!nextQuestion) {
			lastSwipe = true;
			setupOutcome(index);
		} else {
			setupNextQuestion(nextQuestion, index);
		}
	}


	function fillSlideContainer(index, content) {
	  containers[index].innerHTML = content;
	}




// pure JS
var elem = document.getElementById('swipe-container');
var mySwipe = Swipe(elem, {
  startSlide: currIndex, // always 3 slides
  //auto: 3000,
  continuous: true,
  disableScroll: true,
  stopPropagation: true,
  callback: swipeStart,
  transitionEnd: swipeEnd,
});

	function buildOutcomeContent(outcome) {
		var html = '<div class="outcome">';
		html 	+= '    <img class="outcome-img" src="' + outcome.pic_url + '"></img>';
    	html 	+= '	<p class="outcome-text">' + outcome.text + '</p>';
    	html 	+= '</div>';
		return html;
	}
	function buildQuestionContent(question) {
		var html = '<div class="question">';
		html 	+= '	<div class="answer answer-left">';
		html 	+= '  		<img class="answer-img" src="' + question.answer1.pic_url + '"></img>';
		html 	+= '	   	<div class="answer-text">';
		html 	+= '	    <p>' + question.answer1.text + '</p>';
		html 	+= '	    <p>&larr;</p>';
		html 	+= '	  </div>';
		html 	+= '	</div>';
		html 	+= '	<div class="question-text">';
		html 	+= '	<p>' + question.text + '</p>';
		html 	+= '	</div>';
		html 	+= '	<div class="answer answer-right">';
		html 	+= '	  <img class="answer-img" src="' + question.answer2.pic_url + '"></img>';
		html 	+= '	  <div class="answer-text">';
		html 	+= '	    <p>' + question.answer2.text + '</p>';
		html 	+= '	    <p>&rarr;</p>';
		html 	+= '	  </div>';
		html 	+= '	</div>';
		html 	+= '	</div>';
	  	return html;
	}
	init();
}