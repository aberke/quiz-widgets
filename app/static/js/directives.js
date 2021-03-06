/* directives */


var quizzes = function(APIservice, UserFactory, $http) {
	/* <quizzes owner="USERID"></quizzes>
			get the quizList of owner or get all quizzes if owner null or undefined
			show ng-repeat: q in quizList
			- use user from outter scope to decide what to show
				- using owner-only-element directive in template
	*/


	function setupFilter(scope) {
		/* Want to filter by the stats
			Stats are set with updates
				- a stat doesn't exist until it is incremented
					- so initialize relevant stats to 0
		*/
		scope.orderOptions = [ /* default is newest -- set in template */
			// the stats recorded
			"started",
			"completed",
			"restarted",

			// ratios computed from stats recorded
			"completed/started",
			"restarted/started",
		];

		scope.quizMap = {}; // {quizID: quiz}
		var qMap = {}; // {qID: index in quizList}
		for (var i=0; i<scope.quizList.length; i++) {
			var q = scope.quizList[i];
			/* initialize stats to 0 in case they don't yet exist (don't exist until updated) */
			q.started = 0;
			q.completed = 0;
			q.restarted = 0;

			qMap[q._id] = i;
			scope.quizMap[q._id] = q;
		}
		function computeStatsRatios() {
			for (j=0; j<scope.quizList.length; j++) {
				var q = scope.quizList[j];
				q["completed/started"] = (q.completed/q.started);
				q["restarted/started"] = (q.restarted/q.started);
			}
		}
		
		/* GET the stats and tack them on to quizzes */
		$http.get('/stats/all/quiz').success(function(sData) {
			for (var i=0; i<sData.length; i++) {
				var s = sData[i];
				var qIndex = qMap[s._quiz];
				if (typeof qIndex == "number") {
					scope.quizList[qIndex][s.model_type] = s.count;
				}
			}
			// now that we have stats, compute the ratios to have those as orderOptions
			computeStatsRatios();
		});
	}
	function setupSearchText(scope) {
		/* Problem:
			user filters for quizzes by searchText -- great
			BUT when they delete characters, aka make filter less strict,
				quizzes reshow as black boxes -- need to reload data
		*/
		scope.$watch('searchText', function(n,o) {
			if (n && o && n.length < o.length) {
				/* inefficient BUT can't re-init existing quizzes, because the filter has changed the HTML */
				$.getScript("/widget/q.js");
			}
		});
	}

	return {
		restrict: 'E',
		scope: {
			owner: '=owner',
		},
		templateUrl: '/directiveTemplates/quizzes.html',
		link: function(scope, element, attrs) {
			UserFactory.then(function(user) {
				scope.user = user;
			});
			/* if looking at all quizzes, show filter */ 
			if (!scope.owner) {
				scope.showFilter = true;
			}

			/* GET the quizzes */
			if (scope.owner) {
				endpoint = ('/user/' + scope.owner + '/quizzes');
			} else {
				endpoint = '/quiz/all';
			}
			APIservice.GET(endpoint).then(function(qData) {
				scope.quizList = qData;
				$.getScript("/widget/q.js"); /* now load the quizzes */
				setupFilter(scope);
			});

			setupSearchText(scope);

			function claimQuiz(quiz) {
				if (!scope.user || quiz._user) { return false; } // directive  owner-only-element should prevent this case

				APIservice.PUT('/user/' + scope.user._id + '/claim-quiz/' + quiz._id).then(function(data) {
					/* successful so update quizList and user.quizList*/
					quiz._user = scope.user;
					scope.user.quizList.push(quiz);
				});
			}
			function relinquishQuiz(quiz) {
				console.log('relinquishQuiz', quiz)
				if (!scope.user || !quiz._user || quiz._user._id != scope.user._id) { return false; } // directive  owner-only-element should prevent this case
				
				APIservice.PUT('/user/' + scope.user._id + '/relinquish-quiz/' + quiz._id).then(function(data) {
					quiz._user = null;
					var quizIndex = scope.user.quizList.indexOf(quiz);
					scope.user.quizList.splice(quizIndex, 1);
				});
			}
			scope.delete = function(quiz) {
				var confirmed = confirm('Are you sure you want to permenantly delete this quiz?  This quiz will no longer show up on any of the pages on which it is embedded.');
				if (!confirmed){ return false; }
				
				APIservice.DELETE('/quiz/' + quiz._id, quiz).then(function(data) {
					var index = scope.quizList.indexOf(quiz);
					scope.quizList.splice(index, 1);
				});
			}
			scope.claimQuiz = claimQuiz;
			scope.relinquishQuiz = relinquishQuiz;
		},
	}
}

var editQuestionsPartial = function() {
	return {
		restrict: 'EA',
		templateUrl: "/directiveTemplates/edit-questions-partial.html",
	}
}
editAnswerKeyPartial = function() {
	return {
		restrict: 'EA',
		templateUrl: "/directiveTemplates/edit-answer-key-partial.html",
	}
}
var editOutcomesPartial = function() {
	return {
		restrict: 'EA',
		templateUrl: "/directiveTemplates/edit-outcomes-partial.html",
	}
}
var editQuizPartial = function(UIService) {

	return {
		restrict: 'EA',
		link: function(scope, element, attrs) {
			
			scope.$watch(
				'quiz.pic_url',
				function() { UIService.updateQuizPic(scope.quiz.pic_url); }
			);
			scope.$watch('quiz.custom_styles',
				function(styles) { UIService.setCustomStyles(styles); }
			);
		},
		templateUrl: "/directiveTemplates/edit-quiz-partial.html",
	}
}


var ownerOnlyElement = function() {
	/* only show these elements to the user who owns the quiz (within scope) */

	function userOwnsQuiz(user, quiz) {
		if (user && user._id 
		&& quiz._user && quiz._user._id 
		&& quiz._user._id==user._id) {
			return true;
		}
		return false;
	}
	function hideOrShowCheck(scope, element) {
		if (!userOwnsQuiz(scope.user, scope.q)) {
			element.style.display = 'none';
		} else {
			element.style.display = 'block';
		}
	}


	return {
		restrict: 'EA',
		link: function(scope, element, attrs) {

			scope.$watch('q._user', function(value) {
				hideOrShowCheck(scope, element[0]);
			});
			hideOrShowCheck(scope, element[0]);
		}
	}
}

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



/* ---------------------- slides below ---------------------------- */

var titleContainer = function() {
	return {
		restrict: 'EC',
		templateUrl: '/directiveTemplates/title-container.html',
	}
}
var answerKeyContainer = function() {
	return {
		restrict: 'EC',
		templateUrl: '/directiveTemplates/answer-key-container.html',
	}
}

var outcomeContainer = function() {
	/* default pic_style treated as 'bottom-right' as to reflect outcomeSchema default */
	function setStyle(model, element) {
		var backgroundImage = "none";
		if (model.pic_url && model.pic_style != 'float-right') {
			backgroundImage = ("url('" + model.pic_url + "')");
		}
		element.style.backgroundImage = backgroundImage;
	}
	return {
		restrict: 'A', // if its class, could interfere with set recresh_icon_url
		link: function(scope, element, attrs) {
			var content = element[0].querySelector('.outcome-content');
			
			scope.$watch("outcome.pic_style", function(value) {
				setStyle(scope.outcome, content);
			});
			scope.$watch("outcome.pic_url", function(value) {
				setStyle(scope.outcome, content);
			});

			setStyle(scope.outcome, content);
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