/**
	维护所有用户
	Users = {
		name: Object#user
	}
	user = {
		name: String
		sockets: []
	}
	
	回调函数未定义 可能调用失败
*/

var structures = require("../lib/structures");
var	db = new structures.SimpleMap();

function User(user){
	this.name = user.name;
	this.sockets = user.sockets || [];
};

module.exports = User;

User.prototype.save = function(cb){
	var user = {
		name: this.name,
		sockets: this.sockets 
	};
	var err = null;
	if(db.get(user.name)){
		err =  '用户已存在';
		return cb(err);
	}
	cb(err,db.put(user.name,user));
};

User.getOne = function(name, cb){
		return cb(db.get(name));
};
 
User.getNameList = function(cb){
		return cb(db.keySet());
};

User.getUserList = function(cb){
		return cb(db.values());
};

User.removeUser = function(name,cb){
	if(cb){
		return cb(db.remove(name));
	}
		return db.remove(name);
};
 
User.updataUser = function(data,cb){
		return cb(db.put(data.name,data.user));
};

