/*globals $, console */
(function(){
	"use strict";

	if(!String.prototype.trim) { // thanks to http://stackoverflow.com/a/8522376
		String.prototype.trim = function(){
			return this.replace(/^\s+|\s+$/g,'');
		};
	}

	if(window && window.jQuery) {
		window.jQuery.fn.inlineOffset = function() {
			var element_before        = $('<i/>').css('display','inline').insertBefore(this[0]),
				element_after         = $('<i/>').css('display','inline').insertAfter(this[0]),
				element_before_offset = element_before.offset(),
				element_after_offset  = element_after.offset();

			element_before.remove();
			element_after .remove();

			return {
					before: element_before_offset,
					after:  element_after_offset
				};
		};

	}
}());

