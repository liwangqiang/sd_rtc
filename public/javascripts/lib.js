(function(exports) {

	var getRoomId = exports.getRoomId = function(pathname){
			return pathname.split('/')[2];
	};
	var rtc_host = exports.host = 'http://localhost';

})((function() {
	if(typeof exports === 'undefined') {
		window.lib = {};
		return window.lib;
	} else {
		return exports;
	}
})());