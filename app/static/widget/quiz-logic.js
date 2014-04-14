


function QuizLogic(quizData) {
	console.log(quizData, 'QuizLogic')
    // gets the quizData and takes what it needs
    var quizData = quizData; 
    var questionList = quizData.questionList;
    var outcomeList = quizData.outcomeList;
    var outcomeMap;
    var leadingOutcome;

    var incrementOutcome = function(outcomeID) {
        var o = outcomeMap[outcomeID];
        o.points += 1;
        if (!leadingOutcome || o.points > leadingOutcome.points) {
            leadingOutcome = o;
        }
    }
    var decrementOutcome = function(outcomeID) {
        outcomeMap[outcomeID].points -= 1;
        for (var outcomeID in outcomeMap) {
            if (outcomeMap[outcomeID].points > leadingOutcome.points) {
                leadingOutcome = outcomeMap[outcomeID];
            }
        }
    }
    this.answer = function(index) {
        var a = questionList[currQuestionIndex].answerList[index];
        incrementOutcome(a._outcome);
        currQuestionIndex += 1;
        return a;
    }
    this.unchooseAnswer = function(answer) {
    	currQuestionIndex -= 1;
        decrementOutcome(answer._outcome);
    }
    this.outcome = function() {
    	/* if quiz is complete - return leadingOutcome
    		otherwise: return null
    	*/
        if (currQuestionIndex == questionList.length) {
            return leadingOutcome;
        } 
        return null;
    }

    this.reset = function() {
        leadingOutcome = null;
        currQuestionIndex = 0;
        outcomeMap = {};
        for (var i=0; i<outcomeList.length; i++) {
            var o = outcomeList[i];
            o.points = 0;
            outcomeMap[o._id] = o;
        }
    }
    this.reset();
}


