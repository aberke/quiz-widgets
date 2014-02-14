

var HuffpostLabsQuizObject = function(container, quizData, completeCallback) {
	
console.log('\n HuffpostLabsQuizObject', container, quizData)

	var questionList = quizData.questionList;
	var nextQuestion = questionList.shift();

	var outcomeList = quizData.outcomeList;
	var leading_outcome = null;

	console.log('questionList', questionList, '\nnextQuestion', nextQuestion)
	console.log('\noutcomeList', outcomeList, 'leading_outcome', leading_outcome)





var containers = document.getElementsByClassName('question-container');
var lastContainerIndex = containers.length - 1;

function te(index, elem) {
  console.log('transitionEnd', index, elem)

  var cLeft = (index > 0) ? containers[index-1] : containers[lastContainerIndex];
  var cRight = (index < lastContainerIndex) ? containers[index + 1] : containers[0];
  var nextQuestion = content.shift();

  fillWithContent(cLeft, nextQuestion);
  fillWithContent(cRight, nextQuestion);

  if (!content.length) {
    window.mySwipe = null;
  }
}


function fillWithContent(container, content) {
  container.innerHTML = content;
}


// pure JS
var elem = document.getElementById('swipe-container');
mySwipe = Swipe(elem, {
  startSlide: 1, // always 3 slides
  //auto: 3000,
  continuous: true,
  disableScroll: true,
  stopPropagation: true,
  //callback: cb,
  transitionEnd: te
});


document.getElementById('next-btn').onclick = mySwipe.next;
document.getElementById('prev-btn').onclick = mySwipe.prev;






}