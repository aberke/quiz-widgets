/* route handling file */
var QuizApp = angular.module('QuizApp', ['ngRoute'])

	.config(function($locationProvider) {
		
		$locationProvider.html5Mode(true);

	})

	.config(function($sceDelegateProvider) {
		$sceDelegateProvider.resourceUrlWhitelist([
			// Allow same origin resource loads.
			'self',
			// Allow loading from our assets domain.  Notice the difference between * and **.
			'https://docs.google.com/**',
			'http://docs.google.com/**'
		]);
	})

	.config(function($provide, $compileProvider) {
	
		// register services
		$provide.service('UIService', UIService);
		$provide.service('APIservice', APIservice);
		$provide.service('StatService', StatService);
		$provide.service('FormService', FormService);
		$provide.service('WidgetService', WidgetService);

		// register directives
		$compileProvider.directive('quizzes', quizzes);
		$compileProvider.directive('imgInputLabel', imgInputLabel);
		$compileProvider.directive('titleContainer', titleContainer);
		$compileProvider.directive('answerContainer', answerContainer);
		$compileProvider.directive('outcomeContainer', outcomeContainer);
		$compileProvider.directive('ownerOnlyElement', ownerOnlyElement);
		$compileProvider.directive('answerKeyContainer', answerKeyContainer);
		
		$compileProvider.directive('editQuizPartial', editQuizPartial);
		$compileProvider.directive('editOutcomesPartial', editOutcomesPartial);
		$compileProvider.directive('editQuestionsPartial', editQuestionsPartial);

		// register factories
		$provide.factory('UserFactory', UserFactory);
	});



