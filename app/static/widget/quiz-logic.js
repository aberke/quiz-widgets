/* Handles the Game Logic of quizzes.


*/

function TriviaLogic(quizData) {
    var questionList = quizData.questionList;
    var outcomeList = quizData.outcomeList;

    var outcomeMap; // {min_correct: outcome}
    var correct_count;
    var currQuestionIndex;


    this.correct = function() {
        return correct_count;
    }
    this.answer = function(index) {
        /* check call is valid -- return null if not */
        if (currQuestionIndex >= questionList.length || questionList[currQuestionIndex].answerList.length <= index) { return null; } // invalid call of answer()
        
        var a = questionList[currQuestionIndex].answerList[index];
        if (a.correct) { correct_count += 1; }
        currQuestionIndex += 1;
        return a;
    }
    this.unchooseAnswer = function(a) {
        if (!a || currQuestionIndex < 1) { return; } // unchoose WHAT answer
        currQuestionIndex -= 1;
        if (a.correct) { correct_count -= 1; }
    }
    this.outcome = function() {
        /* 
            if there are no outcomes - return null
            if quiz is incomplete - return null
            otherwise - return outcome that best matches rules
            possible that only outcomes don't match rules - return null
        */
        if (!outcomeList.length || currQuestionIndex < questionList.length) {
            return null;
        }
        for (i=correct_count; i>=0; i--) {
            if (outcomeMap[i]) { // this is the best option
                return outcomeMap[i];
            }
        }
        // There were no outcomes for this loser!
        return null;
    }
    this.reset = function() {
        correct_count = 0;
        currQuestionIndex = 0;
    }
    this.init = function() {
        outcomeMap = {};
        for (var i=0; i<outcomeList.length; i++) {
            var o = outcomeList[i];
            outcomeMap[o.rules.min_correct] = o;
        }
        this.reset();
    }
    this.init();

}

function QuizLogic(quizData) {
    var questionList = quizData.questionList;
    var outcomeList = quizData.outcomeList;

    var outcomeMap;
    var leadingOutcome;
    var currQuestionIndex;

    var incrementOutcome = function(outcomeID) {
        var o = outcomeMap[outcomeID];
        o.points += 1;
        if (!leadingOutcome || o.points > leadingOutcome.points) {
            leadingOutcome = o;
        }
    }
    var decrementOutcome = function(outcomeID) {
        outcomeMap[outcomeID].points -= 1;
        for (var id in outcomeMap) {
            if (outcomeMap[id].points > leadingOutcome.points) {
                leadingOutcome = outcomeMap[id];
            }
        }
    }
    this.answer = function(index) {
        if (currQuestionIndex >= questionList.length) { return null; } // invalid call of answer()
        
        var a = questionList[currQuestionIndex].answerList[index];
        incrementOutcome(a._outcome);
        currQuestionIndex += 1;
        return a;
    }
    this.unchooseAnswer = function(a) {
        if (!a || currQuestionIndex < 1) { return; } // unchoose WHAT answer
        currQuestionIndex -= 1;
        if (a.correct) { correct_count -= 1; }
    }
    this.outcome = function() {
    	/* if quiz is complete - return leadingOutcome
    		otherwise: return null
    	*/
        if (currQuestionIndex < questionList.length) {
            return null;
        } 
        return leadingOutcome;
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
/* For the sake of testing */
exports.TriviaLogic = TriviaLogic;
exports.QuizLogic   = QuizLogic;


