
QuizApp.config(function($routeProvider) {
	
	$routeProvider.when('/new', {
		templateUrl: '/html/new.html',
		controller: NewQuizCntl,
	});
	$routeProvider.when('/quiz/:id', {
		templateUrl: '/html/quiz.html',
		controller: QuizCntl,
		resolve: { /* returning the promise and then resolving the promise as the data */
			quiz: function(HTTPService, $location){
				return HTTPService.GET('/api/quiz/' + $location.path().split('/')[2]).then(function(data) {
					return data;
				});
			},
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
			// user: function(BlogcastHTTPService, BlogcastBasicService){
			// 	return BlogcastHTTPService.getUser().then(function(userData) { 
			// 		BlogcastBasicService.showLoginOrLogoutButton(userData);
			// 		if(userData.twitter_id) {
			// 			return userData;
			// 		} else {
			// 			return null;
			// 		}
			// 	});
			}
		}
	});
});