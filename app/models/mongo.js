/* db setup to be shared among model files */

var mongoose = require('mongoose'),
	Schema = mongoose.Schema,
	ObjectId = Schema.ObjectId;


var Mongo = function() {

	var _connectDB = function(url) {
		mongoose.connect(url);
		var _db = mongoose.connection;
		_db.on('error', console.error.bind(console, 'mongoose database connection error:'));
		_db.once('open', function callback () {
		  console.log('mongoose database open at ' + url + '...');
		});
		return _db;
	}
	/* takes a model name and object definition -- creates model and returns it */
	var _Model = function(name, object) {
		schema = new Schema(object);
		return mongoose.model(name, schema);
	}


	return {
		connectDB: _connectDB,
		Model: _Model,
		ObjectId: ObjectId,
		Schema: Schema, // TODO -- TAKE OUT AFTER REFACTOR
	}
}();
module.exports = Mongo;
