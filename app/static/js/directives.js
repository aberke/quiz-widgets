/* directives */

var answerContainer = function() {

	function modifyContainer(scope, element) {
		element.className += (" touchable answer-container " + (scope.answer.pic_style || "bottom-right"));

	}
	function setStyle(answer, element) {
		var backgroundImage = "none";
		if (answer.pic_url && answer.pic_style && answer.pic_style != 'bottom-right') {
			backgroundImage = ("url('" + answer.pic_url + "')");
		}
		element.style.backgroundImage = backgroundImage;
	}


	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			
			scope.$watch("answer.pic_style", function(value) {
				setStyle(scope.answer, element[0]);
			});
			scope.$watch("answer.pic_url", function(value) {
				setStyle(scope.answer, element[0]);
			});

			setStyle(scope.answer, element[0]);
			modifyContainer(scope, element[0]);
		},
		templateUrl: '/directiveTemplates/answer-container.html',
	}
}