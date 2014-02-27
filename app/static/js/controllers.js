
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

function IndexCntl($scope, HTTPService, quizList) {
	$scope.quizList = quizList;


	var init = function() {
		console.log('IndexCntl', quizList)
	}
	init();
}
function QuizCntl($scope, $location, HTTPService, quiz) {
	$scope.quiz = quiz;
		console.log('QuizCntl', quiz)

	$scope.delete = function() {
		var confirmed = confirm('Are you sure you want to permenantly delete this quiz?  This quiz will no longer show up on any of the pages on which it is embedded.');
		if (!confirmed){ return false; }
		
		HTTPService.DELETE('/api/quiz/' + quiz._id, $scope.quiz).then(function(data) {
			console.log('delete returned: ', data);
			$location.path('/');
		});
	}

	var init = function() {
		console.log('QuizCntl', quiz)
	}
	init();
}
function ShareCntl($scope, UIService, FormService, HTTPService, quiz) {
	$scope.quiz = quiz;
	$scope.quiz.share = (quiz.share || {});

	for (var i=0; i<quiz.outcomeList.length; i++) {
		console.log($scope.quiz.outcomeList[i])
		$scope.quiz.outcomeList[i].share = (quiz.outcomeList[i].share || {});
	}

	$scope.saveOutcomeShare = function(outcome) {
		HTTPService.PUT('/api/outcome/' + outcome._id + '/share', outcome.share).then(function(data) {
			console.log('data', data);
		});
	}
	$scope.saveQuizShare = function() {
		console.log('saveQuizShare', $scope.quiz.share)
		HTTPService.PUT('/api/quiz/' + $scope.quiz._id + '/share', $scope.quiz.share).then(function(data) {
			console.log('data', data);
		});
	}

	var init = function() {
		console.log('QuizCntl', quiz)
	}
	init();
}
function NewQuizCntl($scope, $location, UIService, FormService, HTTPService) {
	$scope.showAddNewOutcome = false;


	$scope.quiz = { 'title': '',
					'outcomeList': [],
					'questionList': [],
					'share': {},
					};


	$scope.updateQuizPic = function() {
		UIService.addStyle('.huffpostlabs-quiz::after {background-image: url(' + $scope.quiz.pic_url + ');}');
	}

	$scope.addNewOutcome = function(new_outcome) {
		/* validate form */
		FormService.removeAllErrors();
		var err1 = FormService.checkInput(['new-outcome-text']);
		if (err1) {
			return false;
		}
		$scope.showAddNewOutcome = false;

		new_outcome['index'] = $scope.quiz.outcomeList.length + 1;
		$scope.quiz.outcomeList.push(new_outcome);

		$scope.new_outcome = {};
	}
	$scope.addNewQuestion = function(new_question) {
		FormService.removeAllErrors();
		var err1 = FormService.checkInput([ 'new-question-text']);
		var m1 = ($scope.new_question && $scope.new_question.answer1) ? $scope.new_question.answer1.outcome : null;
		var m2 = ($scope.new_question && $scope.new_question.answer2) ? $scope.new_question.answer2.outcome : null;
		

		var err2 = FormService.checkModel([ {'model':m1,'elementID':'new-question-answer1-outcome'},
									 		{'model':m2,'elementID':'new-question-answer2-outcome'},
											]);
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





