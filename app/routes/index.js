
var util 		= require('./../util.js'),
	models 		= require('./../models.js');




/* --------------- ROUTING --------------------- */
exports.serveBase = function(req, res) {
	res.sendfile('static/html/base.html');
}
exports.servePublicPreview = function(req, res) {
	res.sendfile('static/html/public-preview.html');
}











exports.test = function(req, res) {
	req.session.test = 'TEST';
	res.send('test')
}


