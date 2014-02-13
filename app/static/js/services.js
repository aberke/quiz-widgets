

var FormService = function() {
  
  return {
    /* handles checking if given input or select elements are empty and colors with class 'error' if so */
    checkInputEmpty: function(elementIDsList) {
      /* first remove previous errors */
      $('.error').removeClass('error');

      var error = false;
      for(var i=0; i < elementIDsList.length; i++) {
        var elt = $('#' + elementIDsList[i]);
        if(!elt.val()) {
          elt.addClass('error');
          error = true;
        }
      }
      return error;
    },

  }
}

var UIService = function($timeout){

  return {

    setupPopovers: function() {
      /* wait for angular to get back and render verified callers */
      $timeout(function(){
        $('.popover-hover').popover({trigger: 'hover'});
      }, 3000);
    }
  }
}

var HTTPService = function($http, $q){

  return {

    http: function(method, url, data) {
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

    httpGET: function(url) {
      return this.http('GET', url, null);
    },
    httpPOST: function(url, data) {
      return this.http('POST', url, data);
    },
    httpPUT: function(url, data) {
      return this.http('PUT', url, data);
    },
    httpDELETE: function(url) {
      return this.http('DELETE', url, null);
    },

  }
};