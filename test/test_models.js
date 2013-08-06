var User = require('../models/user'),
	Room = require('../models/room');

// user Ok
var user =  new User ({name:'liwangqiang',sockets:[{name:'liwangqiang',age:12}]});

User.getNameList(function(nameList){
		console.log('first: '+ nameList);
});
	
user.save(function(){
	User.getNameList(function(nameList){
		console.log('after insert: '+nameList);
	});
	User.getUserList(function(userList){
		console.dir('after insert: '+userList);
	});
});

User.getOne('liwangqiang',function(user){
	console.log(user);
});
User.removeUser(user.name,function(user){
		console.dir('remove user:'+ user);
});

User.getNameList(function(nameList){
		console.log('after remove: '+ nameList);
});

//room OK
var room = new Room({
	name: 'myHome',
	limit: 9,
	sockets: [{name:'qiang'}]
});

Room.getIdList(function(idList){
	console.log('first: ');
	console.dir(idList);
});
room.save(function(room){
	Room.getIdList(function(idList){
		console.log('after insert idList:');
		console.dir(idList);
	});
	Room.getOne(room.id, function(room){
		console.dir("get one:");
		console.log(room);
	});
	Room.getRoomList(function(roomList){
		console.log('after insert roomList');
		console.dir(roomList);
	});
});