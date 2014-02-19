/* Mobile building functions */





var HuffpostLabsQuizObject = function(container, quizData, mobile, completeCallback) {
	/* 
	Params:
		mobile: boolean as to weather q.js detected mobile device

	when the quiz is complete I'll send back data 
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
	var container = container;
	var quizData = quizData;
	var isMobile = mobile;
	var quizID = quizData._id;
	var quizIDString = quizID.toString();
	var swipeControllerString = "swipeControllers['" + quizIDString + "']";

	var questionList;
	var currQuestion;
	var nextQuestion;

	var outcomeMap; // {_outcomeID: outcomeObject}
	var leadingOutcome = null;
	var chosenAnswers = [];

	var containers;
	var currIndex = 0;
	var lastContainerIndex;
	function init(){
		console.log('init', quizData, container)

		containers = buildWidgetSkeleton(container, quizData.title);
		//this.containers = document.getElementsByClassName('swipe-slide');
		lastContainerIndex = containers.length - 1;

		questionList = quizData.questionList;
		currQuestion = questionList.shift();
		nextQuestion = questionList.shift();
		outcomeMap = createOutcomeMap(quizData.outcomeList);

		enableSwipe(); // need to define swipeControllerString before building questions
		fillSlideContainer(0, buildQuestionContent(currQuestion));
		setupNextQuestion(nextQuestion, 0);
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
		a = currQuestion.answer1;
		chooseAnswer(a);
	}
	function chooseAnswer2() {
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
		console.log(outcomeMap)
		var outcomeContent = buildOutcomeContent(leadingOutcome);
		setupNextContent(index, outcomeContent);
	}
	function setupNextQuestion(nextQuestion, index) {
	  var questionContent = buildQuestionContent(nextQuestion);
	  setupNextContent(index, questionContent);
	}
	function enableSwipe() {
		window.swipeControllers[quizIDString] = Swipe(document.getElementById('swipe-container-' + quizIDString), {
			startSlide: currIndex, // always 3 slides
			//auto: 3000,
			continuous: true,
			disableScroll: true,
			stopPropagation: true,
			callback: swipeStart,
			transitionEnd: swipeEnd,
		});
	}
	function disableSwipe() {
		window.swipeControllers[quizIDString].kill();
	}

	function swipeStart(index, elem) {
		if (index == (currIndex + 1) || index == 0) {
			chooseAnswer2();
		} else {
			chooseAnswer1();
		}
	}
	var lastSwipe = false;
	function swipeEnd(index, elem) {
		currIndex = index;
	  	if (lastSwipe) {
	  		handleQuizEnd();
	  		return;
	  	}
	  	currQuestion = nextQuestion;
		nextQuestion = questionList.shift();
		if (!nextQuestion) {
			lastSwipe = true;
			setupOutcome(index);
		} else {
			setupNextQuestion(nextQuestion, index);
		}
	}
	function handleQuizEnd() {
  		disableSwipe();
  		if (completeCallback) { completeCallback(leadingOutcome, chosenAnswers); }
	}


	function fillSlideContainer(index, content) {
	  containers[index].innerHTML = content;
	}


	function buildWidgetSkeleton() {
		console.log('buildWidgetSkeleton', quizData.title)
		var html = "";
		if (isMobile) {
			container.className += ' mobile';
			html += "<meta name='viewport' content='width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'/>";
		}
		// html += '<div class="share-buttons">'; 
		// html += '<a href="https://twitter.com/share" class="twitter-share-button" data-text="' + quizData.title + '" data-via="HuffPostCode" data-hashtags="huffpostQuiz">Tweet</a>';
		// html += '</div>';
		html += '<p class="quiz-title">' + quizData.title + '</p>';
		html += '<div id="swipe-container-' + quizIDString + '" class="swipe swipe-container">';
		html += '	<div class="swipe-wrap" id="swipe-wrap-' + quizIDString + '">';
		html += 		'<div class="swipe-slide"></div>';
		html += 		'<div class="swipe-slide"></div>';
		html += 		'<div class="swipe-slide"></div>';
		html += '	</div>';
		html += '</div>';
		container.innerHTML = html;
		twttr.widgets.load();
		return document.getElementById('swipe-wrap-' + quizIDString).children;
	}
	function buildQuestionContent(question) {
		var html = '<div class="question">';
		html 	+= '	<div class="question-text">';
		html 	+= '	<p>' + question.text + '</p>';
		html 	+= '	</div>';
		html 	+= '<div class="answers-container">';
		
		// if (isMobile) {
		// 	html 	+= '<div class="answer answer-left">';
		// } else {
			html 	+= '<div onclick="' + swipeControllerString + '.prev()" class="answer answer-left">';
		//}
		
		html 	+= '  		<img class="answer-img" src="' + question.answer1.pic_url + '"></img>';
		html 	+= '	   	<div class="answer-text">';
		html 	+= '	    <p>' + question.answer1.text + '</p>';
		html 	+= '	    <p>&larr;</p>';
		html 	+= '	  </div>';
		html 	+= '	</div>';

		// if (isMobile) {
		// 	html 	+= '<div class="answer answer-right">';
		// } else {
			html 	+= '<div onclick="' + swipeControllerString + '.next()" class="answer answer-right">';
		//}
		
		html 	+= '	  <img class="answer-img" src="' + question.answer2.pic_url + '"></img>';
		html 	+= '	  <div class="answer-text">';
		html 	+= '	    <p>' + question.answer2.text + '</p>';
		html 	+= '	    <p>&rarr;</p>';
		html 	+= '	  </div>';
		html 	+= '	</div>';
		html 	+= '	</div>';

		html 	+= ' </div>';
	  	return html;
	}
	function buildOutcomeContent(outcome) {
		var html = '<div class="outcome">';
		html 	+= '    <img class="outcome-img" src="' + outcome.pic_url + '"></img>';
    	html 	+= '	<p class="outcome-text">' + outcome.text + '</p>';
    	html 	+= '</div>';
		return html;
	}
	init();
}