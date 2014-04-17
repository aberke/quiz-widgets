
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
		UIService.setupPopovers();
	}
	init();
}

function NewQuizCntl($scope, $location, WidgetService, UIService, FormService, APIservice, user, quizType) {

	/* ------- outcomes ----------------------- */

	var saveAllOutcomes = function() {
		/* ensures that all is valid before calling setupOutcomeAnswerLists */
		$scope.quiz.error.outcome = false;
		for (var i=0; i<$scope.quiz.outcomeList.length; i++) {
			if (!saveOutcome($scope.quiz.outcomeList[i])) {
			$scope.quiz.error.outcome = true;
			}
		}
		if ($scope.quiz.error.outcome) { return false; }

		WidgetService.setupOutcomeAnswerLists($scope.quiz); // gives outcomes answer lists
		return true;
	}
	var saveOutcome = function(outcome) {
		if (FormService.checkOutcomeError(outcome, quizType)) {
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
	var createOutcome = function() { return {_id: Math.random(), editing:true, rules:{} }; }
	$scope.addOutcome = function() {
		/* initializing outcome with fake _id  so that answers can still refer to it by _id with answer._outcome */
		$scope.quiz.outcomeList.push(createOutcome());
	}

	$scope.removeOutcome = function(outcome) {
		if (outcome.answerList && outcome.answerList.length > 0) { return false; } // an answer points to it!	
		$scope.quiz.outcomeList.splice($scope.quiz.outcomeList.indexOf(outcome), 1);
	}
	/* ------- outcomes ----------------------- */


	/* ------- questions ----------------------- */
	var createQuestion = function() { return {_id: Math.random(), 'answerList':[createAnswer(),createAnswer()], 'editing':true,}; }
	$scope.addQuestion = function() {
		/* create question with an _id and 2 answers - each with _id */
		$scope.quiz.questionList.push(createQuestion());
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
		if (FormService.checkQuestionError(question, quizType)) {
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
	}

	$scope.removeQuestion = function(question) {
		$scope.quiz.questionList.splice($scope.quiz.questionList.indexOf(question), 1);
		/* take all that question's answers out of their respective outcome.answerList's */
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
	}
	var createAnswer = function() { return {_id: Math.random()}; }
	$scope.addAnswer = function(question) {
		question.answerList.push(createAnswer());
	}
	$scope.removeAnswer = function(question,answer,index) {
		question.answerList.splice(index, 1);
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
	}
	/* ------- questions ----------------------- */


	$scope.createQuiz = function() {
		$scope.quiz.saved = 'saving';

		/* error checking */
		var err = false;
		if (!saveAllQuestions()) { err = true; }
		if (!saveAllOutcomes()) { err = true; }
		if (err) {
			$scope.quiz.saved = null;
			return false;
		}

		/* ready to post quiz */
		APIservice.POST('/quiz', $scope.quiz).then(function(data) {
			$scope.quiz.saved = 'saved';
			console.log('POSTED QUIZ',$scope.quiz,'\n*****\ngot back data', data);
			$location.path('/stats/' + data._id);
		});
	};

	var init = function() {

		console.log('quizType',quizType)

		/* construct quiz that will be passed to the parent QuizCntl */
		var quiz = { 	'_user': 		user._id,
						'outcomeList':  [], // each outcome in outcomeList has an answerList []
						'error': 		{ 'question':false, 'outcome':false, },		
						'questionList': [createQuestion()], // each question in questionList has an answerList []
						'type': 		(quizType || 'default-quiz'),
					};
		if (quizType != 'trivia-quiz') { quiz.outcomeList.push(createOutcome()); }
		$scope.quiz = quiz;
		UIService.setupPopovers();
	}
	init();
}
function EditQuizCntl($scope, FormService, APIservice, UIService, WidgetService, quiz) {

	var setWatchers = function() {
		function changeFunction(object, callback) {
			return function(oldv, newv) {
				if (oldv != newv) { 
					object.saved = 'unsaved';
					if (callback) { callback(); }
				}
			}
		}
		var attributes = ['title', 'pic_url', 'pic_credit', 'custom_styles', 'refresh_icon_url'];
		for (var i=0; i<attributes.length; i++) {
			$scope.$watch(
				'quiz.' + attributes[i],
				changeFunction($scope.quiz)
			);
		}
	}
	/* helper functions to remove, update, create for resolving promise */
	var APIsuccess = function(object, callback) {
		return function(successData) {
			object.editing = false;
			object.saved = 'saved';
			if (callback) { callback(successData); }
		};
	}
	var APIerror = function(object) {
		/* yes its simple but make error handling always the same -- so call this helper to generate function */
		return function(err) { object.saved = 'error'; };
	}
	var makeAPIrequest = function(requestFunction, type, object, callback) {
		object.saved = 'saving';
		/* construct endpoint: /quiz/quizID/[type if not quiz]/[objectID if not a POST and type not quiz] */
		var endpoint = (type == 'quiz') ? '' : ('/quiz/' + $scope.quiz._id);
		endpoint += ('/' + type);
		if (object._id) { endpoint += ('/' + object._id); };
		requestFunction(endpoint, object).then(
			APIsuccess(object, callback), // returns a function
			APIerror(object)
		);
	}
	var remove = function(type, object, callback) {
		makeAPIrequest(APIservice.DELETE, type, object, callback);
	}
	var create = function(type, object, callback) {
		makeAPIrequest(APIservice.POST, type, object, callback);
	}
	var update = function(type, object, callback) {
		makeAPIrequest(APIservice.PUT, type, object, callback);
	}
	var reloadQuiz = function(quiz) {
		/* reloads widget, resets watchers, resets outcomeAnswerLists */
		$scope.quiz = quiz;
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
		setWatchers();
		QuizWidgets[quiz._id].reloadData(quiz);
	}

	/* remove ------------------------------------------------- */

	$scope.removeOutcome = function(outcome) {
		if (outcome.answerList && outcome.answerList.length > 0) { return false; } // an answer points to it!
		
		function callback() {
			/* remove from the outcomeList */
			var index = $scope.quiz.outcomeList.indexOf(outcome);
			$scope.quiz.outcomeList.splice(index, 1);
			reloadQuiz($scope.quiz);
		}
		if (!outcome._id) { callback() } 
		else { remove('outcome', outcome, callback); }
	};
	$scope.removeAnswer = function(question, answer) {

		function callback() {
			var questionIndex = $scope.quiz.questionList.indexOf(question);
			var answerIndex = question.answerList.indexOf(answer);
			question.answerList.splice(answerIndex, 1);
			$scope.quiz.questionList[questionIndex] = question;
			reloadQuiz($scope.quiz);
		}
		/* if answer doesnt have real mongo id then not saved server side */
		if (answer._id) { remove('answer', answer, callback); }
		else { callback(); }
	}
	$scope.removeQuestion = function(question) {

		function callback() {
			var index = $scope.quiz.questionList.indexOf(question);
			$scope.quiz.questionList.splice(index, 1);
			reloadQuiz($scope.quiz);
		}

		if (question._id) { remove('question', question, callback); } 
		else { callback(); }
	}

	/* save ------------------------------------------------- */

	$scope.saveQuiz = function() {
		update('quiz', $scope.quiz, reloadQuiz);
	}
	$scope.saveQuestion = function(question) {
		if (FormService.checkQuestionError(question)) {
			return false;
		}
		var questionIndex = $scope.quiz.questionList.indexOf(question);

		var answersCalledback = 0;
		var answerCallback = function() {
			answersCalledback += 1;
			if (answersCalledback == question.answerList.length) {
				$scope.quiz.questionList[questionIndex] = question;
				question.editing = false;
				question.saved = 'saved';
				reloadQuiz($scope.quiz);
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
					update('answer', answer, function(data) {
						question.answerList[j] = data;
						answerCallback();
					});
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

		function callback(outcomeData) {
			var index = $scope.quiz.outcomeList.indexOf(outcome);
			$scope.quiz.outcomeList[index] = outcomeData; // needs the _id
			reloadQuiz($scope.quiz);
		}
		
		if (!outcome._id) { /* create new outcome */
			outcome._quiz = $scope.quiz._id;
			create('outcome', outcome, callback);
		} else { /* update existing outcome */
			update('outcome', outcome, callback);
		}
	};	
	$scope.addAnswer = function(question) {
		question.answerList.push({'saved':'unsaved'});
	}
	$scope.addQuestion = function() {
		$scope.quiz.questionList.push({'saved':'unsaved', 'editing':true, 'answerList':[{}, {}] });
	}
	$scope.addOutcome = function() {
		/* initializing outcome with fake _id  so that answers can still refer to it by _id with answer._outcome */
		$scope.quiz.outcomeList.push({'saved':'unsaved', 'editing':true});
	}
	/* ------- save == PUT/POST requests above ------------- */

	this.init = function() {
		$scope.quiz = quiz;
		console.log('$scope.quiz',$scope.quiz);
		WidgetService.setupOutcomeAnswerLists($scope.quiz);
		setWatchers();
		UIService.updateQuizPic($scope.quiz.pic_url);
		UIService.setupPopovers();
	}
	this.init();
}








