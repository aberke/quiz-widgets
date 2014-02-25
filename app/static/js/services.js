

var FormService = function() {

  return {

    /* helpers to keep error representation consistent */
    removeAllErrors: function() {
      /* first remove previous errors */
      $('.error').removeClass('error');
    },
    addError: function(elt) {
      elt.addClass('error');
    },

    /* handles checking if given input or select elements are empty and colors with class 'error' if so */
    checkInput: function(elementIDsList) {
      var error = false;
      for(var i=0; i < elementIDsList.length; i++) {
        var elt = $('#' + elementIDsList[i]);
        if(!elt.val()) {
          this.addError(elt);
          error = true;
        }
      }
      return error;
    },

    /* parameter: [{model: model, elementID: id} 
        -- checks that given model is set and if not adds error class to element */
    checkModel: function(modelElementIDList) {
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
    },

  }
}

var UIService = function($timeout){

    var stylesheet = document.createElement('style');
    document.body.appendChild(stylesheet);

  return {

    setupPopovers: function() {
      /* wait for angular to get back and render verified callers */
      $timeout(function(){
        $('.popover-hover').popover({trigger: 'hover'});
      }, 3000);
    },

    addStyle: function(rule) {
        stylesheet.innerHTML += rule;
    },
  }
}

var HTTPService = function($http, $q){

  return {

    HTTP: function(method, url, data) {
      var deferred = $q.defer();
      $http({
        method: method,
        url: url,
        data: (data || {}),
      })
      .success(function(returnedData){
        deferred.resolve(returnedData);
      })
      .error(function(returnedData) { 
        console.log('API ERROR')
        console.log(returnedData);
        deferred.reject(returnedData);
      });
      return deferred.promise;
    },

    GET: function(url) {
      return this.HTTP('GET', url, null);
    },
    POST: function(url, data) {
      return this.HTTP('POST', url, data);
    },
    PUT: function(url, data) {
      return this.HTTP('PUT', url, data);
    },
    DELETE: function(url) {
      return this.HTTP('DELETE', url, null);
    },

  }
};