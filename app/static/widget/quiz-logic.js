/* Handles the Game Logic of quizzes.

    Object Oriented
            (OOP with javascript is ugly)
        DefaultQuizLogic
            and
        TriviaQuizLogic
            inherit from QuizLogic (Base Class)

    Reasonining for prototypical inheritance:
        With prototypical inheritance, each prototype function exists just once
            Benefit:
                - Say there are several quizzes on the page
                - User goes to page on mobile device which has limited memory capacity
                - If didn't have prototypical inheritance, browser would have instance each function for each quiz
                - possible memory overload - bad performance
*/


var QuizLogic = function(quizData) { // Base Class
    if (!quizData) { return; } // prevent further execution when just calling for sake of inheritance definition
    
    this.questionList = quizData.questionList;
    this.outcomeList = quizData.outcomeList;
    this.currQuestionIndex;
    
    this.outcomeMap;

    this.init();
}
QuizLogic.prototype.init = function() {
    this.setupOutcomeMap();
    this.reset();
}
QuizLogic.prototype.reset = function() {
    this.currQuestionIndex = 0;
}
QuizLogic.prototype.answer = function(index) {
    /* return the answer if valid request - otherwise return null */
    var question = this.questionList[this.currQuestionIndex];
    //console.log('question',question,index)
    if (!question || index < 0 || question.answerList.length <= index) { return null; }
    
    return question.answerList[index];
}
/* Validators used by subclasses */
QuizLogic.prototype.validUnchooseAnswer = function(a) {
    /* check call is valid -- return false if not */
    if (!a || this.currQuestionIndex < 1) { return false; }
    if (this.questionList[this.currQuestionIndex-1]._id != a._question) { return false; }
    return true;
}
QuizLogic.prototype.quizComplete = function() {
    return (this.currQuestionIndex == this.questionList.length);
}



var TriviaQuizLogic = function(quizData) {
    // Call the parent constructor
    QuizLogic.call(this, quizData);
    this.correct_count;
}
// inherit QuizLogic and correct the constructor pointer because it points to QuizLogic
TriviaQuizLogic.prototype = new QuizLogic();
TriviaQuizLogic.prototype.constructor = QuizLogic;
TriviaQuizLogic.prototype.reset = function() {
    QuizLogic.prototype.reset.call(this);
    this.correct_count = 0;
}
TriviaQuizLogic.prototype.setupOutcomeMap = function() {
    this.outcomeMap = {}; //{min_correct: outcome}
    for (var i=0; i<this.outcomeList.length; i++) {
        var o = this.outcomeList[i];
        this.outcomeMap[o.rules.min_correct] = o;
    }
}
TriviaQuizLogic.prototype.correct = function() {
    return this.correct_count;
}
TriviaQuizLogic.prototype.answer = function(index) {
    var a = QuizLogic.prototype.answer.call(this, index);
    if (!a) { return null; }
    if (a.correct) { this.correct_count += 1; }
    this.currQuestionIndex += 1;
    return a;
}
TriviaQuizLogic.prototype.unchooseAnswer = function(a) {
    /* note this function doesn't have FULL testing coverage -- because I assume it isn't used */
    if (!this.validUnchooseAnswer(a)) { return false; }
    this.currQuestionIndex -= 1;
    if (a.correct) { this.correct_count -= 1; }
    return true;
}
TriviaQuizLogic.prototype.outcome = function() {
    /* 
        if quiz is incomplete - return null
        otherwise - return outcome that best matches rules
        attach correct_count, question_count to outcome
    */
    if (!this.quizComplete()) { return null; }
    var o = {};
    for (var i=this.correct_count; i>=0; i--) {
        if (this.outcomeMap[i]) { // this is the best option
            o = this.outcomeMap[i];
            break;
        }
    }
    o.correct_count = this.correct_count;
    o.total_count   = this.questionList.length;
    return o;
}

var DefaultQuizLogic = function(quizData) {
    // Call the parent constructor

    QuizLogic.call(this, quizData);
    this.leadingOutcome;
}
// inherit QuizLogic and correct the constructor pointer because it points to QuizLogic
DefaultQuizLogic.prototype = new QuizLogic();
DefaultQuizLogic.prototype.constructor = QuizLogic;
DefaultQuizLogic.prototype.reset = function() {
    QuizLogic.prototype.reset.call(this);
    this.leadingOutcome = null;
    this.setupOutcomeMap();
}
DefaultQuizLogic.prototype.setupOutcomeMap = function() {
    this.outcomeMap = {};
    for (var i=0; i<this.outcomeList.length; i++) {
        var o = this.outcomeList[i];
        o.points = 0;
        this.outcomeMap[o._id] = o;
    }
}
/* increment/decrement outcome return true on success, false on failure */
DefaultQuizLogic.prototype.incrementOutcome = function(outcomeID) {
    var o = this.outcomeMap[outcomeID];
    if (!o) { return false; }
    o.points += 1;
    if (!this.leadingOutcome || o.points > this.leadingOutcome.points) {
        this.leadingOutcome = o;
    }
    return true;
}
DefaultQuizLogic.prototype.decrementOutcome = function(outcomeID) {
    var o = this.outcomeMap[outcomeID];
    if (!o) { return false; }
    o.points -= 1;
    for (var id in this.outcomeMap) {
        if (this.outcomeMap[id].points > this.leadingOutcome.points) {
            this.leadingOutcome = this.outcomeMap[id];
        }
    }
    return true;
}
/* increment/decrement outcome return true on success, false on failure */

DefaultQuizLogic.prototype.answer = function(index) {
    var a = QuizLogic.prototype.answer.call(this, index);
    if (!a) { return null; }
    if (!this.incrementOutcome(a._outcome)) { return null; }

    this.currQuestionIndex += 1;
    return a;
}
DefaultQuizLogic.prototype.unchooseAnswer = function(a) {
    if (!this.validUnchooseAnswer(a)) { return false; }
    this.currQuestionIndex -= 1;
    return this.decrementOutcome(a._outcome);
}
DefaultQuizLogic.prototype.outcome = function() {
    if (!this.quizComplete()) { return null; }
    return this.leadingOutcome;
}

// Need for testing with mocha
var exports = (exports || {});
exports.TriviaQuizLogic    = TriviaQuizLogic;
exports.DefaultQuizLogic   = DefaultQuizLogic;