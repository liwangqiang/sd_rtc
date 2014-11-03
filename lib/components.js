/**
	给对象添加简单事件处理的部件
*/

//参数在on函数提供
var eventuality_one = function(that){
	var registry = {};
	
	that.fire = function(event){
		var arrays,
			func,
			handler,
			i,
			type = typeof event === 'string' ? event : event.type;
		if (registry.hasOwnProperty(type)) {
			arrays = registry[type];
			for(i = 0 ; i<arrays.length ; i += 1){
				handler = arrays[i];
				func = handler.method;
				if(typeof func === 'string'){
					func = this[func];
				}
				func.apply(this, handler.parameters || [event]);
			
			
			}
			
		}
		return this;
	
	};
	
	that.on = function(type,method,parameters){
		var handler = {
			method: method,
			parameters: parameters
		
		};
		if (registry.hasOwnProperty(type)){
			registry[type].push(handler);
		} else {
			registry[type] = [handler];
		}
		
		return this;
	}
	return that;
};


//参数在fire上提供
var eventuality_two = function(that){
	var register = {};
	
	that.on = function(eventName, callback) {
		register[eventName] = register[eventName] || [];
		register[eventName].push(callback);
		return this;
	};
	that.fire = function(eventName, _) {
		var events = register[eventName];
		var args = Array.prototype.slice.call(arguments, 1);

		if (!events) {
			return;
		}

		for (var i = 0, len = events.length; i < len; i++) {
			events[i].apply(null, args);
		}
		return this;
	};
	return that;
};
module.exports = {
	eventuality : eventuality_two
};