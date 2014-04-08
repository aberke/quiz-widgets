
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
	};
	/* GET quiz stats (flat model schema) and return them in a dictionary
		that controller can easily use
	*/
	var resolveQuizStats = function(StatService, $location) {
		return StatService.GETquizStats($location.path().split('/')[2]).then(
			function(data) { return data; }
		);
	}
	

	$routeProvider.when('/documentation/:docString', {
		templateUrl: '/documentation/template.html',
		controller: DocumentationCntl,
	});
	$routeProvider.when('/documentation', {
		templateUrl: '/documentation/template.html',
		controller: DocumentationCntl,
	});
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
	$routeProvider.when('/new/trivia-quiz', {
		templateUrl: '/html/new-trivia-quiz.html',
		controller: NewQuizCntl,
		resolve: {
			user: userOrRedirect,
			quizType: function() { return 'trivia-quiz'; },
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
	$routeProvider.when('/stats/:id', {
		templateUrl: '/html/stats.html',
		controller: StatsCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quiz: resolveQuizFunction,
			stats: resolveQuizStats,
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