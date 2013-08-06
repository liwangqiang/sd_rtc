/**
*  工具函数
*/
(function(exports) {
	
	//创建唯一ID
	var createId = exports.createId = function(){
			var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz";
			var string_length = 20;
			var randomstring = '';
			for(var i = 0; i < string_length; i++) {
			  var rnum = Math.floor(Math.random() * chars.length);
			  randomstring += chars.substring(rnum, rnum + 1);
			}
			return randomstring;
		}

})((function() {
	if(typeof exports === 'undefined') {
		window.tools = {};
		return window.tools;
	} else {
		return exports;
	}
})());