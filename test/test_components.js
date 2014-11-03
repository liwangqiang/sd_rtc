/*
	测试部件 components
*/

// compoents.eventuality   OK

var components = require('../lib/components');

var object = components.eventuality({
	name: 'liwangqiang',
	age: 23
});


object.on('test',function(name, age){
	console.log(name + ' : ' + age + "!");
});


var test = function(){
	object.fire('test','fanxin', 24);
}
setTimeout(test, 3000);