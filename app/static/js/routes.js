
QuizApp.config(function($routeProvider) {
	
	$routeProvider.when('/new', {
		templateUrl: '/html/new.html',
		controller: NewQuizCntl
	});
	$routeProvider.when('/quiz/:id', {
		templateUrl: '/html/quiz.html',
		controller: QuizCntl
	});
	$routeProvider.when('/', {
		templateUrl: '/html/index.html',
		controller: IndexCntl
	});

});