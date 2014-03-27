

var UserFactory = function($http, $q) { // it's a factory
	var user = null;
	
	var deferred = $q.defer();
	$http({method: 'GET', url: '/user'})
	.success(function(data) {
		if (data.twitter_id) { user =  data; }

		deferred.resolve(user);
	})
	.error(function(errData) {
		console.log('GET USER ERROR', errData);
		deferred.reject(errData);
	});

	return deferred.promise;
}