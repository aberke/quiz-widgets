


exports.serveBase = function(req, res) {
	res.sendfile('static/html/base.html');
}

exports.test = function(req, res) {
	res.send('test')
}