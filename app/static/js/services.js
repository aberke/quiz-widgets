

var FormService = function() {

  function checkModelError(model) {
    if (model == null || model == undefined || model =='') {
      return true;
    }
    return false;
  };

  /* helpers to keep error representation consistent -- used on new page */
  this.removeAllErrors = function() {
    /* first remove previous errors */
    $('.error').removeClass('error');
  };
  this.addError = function(elt) {
    elt.addClass('error');
  };

  /* handles checking if given input or select elements are empty and colors with class 'error' if so */
  this.checkInput = function(elementIDsList) {
    var error = false;
    for(var i=0; i < elementIDsList.length; i++) {
      var elt = $('#' + elementIDsList[i]);
      if(!elt.val()) {
        this.addError(elt);
        error = true;
      }
    }
    return error;
  };

  /* parameter: [{model: model, elementID: id} 
      -- checks that given model is set and if not adds error class to element */
  this.checkModel = function(modelElementIDList) {
    error = false;
    for (var i=0; i < modelElementIDList.length; i++) {
      var model = modelElementIDList[i].model;
      if (model == null || model == undefined || model =='') {
        var elt = $('#' + modelElementIDList[i].elementID);
        this.addError(elt);
        error = true;
      }
    }
    return error;
  };

  /* model checking functions --------------------------------
      -- return true if there is an error, false otherwise 
  */
  this.checkQuestionError = function(question) {
    question.error = { 'any':false, 'text': false };
    /* check that it has text */
    if (checkModelError(question.text)) {
      question.error.text = true;
      question.error.any = true;
    }
    /* check each answer for error */
    for (var i=0; i<question.answerList.length; i++) {
      if (this.checkAnswerError(question.answerList[i])) {
        question.error.any = true;
      }
    }
    return question.error.any;
  };
  this.checkAnswerError = function(answer) {
    answer.error = { 'any': false, '_outcome': false };
    /* verify outcome is in outcomeMap */
    if (!answer._outcome) {
      answer.error.any = true;
      answer.error._outcome = true;
    }
    return answer.error.any;
  };
  this.checkOutcomeError = function(outcome) {
    outcome.error = { 'any': false, 'empty': false };
    /* make sure there's at least some data in this outcome */
    if (!outcome.text && !outcome.description && !outcome.pic_url) {
      outcome.error.empty = true;
      outcome.error.any = true;
    }
    return outcome.error.any;
  };

  /* model checking functions above -------------------------------- */
}

WidgetService = function() {

  this.setupOutcomeAnswerLists = function(quiz) {
    /* give each outcome in outcomeList an answerList of answer _id's */

    var outcomeMap = {}; // {outcomeID: index in outcomeList}
    for (var i=0; i<quiz.outcomeList.length; i++) {
      var outcome = quiz.outcomeList[i];
      outcome.answerList = [];
      outcomeMap[outcome._id] = i;
    }
    /* create answerList for each outcome and push on answers */
    for (var i=0; i<quiz.questionList.length; i++) {
      var question = quiz.questionList[i];
      for (var j=0; j<question.answerList.length; j++) {
        var answer = question.answerList[j];
        if (answer._outcome) {
          quiz.outcomeList[outcomeMap[answer._outcome]].answerList.push(answer._id);
        } else {
          console.log('THIS ANSWER DOESNT HAVE AN _outcome', answer)
        }
      }
    }
  };

}

var UIService = function($timeout){

  var stylesheet = document.createElement('style');
  document.body.appendChild(stylesheet);

  this.setupPopovers = function() {
    /* wait for angular to get back and render verified callers */
    $timeout(function(){
      $('.popover-hover').popover({trigger: 'hover'});
    }, 3000);
  };
  this.addStyle = function(rule) {
      stylesheet.innerHTML += rule;
  };
  this.updateQuizPic = function(pic_url) {
    this.addStyle('.huffpostlabs-quiz::after {background-image: url(' + pic_url + ');}');
  };
}

var HTTPService = function($http, $q){

  function HTTP(method, url, data) {
    var deferred = $q.defer();
    $http({
      method: method,
      url: url,
      data: (data || {}),
    })
    .success(function(returnedData){
      deferred.resolve(returnedData);
    })
    .error(function(errData) { 
      console.log('API ERROR', errData)
      var e = new HTTPServiceError(errData);
      deferred.reject(e);
    });
    return deferred.promise;
  };
  /* when there is an $http error, service rejects promise with a custom Error */
  function HTTPServiceError(err) {
    this.name = "HTTPServiceError";
    this.data = (err || {});
    this.message = (err || "");
  }
  HTTPServiceError.prototype = Error.prototype;


    /* ---------- below functions return promises --------------------------- */
  this.GETquiz = function(id, onSuccess, onError) {
    return this.GET('/api/quiz/' + id);
  };

  this.GET= function(url) {
    return HTTP('GET', url, null);
  };
  this.POST= function(url, data) {
    return HTTP('POST', url, data);
  };
  this.PUT= function(url, data) {
    return HTTP('PUT', url, data);
  };
  this.DELETE= function(url) {
    return HTTP('DELETE', url, null);
  };

};