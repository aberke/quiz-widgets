
/*
Current use: Filter out unsaved Outcomes from the options of the select list
	for answers on the edit.html page
*/
var hasIDfilter = function() {
	return function(items) {
		var filtered = [];
		angular.forEach(items, function (item) {
			if (item._id) {
			    filtered.push(item);
			}
		});
		return filtered;        
	}
}
