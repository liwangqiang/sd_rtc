/**
	维护所有房间
	rooms = {
		id: Object#room
	}
	room = {
		id: String
		name: String
		limit: Number
	}
*/

var structures = require("../lib/structures");
var tools =require("../lib/tools");
var db = new structures.SimpleMap();

function Room(room){
	this.name = room.name ,
	this.limit = room.limit ,
	this.owner = room.owner
};


module.exports = Room;	

Room.prototype.save = function(cb){
	var room = {
		id : tools.createId(),
		name: this.name,
		limit : this.limit,
		owner : this.owner
	};
	return cb(db.put(room.id,room));
};

Room.getOne = function(id, cb){
	cb = cb || function(){};
		return cb(db.get(id));
};

Room.getIdList = function(cb){
		return cb(db.keySet());
};
Room.getRoomList = function(cb){
	cb = cb || function(){};
		return cb(db.values());
};
Room.removeRoom = function(id,cb){
	if(cb){
		return cb(db.remove(id));
	} 
		return db.remove(id);
};
Room.getUserNameList = function(id, sockets, cb){
	var err ;
	var room = db.get(id);
	if(!(room && sockets)){
		err = '没有该房间';
		return cb(err);
	}
	var userList = [] , i;
	for( i = 0; i< sockets.length; i += 1){
		sockets[i].get('name',function(err,name){
			if(!err){
				userList.push(name);
			}
		});
	}
	return cb(null,userList);
};
