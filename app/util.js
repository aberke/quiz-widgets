/* utility functions forall */



/* privateErr is something I just print while publicErr is okay to return to user */
exports.handleError = function(err, publicErr){
	if (!err) { return null; }
	console.log('*****!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!******');
	console.log(privateErr, publicErr);
	console.log('*****!!!!!!!!!!!!!!! ERROR !!!!!!!!!!!!!!******');
	return (publicErr || 'ERROR');
}