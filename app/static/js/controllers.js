
function MainCntl($scope, $location) {
	$scope.domain = window.location.origin;
	if ($scope.domain == 'http://quizwidget-petri.dotcloud.com'){
		$scope.domain = 'http://quiz.huffingtonpost.com';
	}

	$scope.user = null;

	$scope.scrollToTop = function() {
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}
	$scope.scrollToById = function(eltID) {
		var elt = $('#' + eltID).eq(0);
		$('html, body').animate({'scrollTop': elt.offset().top}, 'slow', 'swing');
	}
	$scope.goTo = function(path) {
		$location.path(path);
		document.body.scrollTop = document.documentElement.scrollTop = 0;
	}
	$scope.login = function(){
		window.location.href=($scope.domain + '/login');
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
function PublicPreviewCntl($scope, $location, HTTPService) {
	$scope.quiz;

	HTTPService.GETquiz($location.path().split('/')[3]).then(
		function(data) { $scope.quiz = data; }
	);
}
function StatsCntl($scope, $location, HTTPService, quiz, stats) {
	$scope.quiz = quiz;
	console.log('stats',stats)
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
	var countQuestionTotals = function() {
		for (var i=0; i<$scope.quiz.questionList.length; i++) {
			var question = $scope.quiz.questionList[i];
			var sum = 0;
			for (var j=0; j<question.answerList.length; j++) {
				sum += question.answerList[j].count;
			}
			$scope.quiz.questionList[i].count = sum;
		}
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
		countQuestionTotals();
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
			outcome.share.saved = 'saved';
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
	$scope.saveQuizShare = function() { 
		saveQuizShare(function() {
			$scope.quiz.share.saved = 'saved';
		}); 
	}

	var init = function() {
		console.log('QuizCntl', quiz)
		UIService.setupPopovers();
	}
	init();
}
function NewQuizCntl($scope, $location, WidgetService, UIService, FormService, HTTPService) {
	$scope.showAddNewOutcome = false;


	$scope.quiz = { 'title': '',
					'outcomeList':[], // each outcome in outcomeList has an answerList []
					'error':{ 'question':false, 'outcome':false, },		
					'questionList': [], // each question in questionList has an answerList []
					};



	/* ------- outcomes ----------------------- */
	$scope.showingOutcomes = false;
	$scope.showOutcomes = function() {
		if ($scope.quiz.outcomeList.length==0) { 
			$scope.addOutcome();
		}
		$scope.showingOutcomes = true;
	}
	$scope.hideOutcomes = function() {
		if (!saveAllOutcomes()) { return false; }

		$scope.showingOutcomes = false;
	}
	var saveAllOutcomes = function() {
		/* ensures that all is valid before calling setupOutcomeAnswerLists */
		var err = false;
		for (var i=0; i<$scope.quiz.outcomeList.length; i++) {
			if (!saveOutcome($scope.quiz.outcomeList[i])) {
				err = true;
			}
		}
		if (err) {
			$scope.quiz.error.outcome = true;
			return false;
		}
		$scope.quiz.error.outcome = false;
		WidgetService.setupOutcomeAnswerLists($scope.quiz); // gives outcomes answer lists
		return true;
	}
	var saveOutcome = function(outcome) {
		if (FormService.checkOutcomeError(outcome)) {
			outcome.editing = true;
			return false;
		}
		outcome.editing = false;
		return true;
	}
	$scope.saveOutcome = function(outcome) {
		$scope.quiz.error.outcome = false;
		return saveOutcome(outcome);
	}
	$scope.addOutcome = function() {
		/* initializing outcome with fake _id  so that answers can still refer to it by _id with answer._outcome */
		$scope.quiz.outcomeList.push({_id: Math.random(), editing:true});
		//WidgetService.setupOutcomeAnswerLists($scope.quiz); // gives outcomes answer lists
	}

	$scope.removeOutcome = function(outcome) {
		if (outcome.answerList.length > 0) { return false; } // an answer points to it!
		
		$scope.quiz.outcomeList.splice($scope.quiz.outcomeList.indexOf(outcome), 1);
		if ($scope.quiz.outcomeList.length==0) { 
			$scope.showingOutcomes = false;
		} 
		// reset the outcome index's
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
	}
	/* ------- outcomes ----------------------- */


	/* ------- questions ----------------------- */
	$scope.showingQuestions = false;
	$scope.showQuestions = function() {
		if ($scope.quiz.questionList.length==0) {
			$scope.addQuestion();
		}
		$scope.showingQuestions = true;
	}
	$scope.hideQuestions = function() {
		if (!saveAllQuestions()) { return false; }

		$scope.showingQuestions = false;
		return true;
	}
	$scope.addQuestion = function() {
		$scope.quiz.questionList.push({_id: Math.random(), 'answerList':[{},{},], 'editing':true,});
	}
	var saveAllQuestions = function() {
		/* ensures that all is valid before calling setupOutcomeAnswerLists */
		for (var i=0; i<$scope.quiz.questionList.length; i++) {
			if (!saveQuestion($scope.quiz.questionList[i])) {
				$scope.quiz.error.question = true;
				return false;
			}
		}
		$scope.quiz.error.question = false;
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
		return true;
	}
	var saveQuestion = function(question) {
		/* need to have function not call setupOutcomeAnswerLists */
		if (FormService.checkQuestionError(question)) {
			question.editing = true;
			return false;
		}
		question.editing = false;
		return true;
	}
	$scope.saveQuestion = function(question) { // also called by createQuiz
		if (!saveQuestion(question)) { return false; }
		$scope.quiz.error.question = false;
		/* add answers out of their respective outcome.answerList's */
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
		return true;
	}

	$scope.removeQuestion = function(question) {
		$scope.quiz.questionList.splice($scope.quiz.questionList.indexOf(question), 1);
		if ($scope.quiz.questionList.length==0) { 
			$scope.showingQuestions = false;
		}
		/* take all that question's answers out of their respective outcome.answerList's */
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
		return true;
	}
	$scope.addAnswer = function(question) {
		question.answerList.push({_id: Math.random()});
	}
	$scope.removeAnswer = function(question,answer,index) {
		question.answerList.splice(index, 1);
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
	}
	/* ------- questions ----------------------- */


	$scope.createQuiz = function() {
		$scope.quiz.saved = 'saving';
		console.log('createQuiz', $scope.quiz)
		/* get rid of the circular json -- take out outcome.answerList's */
		for (var i=0; i<$scope.quiz.outcomeList.length; i++) {
			$scope.quiz.outcomeList[i].answerList = null;
		}
		/* error checking */
		var err = false;
		if (!saveAllQuestions()) {
			err = true;
			$scope.showQuestions();
		}
		if (!saveAllOutcomes()) {
			err = true;
			$scope.showOutcomes();

		}
		if (err) {
			$scope.quiz.saved = null;
			return false;
		}
		/* ready to post quiz */
		HTTPService.POST('/api/quiz', $scope.quiz).then(function(data) {
			$scope.quiz.saved = 'saved';
			console.log('POSTED QUIZ',$scope.quiz,'got back data', data);
			$location.path('/quiz/' + data._id);
		});
	};
	$scope.updateQuizPic = function() { UIService.updateQuizPic($scope.quiz.pic_url); }

	var init = function() {
		UIService.setupPopovers();
	}
	init();
}
function EditCntl($scope, $location, FormService, HTTPService, UIService, WidgetService, quiz) {
	$scope.quiz = quiz;

	/* outcomeMap: {outcomeID: outcome} 
		-- outcomeList morphed into this object for easier use with answers
		each outcome has an answerList so that don't remove objects that answers point to
	
	*/
	$scope.outcomeMap;

	var setWatchers = function() {
		function changeFunction(object, callback) {
			return function(oldv, newv) {
				if (oldv != newv) { 
					object.saved = 'unsaved';
					if (callback) { callback(); }
				}
			}
		}
		var attributes = ['title', 'pic_url', 'pic_credit', 'refresh_icon_url'];
		for (var i=0; i<attributes.length; i++) {
			$scope.$watch(
				'quiz.' + attributes[i],
				changeFunction($scope.quiz)
			);
		}
		$scope.$watch(
			'quiz.pic_url',
			function() { UIService.updateQuizPic($scope.quiz.pic_url); }
		);
	}

	var reloadQuiz = function() {
		/* reloads widget, reloads $scope.quiz */
		HTTPService.GETquiz($scope.quiz._id).then(function(data) {
			reloadWidget(data);
			$scope.quiz = data;
			WidgetService.setupOutcomeAnswerLists($scope.quiz);
			setWatchers();
		});
	}
	$scope.reloadQuiz = reloadQuiz;
	/* sometimes want to reload just widget so that .saved properties dont change */
	var reloadWidget = function(data) {
		quizWidgets[$scope.quiz._id].reloadData(data || $scope.quiz);
	}

	/* helper functions to remove, update, create for resolving promise */
	var APIsuccess = function(object, callback) {
		return function(successData) {
			object.editing = false;
			object.saved = 'saved';
			reloadWidget();
			if (callback) { callback(successData); }
		};
	}
	var APIerror = function(object) {
		/* yes its simple but make error handling always the same -- so call this helper to generate function */
		return function(err) { object.saved = 'error'; };
	}

	/* remove ------------------------------------------------- */

	$scope.removeOutcome = function(outcome) {
		if (outcome.answerList && outcome.answerList.length > 0) { return false; } // an answer points to it!
		
		/* remove from the outcomeList */
		var index = $scope.quiz.outcomeList.indexOf(outcome);

		if (!outcome._id) {
			$scope.quiz.outcomeList.splice(index, 1);
		} else {
			remove('outcome', outcome, function() {
				$scope.quiz.outcomeList.splice(index, 1);
			});
		}
	};
	$scope.removeAnswer = function(question, answer) {
		var index = question.answerList.indexOf(answer);
		if (index < 1) { return false; } // can't remove 1st 2 answers

		/* if answer doesnt have real mongo id then not saved server side */
		if (answer._id) {
			remove('answer', answer, function() {
				question.answerList.splice(index, 1);
				WidgetService.setupOutcomeAnswerLists($scope.quiz);
			});
		} else {
			question.answerList.splice(index, 1);
		}
	}
	$scope.removeQuestion = function(question) {
		var index = $scope.quiz.questionList.indexOf(question);
		if (index < 1) { return false; }

		if (!question._id) {
			$scope.quiz.questionList.splice(index, 1);
		} else {
			remove('question', question, function() {
				$scope.quiz.questionList.splice(index, 1);
				WidgetService.setupOutcomeAnswerLists($scope.quiz);
			});
		}
	}

	var remove = function(type, object, callback) {
		object.saved = 'deleting';
		HTTPService.DELETE('/api/' + type + '/' + object._id, object).then(
			APIsuccess(object, callback), // returns a function
			APIerror(object)
		);
	}

	/* remove above ------------------------------------------- */

	/* addNew == POST request --------------------------------- */
	var create = function(type, object, callback) {
		object.saved = 'saving';
		HTTPService.POST('/api/' + type, object).then(
			APIsuccess(object, callback), // returns a function
			APIerror(object)
		);
	}
	/* addNew == POST requests above ------------------------- */


	/* save == PUT request -----------------------------
		-- each object is given a saved field
			- set to 'saved' on successful PUT
			- set to 'unsaved' on change
			- set to 'saving' on transition
			- set to 'error' on error

		-- after saving: reload widget with new Quiz Data
	*/
	var update = function(type, object, callback) {
		object.saved = 'saving';
		HTTPService.PUT('/api/' + type + '/' + object._id, object).then(
			APIsuccess(object, callback),
			APIerror(object)
		);
	}
	$scope.saveQuiz = function() {
		update('quiz', $scope.quiz, false);
		reloadWidget();
	}

	$scope.saveQuestion = function(question) {
		if (FormService.checkQuestionError(question)) {
			return false;
		}

		var answersCalledback = 0;
		var answerCallback = function() {
			answersCalledback += 1;
			if (answersCalledback == question.answerList.length) {
				WidgetService.setupOutcomeAnswerLists($scope.quiz);
				question.editing = false;
				question.saved = 'saved';
			}
		}
		var questionCallback = function(questionData) {
			question._id = questionData._id;
			question.editing = true;
			question.saved = 'saving';

			/* save all the answers with returned questionData._id */
			for (var i=0; i<question.answerList.length; i++) {
				var answer = question.answerList[i];
				answer._question = question._id;
				if (!answer._id) {
					var j = i; // i will continue iterating
					create('answer', answer, function(data) {
						question.answerList[j] = data;
						answerCallback();
					});
				} else {
					update('answer', answer, answerCallback);
				}
			}
		}

		if (question._id) {
			update('question', question, questionCallback);
		} else {
			question._quiz = $scope.quiz._id;
			create('question', question, questionCallback);
		}
	}
	$scope.saveOutcome = function(outcome) {
		if (FormService.checkOutcomeError(outcome)) { return false; }
		
		if (!outcome._id) { /* create new outcome */
			outcome['_quiz'] = $scope.quiz._id;
			create('outcome', outcome, function(data) {
				var index = $scope.quiz.outcomeList.indexOf(outcome);
				$scope.quiz.outcomeList[index] = data; // needs the _id
			});
		} else { /* update existing outcome */
			update('outcome', outcome);
		}
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
	};
	/* ------- save == PUT requests above ------------- */

	var init = function() {
		UIService.setupPopovers();
		UIService.updateQuizPic($scope.quiz.pic_url);
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
		setWatchers();
		console.log('done with EditCntl init', $scope.quiz)
	}
	init();
}








