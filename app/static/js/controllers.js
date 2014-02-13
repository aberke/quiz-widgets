
function MainCntl($scope, $location) {
	$scope.domain = window.location.origin;
	$scope.user = null;


	$scope.newPage = function(){
		$location.path('/new');
	}
	$scope.goTo = function(url) {
		window.location.href=url;
	}
	$scope.login = function(){
		window.location.href=($scope.domain + '/auth/twitter');
	}
	$scope.logout = function(){
		window.location.href=($scope.domain + '/logout');
	}
}

function IndexCntl($scope) {
	console.log('IndexCntl')
}
function NewQuizCntl($scope, $location, UIService, FormService, HTTPService) {
	$scope.showAddNewOutcome = false;


	$scope.quiz = { 'title': '',
					'outcomeList': [{"index": 1, "text": "You are bananas.",
								    "pic_url": "http://www.fairtrasa.com/wp-content/themes/simplicity/functions/thumb.php?src=wp-content/uploads/2012/08/shutterstock_99478112.jpg&w=534&h=&zc=1&q=90"},
								   ],
					'questionList': [],
					};

	$scope.addNewOutcome = function(new_outcome) {
		/* validate form */
		FormService.removeAllErrors();
		var err1 = FormService.checkInput(['new-outcome-text']);
		var err2 = FormService.checkModel([{'model':$scope.new_outcome.pic_url,'elementID':'new-outcome-pic-url'}]);
		if (err1 || err2) {
			return false;
		}

		$scope.showAddNewOutcome = false;

		new_outcome['index'] = $scope.quiz.outcomeList.length + 1;
		$scope.quiz.outcomeList.push(new_outcome);

		$scope.new_outcome = {};
	}
	$scope.addNewQuestion = function(new_question) {
		FormService.removeAllErrors();
		var err1 = FormService.checkInput([ 'new-question-text',
											'new-question-answer1-text',
											'new-question-answer2-text',
												]);
		var m1 = ($scope.new_question && $scope.new_question.answer1) ? $scope.new_question.answer1.outcome : null;
		var m2 = ($scope.new_question && $scope.new_question.answer2) ? $scope.new_question.answer2.outcome : null;
		var m3 = ($scope.new_question && $scope.new_question.answer1) ? $scope.new_question.answer1.pic_url : null;
		var m4 = ($scope.new_question && $scope.new_question.answer2) ? $scope.new_question.answer2.pic_url : null;
		

		var err2 = FormService.checkModel([ {'model':m1,'elementID':'new-question-answer1-outcome'},
									 		{'model':m2,'elementID':'new-question-answer2-outcome'},
											{'model':m3,'elementID':'new-question-answer1-pic-url'},
											{'model':m4,'elementID':'new-question-answer2-pic-url'},]);
		if (err1 || err2) { return false; }

		$scope.showAddNewQuestion = false;

		new_question['index'] = $scope.quiz.questionList.length + 1;
		$scope.quiz.questionList.push(new_question);

		$scope.new_question = {};
	}
	$scope.createQuiz = function() {
		console.log('createQuiz', $scope.quiz)

		HTTPService.POST('/api/quiz', $scope.quiz).then(function(data) {
			console.log('data', data)
			$location.path('/quiz/' + data._id);
		});
	};



	var init = function() {
		UIService.setupPopovers();
		console.log('NewCntl')
	}
	init();
}





