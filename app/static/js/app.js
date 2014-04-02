/* route handling file */
var QuizApp = angular.module('QuizApp', ['ngRoute'])

	.config(function($locationProvider) {
		
		$locationProvider.html5Mode(true);

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
		$compileProvider.directive('answerContainer', answerContainer);
		$compileProvider.directive('outcomeContainer', outcomeContainer);
		$compileProvider.directive('ownerOnlyElement', ownerOnlyElement);

		// register factories
		$provide.factory('UserFactory', UserFactory);
	});