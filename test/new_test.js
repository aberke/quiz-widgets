// new page tests
describe('quiz widget creation page', function() {
	var ptor = protractor.getInstance();
	beforeEach(function() {
    	ptor.get('/new');
    });

	// browser.debugger();

	/* helper -- shouldn't be able to create quiz until:
		- title
		- >= 1 question
		- >= 1 outcome
	*/
	var test_cannot_create_quiz = function() {
		var create_quiz_btn = element(by.id('create-quiz-btn'));
		expect(element(by.id('create-quiz-btn')).getAttribute('disabled')).toBeTruthy();
		expect(element(by.id('ready-text')).isDisplayed()).toBeFalsy();
		expect(element(by.id('still-required-text')).isDisplayed()).toBeTruthy();
	}

	/* --------- tests before creating anything ------------- */
	it('should demand all requirements completed', function() {
		test_cannot_create_quiz();
		expect(element(by.id('still-required-title')).isDisplayed()).toBeTruthy();
		expect(element(by.id('still-required-outcome')).isDisplayed()).toBeTruthy();
		expect(element(by.id('still-required-question')).isDisplayed()).toBeTruthy();
	});
	it('should change size of quiz-widget with view-mobile-btn click', function() {
		var quiz_widget = element(by.css('#set-title .huffpostlabs-quiz'));
		// viewing non-mobile version at first
		expect(quiz_widget.getCssValue('width')).toBe('550px');
		expect(quiz_widget.getCssValue('height')).toBe('425px');
		
		element(by.id('view-mobile-btn')).click();
		expect(quiz_widget.getCssValue('width')).toBe('300px');
		expect(quiz_widget.getCssValue('height')).toBe('270px');
		
		element(by.id('view-non-mobile-btn')).click();
		expect(quiz_widget.getCssValue('width')).toBe('550px');
		expect(quiz_widget.getCssValue('height')).toBe('425px');
	});


});











