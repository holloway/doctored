/*globals $ */
(function(){
	"use strict";

	if(!String.prototype.trim) { // thanks to http://stackoverflow.com/a/8522376
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g,'');
		};
	}

	if(window && window.jQuery) {
		window.jQuery.fn.inlineOffset = function() { // thanks to http://stackoverflow.com/questions/995838/left-offset-of-an-inline-element-using-jquery
			var el  = $('<i/>').css('display','inline').insertBefore(this[0]),
				pos = el.offset();
			el.remove();
			return pos;
		};
	}
}());

