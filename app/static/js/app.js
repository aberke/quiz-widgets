/* route handling file */
var QuizApp = angular.module('QuizApp', ['ngRoute'])

	.config(function($locationProvider) {
		
		$locationProvider.html5Mode(true);

	})

	.config(function($provide, $compileProvider) {
	
		// register services
		$provide.service('UIService', UIService);
		$provide.service('StatService', StatService);
		$provide.service('HTTPService', HTTPService);
		$provide.service('FormService', FormService);
		$provide.service('WidgetService', WidgetService);

		// register directives
		$compileProvider.directive('imgInputLabel', imgInputLabel);
		$compileProvider.directive('answerContainer', answerContainer);
		$compileProvider.directive('outcomeContainer', outcomeContainer);
	});