
//var util 		= require('./common-util.js');

var	authMiddleware  	= require('./../middleware/authentication-middleware.js'),
	basicAuth 			= authMiddleware.basicAuth,
	verifyUser 			= authMiddleware.verifyUser,
	verifyQuizViewAccess= authMiddleware.verifyQuizViewAccess;



var IndexRoutes = function (app) {

	var _registerEndpoints = function(app) {

		/* protected with NO auth */
		app.get('/forbidden',  			_serveBase);
		app.get('/quiz/public/:quizID', _servePublicPreview);


		/* protected with verifyUser */
		app.get('/new', 				verifyUser, _serveBase);
		app.get('/new/:type', 			verifyUser, _serveBase);


		/* protected with verifyQuizViewAccess */
		app.get('/edit/:quizID',		verifyQuizViewAccess, _serveBase);
		app.get('/edit/:type/:quizID',	verifyQuizViewAccess, _serveBase);

		app.get('/social/:quizID',  	verifyQuizViewAccess, _serveBase);


		/* protected with basicAuth */
		app.get('/', 					basicAuth, _serveBase);
		app.get('/contact',  			basicAuth, _serveBase);
		app.get('/all-quizzes',  		basicAuth, _serveBase);
		app.get('/user/:search',    	basicAuth, _serveBase);
		app.get('/stats/:quizID',		basicAuth, _serveBase);
		app.get('/documentation',		basicAuth, _serveBase);
		app.get('/documentation/:doc',	basicAuth, _serveBase);

		
	}
	var _serveBase = function(req, res) {
		console.log('SERVE BASE',req.user)
		res.sendfile('static/html/base.html');
	}
	var _servePublicPreview = function(req, res) {
		res.sendfile('static/html/public-preview.html');
	}

	_registerEndpoints(app);
};
module.exports = IndexRoutes;


