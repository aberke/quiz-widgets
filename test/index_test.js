// basic index tests
describe('quiz widget landing page', function() {
	var ptor = protractor.getInstance();
	beforeEach(function() {
		ptor.get('/');
	});

	it('shows mvp-text-container at first and hides on clicking hide button', function() {
		var mvp_text_container = element(by.id('mvp-text-container'));
		
		expect(mvp_text_container.isDisplayed()).toBeTruthy();
		element(by.id('hide-explainer-text-btn')).click();
		expect(mvp_text_container.isDisplayed()).toBeFalsy();
		element(by.id('show-explainer-text-btn')).click();
		expect(mvp_text_container.isDisplayed()).toBeTruthy();

	});
});