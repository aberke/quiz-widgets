

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
          console.log('answer without _outcome',answer);
        }
      }
    }
  };

}

var UIService = function($timeout, $rootScope){

  var stylesheet = document.createElement('style');
  document.body.appendChild(stylesheet);

  this.setupPopovers = function() {
    /* wait for angular to get back and render verified callers */
    $timeout(function(){
      $('.popover-hover').popover({trigger: 'hover'});
    }, 3000);
  };
  var addStyle = function(rule) {
      stylesheet.innerHTML += rule;
  };
  this.updateQuizPic = function(pic_url) {
    if (!pic_url) {
      clearQuizPic();
    } else {
      addStyle('.quiz-edit::after {background-image: url(' + pic_url + ');}');
    }
  };

  var clearQuizPic = function() {
    /* undo updateQuizPic to keep the last image from lingering in the background */
    addStyle('.quiz-edit::after {background-image: none}');
  }
  $rootScope.$on('$locationChangeStart', function() {
    clearQuizPic();
  });
}


var StatService = function($http, $q) {
  /* GET's stats (flat model schema) and formats them in a dictionary
      - each stat is in its own stat model that refers back to _quiz
          - optimized for efficient updates -- often updated, rarely read
      - format stats in dictionary 
          - {'Answer':{id:count for each Answer stat}, 'Outcome': {}, 'completed':count, ....}
  */

  function formatStats (rawData) {
    // data: {'Answer': {id: count for each Answer}, 'Outcome': {id: count for each Outcome}, 'started': count, singleton etc}
    var data = {}; 
    for (var i=0; i<rawData.length; i++) {
      var stat = rawData[i];
      var model_type = stat.model_type;
      var model_id = stat.model_id;

      if (model_id && model_id != 'null') {
        if (!data[model_type]) { data[model_type] = {}; }
        data[model_type][model_id] = stat.count;
      } else {
        data[model_type] = stat.count;
      }
    }
    return data;
  }

  function GET(endpoint) {
    var deferred = $q.defer();
    $http.get('/stats' + endpoint)
        .success(function(returnedData){
          data = formatStats(returnedData);
          deferred.resolve(data);
        })
        .error(function(errData) { 
          console.log('StatsService ERROR', errData)
          deferred.reject(e);
        });
    return deferred.promise;
  };

  this.GETquizStats = function(quizID) {
    return GET('/' + quizID + '/all');
  };

};


var APIservice = function($rootScope, $http, $q){

  function HTTP(method, endpoint, data) {
    $rootScope.unauthorized = false;
    
    var deferred = $q.defer();
    $http({
      method: method,
      url: ('/api' + endpoint),
      data: (data || {}),
    })
    .success(function(returnedData){
      deferred.resolve(returnedData);
    })
    .error(function(errData, status) {
      if (status == 401) { /* the header in base.html pays attention to error */
        $rootScope.unauthorized = true;
        $rootScope.user = null;
      }
      console.log('API ERROR', status, errData)
      var e = new APIserviceError(errData);
      deferred.reject(e);
    });
    return deferred.promise;
  };
  /* when there is an $http error, service rejects promise with a custom Error */
  function APIserviceError(err) {
    this.name = "APIserviceError";
    this.data = (err || {});
    this.message = (err || "");
  }
  APIserviceError.prototype = Error.prototype;


  /* ---------- below functions return promises --------------------------- */
  

  this.GETquiz = function(id, onSuccess, onError) {
    return this.GET('/quiz/' + id);
  };

  this.GET= function(endpoint) {
    return HTTP('GET', endpoint, null);
  };
  this.POST= function(endpoint, data) {
    return HTTP('POST', endpoint, data);
  };
  this.PUT= function(endpoint, data) {
    return HTTP('PUT', endpoint, data);
  };
  this.DELETE= function(endpoint) {
    return HTTP('DELETE', endpoint, null);
  };

};