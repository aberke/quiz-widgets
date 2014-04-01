
QuizApp.config(function($routeProvider) {

	/* helper function used in resolve parameter 
		- for: resolve : {quiz: promise returning function } 
		- returns promise rather than data bc routeProvider wont render controller until promise resolved
	*/
	var resolveQuizFunction = function(APIservice, $location) {
		return APIservice.GETquiz($location.path().split('/')[2]).then(
			function(data) { return data; }
		);
	};
	/* the front-end authentication scheme (similar logic on backend)
		- when going to a route with resolve: {user: userOrRedirect }
			- check that user logged in
				- if so: return user
				- otherwise: reroute to '/'
	*/
	var userOrRedirect = function(UserFactory, $location) {
		return UserFactory.then(function(data) {
			if (!data){ /* user isn't logged in - redirect to home */
				$location.path('/'); 
				return null;
			}
			return data; /* success: return user object */
		});
	}
	

	$routeProvider.when('/all-quizzes', {
		templateUrl: '/html/all-quizzes.html',
	});	
	$routeProvider.when('/user/:search', {
		templateUrl: '/html/user.html',
		controller: UserCntl,
		resolve: {
			userList: function(APIservice) {
				return APIservice.GET('/user/all').then(function(data) {
					return data;
				});
			}
		}
	});	
	$routeProvider.when('/contact', {
		templateUrl: '/html/contact.html',
	});	
	$routeProvider.when('/forbidden', {
		templateUrl: '/html/forbidden.html',
	});	
	$routeProvider.when('/new', {
		templateUrl: '/html/new.html',
		controller: NewQuizCntl,
		resolve: {
			user: userOrRedirect,
		}
	});	
	$routeProvider.when('/social/:id', {
		templateUrl: '/html/social.html',
		controller: ShareCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quiz: resolveQuizFunction,
			user: userOrRedirect,
		}
	});
	$routeProvider.when('/quiz/:id', {
		templateUrl: '/html/quiz.html',
		controller: QuizCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quiz: resolveQuizFunction,
		}
	});
	$routeProvider.when('/edit/:id', {
		templateUrl: '/html/edit.html',
		controller: EditCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quiz: resolveQuizFunction,
			user: userOrRedirect,
		}
	});
	$routeProvider.when('/', {
		templateUrl: '/html/index.html',
		controller: IndexCntl,
	});
});