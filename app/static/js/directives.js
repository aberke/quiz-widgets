/* directives */



var outcomeContainer = function() {
	function modifyContainer(scope, element) {
		element.className += " outcome-container slide";
	}
	function setStyle(model, element) {
		var backgroundImage = "none";
		if (model.pic_url && model.pic_style && model.pic_style != 'float-right') {
			backgroundImage = ("url('" + model.pic_url + "')");
		}
		element.style.backgroundImage = backgroundImage;
	}
	return {
		restrict: 'E',
		link: function(scope, element, attrs) {
			console.log(scope)
			var content = element[0].querySelector('.outcome-content');
			
			scope.$watch("outcome.pic_style", function(value) {
				setStyle(scope.outcome, content);
			});
			scope.$watch("outcome.pic_url", function(value) {
				setStyle(scope.outcome, content);
			});

			setStyle(scope.outcome, content);
			modifyContainer(scope, element[0]);
		},
		templateUrl: '/directiveTemplates/outcome-container.html',
	}
}

var answerContainer = function() {

	function modifyContainer(scope, element) {
		element.className += (" touchable answer-container " + (scope.answer.pic_style || "bottom-right"));

	}
	function setStyle(model, element) {
		var backgroundImage = "none";
		if (model.pic_url && model.pic_style && model.pic_style != 'bottom-right') {
			backgroundImage = ("url('" + model.pic_url + "')");
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