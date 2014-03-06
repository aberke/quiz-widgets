
function MainCntl($scope, $location) {
	$scope.domain = window.location.origin;
	if ($scope.domain == 'http://quizwidget-petri.dotcloud.com'){
		$scope.domain = 'http://quiz.huffingtonpost.com';
	}

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
	$scope.totalSharesFB;
	$scope.totalSharesTwitter;
		console.log('QuizCntl', quiz)

	$scope.delete = function() {
		var confirmed = confirm('Are you sure you want to permenantly delete this quiz?  This quiz will no longer show up on any of the pages on which it is embedded.');
		if (!confirmed){ return false; }
		
		HTTPService.DELETE('/api/quiz/' + quiz._id, $scope.quiz).then(function(data) {
			console.log('delete returned: ', data);
			$location.path('/');
		});
	}
	var countTotalSharesFB = function(quiz) {
		var count = (quiz.share ? quiz.share.fbCount : 0);
		for (var i=0; i<quiz.outcomeList.length; i++) {
			var o = quiz.outcomeList[i];
			count += (o.share ? o.share.fbCount : 0);
		}
		return count;
	}
	var countTotalSharesTwitter = function(quiz) {
		var count = (quiz.share ? quiz.share.twitterCount : 0);
		for (var i=0; i<quiz.outcomeList.length; i++) {
			var o = quiz.outcomeList[i];
			count += (o.share ? o.share.twitterCount : 0);
		}
		return count;
	}

	var init = function() {
		console.log('QuizCntl', quiz)
		$scope.totalSharesFB = countTotalSharesFB(quiz);
		$scope.totalSharesTwitter = countTotalSharesTwitter(quiz);
	}
	init();
}
function ShareCntl($scope, UIService, FormService, HTTPService, quiz) {
	$scope.quiz = quiz;
	$scope.quiz.share = (quiz.share || {});
	$scope.shareLinkSaved = false;

	for (var i=0; i<quiz.outcomeList.length; i++) {
		console.log($scope.quiz.outcomeList[i])
		$scope.quiz.outcomeList[i].share = (quiz.outcomeList[i].share || {});
	}

	$scope.saveOutcomeShare = function(outcome) {
		HTTPService.PUT('/api/outcome/' + outcome._id + '/share', outcome.share).then(function(data) {
			console.log('data', data);
		});
	}
	var saveQuizShare = function(callback) {
		HTTPService.PUT('/api/quiz/' + $scope.quiz._id + '/share', $scope.quiz.share).then(function(data) {
			console.log('data', data);
			if (callback) { callback(data); }
		});
	}
	$scope.saveQuizShareLink = function(link) {
		$scope.quiz.share.link = link;
		saveQuizShare(function() {
			$scope.shareLinkSaved = true;
		});
	}
	$scope.saveQuizShare = function() { saveQuizShare(); }

	var init = function() {
		console.log('QuizCntl', quiz)
		UIService.setupPopovers();
	}
	init();
}
function NewQuizCntl($scope, $location, UIService, FormService, HTTPService) {
	$scope.showAddNewOutcome = false;


	$scope.quiz = { 'title': '',
					'outcomeList': [],
					'questionList': [],
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
	$scope.removeOutcome = function(outcome) {

		$scope.quiz.outcomeList.splice(outcome.index-1, 1); // outcome.index is not zero-indexed
		
		/* decrement the index of all the outcomes that followed */
		for (var i=outcome.index-1; i<$scope.quiz.outcomeList.length; i++) {
			$scope.quiz.outcomeList[i].index = i + 1;
		}
	}
	$scope.removeQuestion = function(question) {

		$scope.quiz.questionList.splice(question.index-1, 1); // question.index is not zero-indexed
		
		/* decrement the index of all the outcomes that followed */
		for (var i=question.index-1; i<$scope.quiz.questionList.length; i++) {
			$scope.quiz.questionList[i].index = i + 1;
		}
	}
	$scope.addNewQuestion = function(new_question) {
		console.log('addNewQuestion', new_question)

		FormService.removeAllErrors();
		var err = FormService.checkInput([ 'new-question-text']);

		for (var i=0; i<new_question.answerList.length; i++) {
			var model = ($scope.new_question.answerList[i].outcome || null);
			if (FormService.checkModel([ {'model':model,'elementID':'new-answer-' + (i+1) + '-outcome'}])) {
				err = true;
			}
		}
		if (err) { return false; }

		$scope.showAddNewQuestion = false;

		new_question['index'] = $scope.quiz.questionList.length + 1;
		$scope.quiz.questionList.push(new_question);

		$scope.showAddNewQuestion=false;
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





