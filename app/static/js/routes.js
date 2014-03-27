
QuizApp.config(function($routeProvider) {

	/* helper function used in resolve parameter 
		- for: resolve : {quiz: promise returning function } 
		- returns promise rather than data bc routeProvider wont render controller until promise resolved
	*/
	var resolveQuizFunction = function(HTTPService, $location) {
		return HTTPService.GETquiz($location.path().split('/')[2]).then(
			function(data) { return data; }
		);
	};
	
	$routeProvider.when('/forbidden', {
		templateUrl: '/html/forbidden.html',
	});	
	$routeProvider.when('/new', {
		templateUrl: '/html/new.html',
		controller: NewQuizCntl,
	});	
	$routeProvider.when('/social/:id', {
		templateUrl: '/html/social.html',
		controller: ShareCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quiz: resolveQuizFunction,
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
		}
	});
	$routeProvider.when('/', {
		templateUrl: '/html/index.html',
		controller: IndexCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quizList: function(HTTPService){
				return HTTPService.GET('/api/quiz/all').then(function(data) {
					return data;
				});
			}
		}
	});
});