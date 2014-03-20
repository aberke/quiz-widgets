var basic_auth_username = 'huffpost';
var basic_auth_password = '';

exports.config = {

  seleniumAddress: 'http://localhost:4444/wd/hub',

  specs: [
  		//	'*_test.js',
  			'edit_test.js'
  		],

	// A base URL for your application under test. Calls to protractor.get()
	// with relative paths will be prepended with this.
	baseUrl: 'http://' + basic_auth_username + ':' + basic_auth_password + '@localhost:8080',

	// Selector for the element housing the angular app - this defaults to
	// body, but is necessary if ng-app is on a descendant of <body>  
	rootElement: 'body',
}