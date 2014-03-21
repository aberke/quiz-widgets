/* directives */

var answerContainer = function() {
	console.log('answerContainer');

	function modifyContainer(scope, element) {
		console.log('element', element, element.ngStyle)
		element.className += (" touchable answer-container " + (scope.answer.pic_style || "bottom-right"));

	}
	function template(answer) {
		var html = "";
		if (answer.pic_style == 'bottom-right') {

		}
	}
	function setStyle(answer) {
		if (answer.pic_url && answer.pic_style != 'bottom-right') {
			console.log('! bottom-right');
			answer.style = ("{'background-image':url('" + answer.pic_url + "')}");
		}
	}


	return {
		restrict: 'E',
		//scope: { answer: '=answer' },
		link: function(scope, element, attrs) {
			console.log('scope.answer', scope.answer, attrs)

			scope.answer.style = scope.answer.text;

			scope.$watch(scope.answer.text, function(value) {
				console.log('value', value);
			});

			//setStyle(scope.answer);
			modifyContainer(scope, element[0]);
		},
		templateUrl: '/directiveTemplates/answer-container.html',
	}
}