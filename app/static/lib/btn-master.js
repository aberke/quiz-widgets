/* Code for this btn-master.js was inspired by, and largely borrowed from, Google Developers: https://developers.google.com/mobile/articles/fast_buttons

	Here is what it does:  looks for any item with the 'data-huffpostlabs-btn'

*/
console.log(0);

var HuffpostLabsBtnMaster = function(context) {

	this.context = (context || document);
	this.btns = [];

	this.getAllBtns = function() {
		return this.context.querySelectorAll('[data-huffpostlabs-btn]');
	}
	this.handleBtns = function() {
		for (var i=0; i<this.btns.length; i++) {
			/* take OFF the onclick handler, and then add it again as my special btn */
			var element = this.btns[i];
			var handler = element.onclick;
			element.onclick = null;
			
			/* replace the btn with a HuffpostLabs btn */
			this.btns[i] = new HuffpostLabsBtn(element, handler);

		}
	}
	this.init = function() {
		this.btns = this.getAllBtns();
		this.handleBtns();
	}
	this.init();
}




var HuffpostLabsBtn = function(element, handler) {
  this.element = element;
  this.handler = handler;

  element.addEventListener('touchstart', this, false);
  element.addEventListener('click', this, false);
};

HuffpostLabsBtn.prototype.handleEvent = function(event) {
	switch (event.type) {
		case 'touchstart': this.onTouchStart(event); break;
		case 'touchmove': this.onTouchMove(event); break;
		case 'touchend': this.onClick(event); break;
		case 'click': this.onClick(event); break;
	}
};
HuffpostLabsBtn.prototype.onTouchMove = function(event) {
	/* Make sure user hasn't dragged far from btn */
	if (Math.abs(event.touches[0].clientX - this.startX) > 10 ||
		Math.abs(event.touches[0].clientY - this.startY) > 10) {
		this.reset();
	}
};
HuffpostLabsBtn.prototype.onTouchStart = function(event) {
	/* Save reference to the touchstart and listen to touchmove and touchend events. 
	Call stopPropagation so that event only handled once */
	event.stopPropagation();

	// add .hover class
	this.element.className += " hover";

	this.element.addEventListener('touchend', this, false);
	document.body.addEventListener('touchmove', this, false);

	this.startX = event.touches[0].clientX;
	this.startY = event.touches[0].clientY;
};
HuffpostLabsBtn.prototype.onClick = function(event) {
	event.stopPropagation();
	this.reset();
	this.handler(event);

	if (event.type == 'touchend') {
		HuffpostLabsClickBuster.preventGhostClick(this.startX, this.startY);
		// remove .hover class
		this.element.className = this.element.className.replace(/\bhover\b/, '');
	}
};
HuffpostLabsBtn.prototype.reset = function() {
	this.element.removeEventListener('touchend', this, false);
	document.body.removeEventListener('touchmove', this, false);
};


/* defining and instantiating it all at once */
window.HuffpostLabsClickBuster = new function() {
	/* code heavily borrowed from google.clickbuster 
		
		Reason for this object:
			Don't fire onclick events that have already be handled.
			Catch onclicks that are dangerously close to touchend events that previously occured
	*/
	var coordinates = [];

	this.preventGhostClick = function(x, y) {
		coordinates.push(x, y);
		window.setTimeout(this.pop, 2500);
	};
	this.pop = function() {
		coordinates.splice(0, 2);
	};
	this.onClick = function(event) { /* when called, 'this' is the document */
		for (var i = 0; i < coordinates.length; i += 2) {
			var x = coordinates[i];
			var y = coordinates[i + 1];
			if (Math.abs(event.clientX - x) < 25 && Math.abs(event.clientY - y) < 25) {
				event.stopPropagation();
				event.preventDefault();
			}
		}	
	}
}();
document.addEventListener('click', window.HuffpostLabsClickBuster.onClick, true);


