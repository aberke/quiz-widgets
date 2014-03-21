/* route handling file */
var QuizApp = angular.module('QuizApp', ['ngRoute'])

	.config(function($locationProvider) {
		
		$locationProvider.html5Mode(true);

	})

	.config(function($provide) {
	
		// register services
		$provide.service('UIService', UIService);
		$provide.service('HTTPService', HTTPService);
		$provide.service('FormService', FormService);
		$provide.service('WidgetService', WidgetService);

	});