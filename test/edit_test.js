/* /edit page tests
		- grab arbitrary quiz from the landing page -- get its id
		- go to its edit page
		- test


	TODO: make sure preview_widget properly reloads
*/
var default_pic_url = "http://www.huffingtonpost.com/favicon.ico";
var default_pic_credit = "huffpost favicon";

describe('quiz widget edit page', function() {
	var ptor = protractor.getInstance();
	var quizID;
	var quiz_preview;
	var first_outcome;

	beforeEach(function() {
		/* grab first quiz from page - get its id - go to its edit page */
		ptor.get('/');
		var quiz = element(by.css('.huffpostlabs-quiz'));
		quiz.getAttribute('id').then(function(id) {
			quizID = id;
			ptor.get('/edit/' + quizID).then(function() {
				quiz_preview = element(by.css('.quiz-preview .huffpostlabs-quiz'));
				first_outcome = element.all(by.repeater('outcome in quiz.outcomeList')).first();
			});
		});
    });

    var saveChangesTest = function(btn, saved_status_text) {
		expect(saved_status_text.getText()).toBe('unsaved');
		btn.click();
		expect(saved_status_text.getText()).toBe('saved');
    }
    var noChangesStateTest = function(btn, saved_status_text) {
		expect(btn.getAttribute('disabled')).toBeTruthy();
		expect(saved_status_text.getText()).toBe('');
    }
    var unsavedStateTest = function(btn, saved_status_text) {
		expect(btn.getAttribute('disabled')).toBeFalsy();
		expect(saved_status_text.getText()).toBe('unsaved');
    } 
    var refreshAndTest = function(callback) {
    	/* helper to make sure changes were saved - refresh page and then run test in callback */
    	ptor.get('/edit/' + quizID).then(function() {
    		callback();
    	});
    }
    var setValueSaveTest = function(input_element, saved_status_text, save_btn, value) {
		input_element.clear();
		input_element.sendKeys(value);
		saveChangesTest(save_btn, saved_status_text);
		refreshAndTest(function() { 
			expect(input_element.getAttribute('value')).toBe(value);
		});
    }
    it('Should successfully add, not save a question, remove', function() {
    	var section = element(by.id('set-questions'));
    	var questions = element.all(by.repeater('question in quiz.questionList'));
    	var num_saved_questions = questions.count();
    	section.element(by.id('add-question-btn')).click();
    	expect(questions.count()).toBeGreaterThan(num_saved_questions);

    	questions.last().then(function(q) {
	    	q.findElement(by.css('button.remove-question')).click();
	    	expect(questions.count()).toEqual(num_saved_questions);
	    	refreshAndTest(function() {
	    		expect(element.all(by.repeater('question in quiz.questionList')).count()).toEqual(num_saved_questions)
	    	});
    	});
    });

    var answerSelectOutcome = function(answer_element) {
    	/* helper that always selects outcome 1 */

    	// answer_element.findElements(by.tagName('option')).then(function(options) {
    	// 	console.log('00000000', options.length)
    	// 	options[0].click();
    	// });
    }
    describe('edit existing question tests', function() {

    });
    describe('add new question tests', function() {
    	var section;
    	var questions;
    	var new_question;
    	var edit_btn;
    	var hide_edit_btn;
    	var remove_btn;
    	var save_btn;
    	var saved_status_text;
    	beforeEach(function() {
    		section = element(by.id('set-questions'));

    		element(by.id('add-question-btn')).click();	
	    	questions = element.all(by.repeater('question in quiz.questionList'));
	    	questions.last().then(function(last) {
    			new_question = last;
	    		edit_btn = new_question.findElement(by.css('button.edit-question'));
	    		hide_edit_btn = new_question.findElement(by.css('button.hide-edit-question'));
	    		remove_btn = new_question.findElement(by.css('button.remove-question'));
	    		save_btn = new_question.findElement(by.css('button.save-question'));
	    		saved_status_text = new_question.findElement(by.css('.saved-status-text'));
    		});
	    });
	    it('has proper edit-remove control buttons/text at start for new question -- and remove functions', function() {
	    	expect(edit_btn.isDisplayed()).toBeFalsy();
	    	expect(hide_edit_btn.isDisplayed()).toBeFalsy();
			unsavedStateTest(save_btn, saved_status_text);
			var prev_questions_count = questions.count();
			remove_btn.click();
			expect(questions.count()).toBeLessThan(prev_questions_count);
	    });
	    it('allows adding arbitrary number (10) of questions', function() {
	    	var add_question_btn = element(by.id('add-question-btn'));
	    	var count = questions.count();
	    	for (var i=0; i<10; i++) {
	    		add_question_btn.click();
	    		var new_count = questions.count();
	    		expect(new_count).toBeGreaterThan(count);
	    		count = new_count;
	    	}
	    });

	    it('has error on question.text when not provided but tried to save', function() {
	    	var question_text_input = new_question.findElement(by.css('input.question-text'));
			expect(question_text_input.getAttribute('class')).not.toMatch(/error/);
			save_btn.click();
			expect(question_text_input.getAttribute('class')).toMatch(/error/);
			question_text_input.sendKeys('QUESTION TEXT');
			save_btn.click();
			expect(question_text_input.getAttribute('class')).not.toMatch(/error/);
		});
	    it('ensures each question has >= 2 answers; allows adding/removing extra answers', function() {
	    	var add_answer_btn = new_question.findElement(by.css('.add-answer-btn'));
	    	var answers = element.all(by.css('.question.new .answer'));

	    	expect(answers.count()).toEqual(2);
	    	answers.each(function(a) {
	    		var remove_answer_btn = a.findElement(by.css('button.remove-answer'));
	    		var answer_status_text = a.findElement(by.css('.saved-status-text'));
	    		expect(remove_answer_btn.isDisplayed()).toBeFalsy();
	    		expect(answer_status_text.getText()).toBe('');
	    	});
	    	/* add 2 more answers to have 3 in total */
	    	add_answer_btn.click();
	    	expect(answers.count()).toEqual(3);
	    	/* newly created answer should be 'unsaved' -- delete it */
	    	var new_answer_status_text = answers.last().findElement(by.css('.saved-status-text'));
	    	expect(new_answer_status_text.isDisplayed()).toBeTruthy();
	    	expect(new_answer_status_text.getText()).toBe('unsaved');
	    	answers.last().findElement(by.css('button.remove-answer')).click();
	    	expect(answers.count()).toEqual(2);
	    });

	    it('has error on answer._outcome when not provided but tried to save', function() {
			new_question.findElement(by.css('input.question-text')).sendKeys('QUESTION TEXT');
			save_btn.click();
			unsavedStateTest(save_btn, saved_status_text);

	    	element.all(by.css('.question.new .answer')).each(function(a) {
				expect(a.findElement(by.css('.answer-outcome')).getAttribute('class')).toMatch(/error/);
			});
	    });
    }); /* end of 'add new question tests' */

    it ('Should not allow removing first question but should allow editing', function() {
    	element.all(by.repeater('question in quiz.questionList')).first().then(function(q) {
    		var remove_btn = q.findElement(by.css('button.remove-question'));
    		expect(remove_btn.isDisplayed()).toBeFalsy();
    		var edit_btn = q.findElement(by.css('button.edit-question'));
    		expect(edit_btn.isDisplayed()).toBeTruthy();
    		expect(edit_btn.getAttribute('disabled')).toBeFalsy();
    	});
    })

    it ('Should successfully save changes to quiz refresh icon', function() {
    	var section = element(by.id('set-refresh-icon'));
    	var save_btn = section.element(by.tagName('button'));
		var saved_status_text = section.element(by.css('.saved-status-text'));

		noChangesStateTest(save_btn, saved_status_text);

    	var input = section.element(by.tagName('input'));
    	setValueSaveTest(input, saved_status_text, save_btn, default_pic_url);
    	expect(section.element(by.css('img.refresh-btn')).getAttribute('src')).toBe(default_pic_url);
    });

	it('Should successfully save changes to quiz title, pic, and pic_credit', function() {
		
		ptor.driver.getCurrentUrl().then(function(url) {
			console.log('url', url)
		});
		var set_title_section = element(by.id('set-title'));
		var save_btn = set_title_section.element(by.tagName('button'));
		var saved_status_text = set_title_section.element(by.css('.saved-status-text'));

		noChangesStateTest(save_btn, saved_status_text);
		
		/* test changing title */
		var title_input = set_title_section.element(by.model('quiz.title'));
		setValueSaveTest(title_input, saved_status_text, save_btn, 'TEST TITLE');
		
		/* test changing image and photo credit */
		var pic_url_input = set_title_section.element(by.model('quiz.pic_url'));
		var pic_credit_input = set_title_section.element(by.model('quiz.pic_credit'));
		setValueSaveTest(pic_url_input, saved_status_text, save_btn, default_pic_url);
		setValueSaveTest(pic_credit_input, saved_status_text, save_btn, default_pic_credit);
		expect(pic_credit_input.isDisplayed()).toBeTruthy();
	});








});
