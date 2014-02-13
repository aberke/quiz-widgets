
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
function NewQuizCntl($scope, UIService, FormService) {
	$scope.showAddNewOutcome = false;


	$scope.quiz = { 'title': 'This is the title of the quiz',
					'outcomeList': [{"index": 1, "text": "You are bananas.",
								    "pic_url": "http://www.fairtrasa.com/wp-content/themes/simplicity/functions/thumb.php?src=wp-content/uploads/2012/08/shutterstock_99478112.jpg&w=534&h=&zc=1&q=90"},
								   ],
					'questionList': [],
					};

	$scope.addNewOutcome = function(new_outcome) {
		/* validate form */
		var errors = FormService.checkInputEmpty(['new-outcome-pic-url','new-outcome-text']);
		if (errors) {
			return false;
		}

		$scope.showAddNewOutcome = false;

		new_outcome['index'] = $scope.quiz.outcomeList.length + 1;
		$scope.quiz.outcomeList.push(new_outcome);

		$scope.new_outcome = {};
	}
	$scope.addNewQuestion = function(new_question) {
		$scope.showAddNewQuestion = false;

		new_question['index'] = $scope.quiz.questionList.length + 1;
		$scope.quiz.questionList.push(new_question);

		$scope.new_question = {};
	}



	var init = function() {
		UIService.setupPopovers();
		console.log('NewCntl')
	}
	init();
}





