/* directives */



var imgInputLabel = function() {

	 function checkImageSize(model, img_url, maxSize, callback) {
	 	if (!img_url) { return; }

		var img = document.createElement('img');
		img.onload = function() {
			if (img.width > maxSize || img.height > maxSize) {
				callback();
			} 
		};
		img.src=img_url;
	}

	return {
		restrict: 'E',
		scope: {
			model: '=model',
			maxImgSize: '=maxSize',
			hideLabel: '=hideLabel', // if true: show just warning when its too large and not the label
		},
		link: function(scope, element, attrs) {
			scope.model.maxImgSize = (scope.maxImgSize || scope.model.maxImgSize || 200);
			
			scope.$watch("model.pic_url", function(value) {
				scope.model.big_img = false;
				// callback only called if image too large
				checkImageSize(scope.model, value, scope.model.maxImgSize, function() {
					scope.model.big_img = true;
					scope.$apply();
				});
			});
		},
		templateUrl: '/directiveTemplates/img-input-label.html',
	}
}

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

	function setClassName(scope, element) {
		element.className = ("touchable answer-container " + (scope.answer.pic_style || "bottom-right"));

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
				setClassName(scope, element[0]);
				setStyle(scope.answer, element[0]);
			});
			scope.$watch("answer.pic_url", function(value) {
				setStyle(scope.answer, element[0]);
			});

			setStyle(scope.answer, element[0]);
			setClassName(scope, element[0]);
		},
		templateUrl: '/directiveTemplates/answer-container.html',
	}
}