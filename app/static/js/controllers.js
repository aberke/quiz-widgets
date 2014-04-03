
function MainCntl($scope, $location, UserFactory) {
	$scope.domain = window.location.origin;
	$scope.user;
	$scope.docDictionary;


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
		window.location.href=($scope.domain + '/auth/login');
	}
	$scope.logout = function(){
		window.location.href=($scope.domain + '/auth/logout');
	}
	var init = function(){
		UserFactory.then(function(user) {
			$scope.user = user;
		});
		$.getJSON("/documentation/documentation.json", function(data) {
			$scope.docDictionary = data;
		});
	}
	init();
}
function UserCntl($scope, $routeParams, userList) {
	$scope.userList = userList;
	$scope.searchText;

	var init = function() {
		var search = $routeParams.search;
		if (search && search != 'all') {
			$scope.searchText = search;
		}	
	}
	init();
}

function IndexCntl($scope) {
	var init = function() {
		console.log('IndexCntl')
	}
	init();
}

function DocumentationCntl($scope, $routeParams) {
	// $scope.docDitionary set in MainCtl
	$scope.doc;

	// callback for getJSON documentation.json
	var setup = function(docDictionary) {
		$scope.docDictionary = docDictionary;
		var docString = ($routeParams.docString || null);

		$scope.doc =  (docString ? docDictionary[docString] : null);
		$scope.$apply();
	}
	var init = function() {
		setup($scope.docDictionary); // docDictionary set in MainCntl
	}
	init();
}

function PublicPreviewCntl($scope, $location, APIservice) {
	$scope.quiz;

	APIservice.GETquiz($location.path().split('/')[3]).then(function(data) { 
		$scope.quiz = data;
		$.getScript("/widget/q.js"); /* now load the quizzes */
	});
}
function StatsCntl($scope, quiz, stats) {

	$scope.quiz = quiz;
	$scope.stats = stats;

	var combineStats = function() {
		/* for backwards compatibility */
		$scope.stats.started = ((stats.started || 0) + (quiz.startedCount || 0));
		$scope.stats.completed = ((stats.completed || 0) + (quiz.completedCount || 0));

		$scope.stats['Answer'] = ($scope.stats['Answer'] || {});
		for (var q=0; q<quiz.questionList.length; q++) {
			var question = quiz.questionList[q];
			for (var i=0; i<question.answerList.length; i++) {
				var a = question.answerList[i];
				$scope.stats['Answer'][a._id] = ((stats['Answer'][a._id] || 0) + a.count);
			}
		}
		$scope.stats['Outcome'] = ($scope.stats['Outcome'] || {});
		for (var i=0; i<quiz.outcomeList.length; i++) {
			var o = quiz.outcomeList[i];
			$scope.stats['Outcome'][o._id] = ((stats['Outcome'][o._id] || 0) + o.count);
		}
	}
	$scope.totalSharesFB;
	$scope.totalSharesTwitter;

	// USING??
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
		combineStats(); /* for backwards compatibility */
		$scope.totalSharesFB = countTotalSharesFB(quiz);
		$scope.totalSharesTwitter = countTotalSharesTwitter(quiz);
	}
	init();
}
function ShareCntl($scope, UIService, FormService, APIservice, quiz) {
	$scope.quiz = quiz;
	$scope.quiz.share = (quiz.share || {});
	$scope.shareLinkSaved = false;

	for (var i=0; i<quiz.outcomeList.length; i++) {
		$scope.quiz.outcomeList[i].share = (quiz.outcomeList[i].share || {});
	}

	$scope.saveOutcomeShare = function(outcome) {
		APIservice.PUT('/quiz/' + $scope.quiz._id + '/outcome/' + outcome._id + '/share', outcome.share).then(function(data) {
			console.log('data', data);
			outcome.share.saved = 'saved';
		});
	}
	var saveQuizShare = function(callback) {
		APIservice.PUT('/quiz/' + $scope.quiz._id + '/share', $scope.quiz.share).then(function(data) {
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
function NewQuizCntl($scope, $location, WidgetService, UIService, FormService, APIservice, user) {
	$scope.user = user;
	$scope.showAddNewOutcome = false;


	$scope.quiz = { '_user': $scope.user._id,
					'title': '',
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
		APIservice.POST('/quiz', $scope.quiz).then(function(data) {
			$scope.quiz.saved = 'saved';
			console.log('POSTED QUIZ',$scope.quiz,'got back data', data);
			$location.path('/stats/' + data._id);
		});
	};
	$scope.updateQuizPic = function() { UIService.updateQuizPic($scope.quiz.pic_url); }

	var init = function() {
		UIService.setupPopovers();
	}
	init();
}
function EditCntl($scope, FormService, APIservice, UIService, WidgetService, quiz) {
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
		APIservice.GETquiz($scope.quiz._id).then(function(data) {
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
		var endpoint = (type == 'quiz') ? '' : ('/quiz/' + $scope.quiz._id);
		endpoint += ('/' + type + '/' + object._id);
		APIservice.DELETE(endpoint, object).then(
			APIsuccess(object, callback), // returns a function
			APIerror(object)
		);
	}

	/* remove above ------------------------------------------- */

	/* addNew == POST request --------------------------------- */
	var create = function(type, object, callback) {
		object.saved = 'saving';
		var endpoint = (type == 'quiz') ? '' : ('/quiz/' + $scope.quiz._id);
		endpoint += ('/' + type);
		APIservice.POST(endpoint, object).then(
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
		var endpoint = (type == 'quiz') ? '' : ('/quiz/' + $scope.quiz._id);
		endpoint += ('/' + type + '/' + object._id);
		APIservice.PUT(endpoint, object).then(
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
	}
	init();
}








