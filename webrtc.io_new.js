/**
    使用socket.io重写webrtc.io
*/
var io = require('socket.io'),
    eventuality = require('./lib/components').eventuality,
    User = require('./models/user'),
    Room = require('./models/room'),
    iolog = function () {},
    rtc = eventuality({});
 
// 参数中有 "-debug" 时，打印日志信息  
for (var i = 0; i < process.argv.length; i++) {
    var arg = process.argv[i];
    if (arg === "-debug") {
        iolog = function (msg) {
            if (typeof msg === 'string') {
                console.log(msg);
            } else {
                console.dir(msg);
            }
        };
        console.log('Debug mode on!');
    }
}
 
module.exports.listen = function (server) {
    var webrtc = {
        wss: io.listen(server),
        rtc: rtc
    };
    attachRTCEvents(webrtc);
    attachSignalingEvents(webrtc);
    return webrtc;
};
 
function attachSignalingEvents(webrtc) {
    webrtc.wss.on('connection', function (socket) {
        iolog('connection');
 
        //****用户注册****//
        socket.on('register', function (data, cb) {
            iolog(data.name + " want to register");
 
            //加入用户列表.返回结果，true 或 false
            var user = new User({
                name: data.name,
                sockets: socket
            });
            user.save(function (err) {
                if (err) {
                    iolog(data.name + ' register fail !!! ');
                    return cb(err);
                }
                socket.set('name', data.name, function () {
                    cb(null);
                });
            });
 
            //触发rtc的注册函数 
            socket.on('event', function (json, cb) {
				iolog(data.name + " fire rtc event : " + json.eventName);
                webrtc.rtc.fire(json.eventName, json.data, socket, cb);
            });
 
            //断开时的处理 断开 == use log out
            socket.on('disconnect', function () {
                iolog(data.name + ' disconnect');
 
                //从用户列表中删除该用户
                socket.get('name', function (err, name) {
                    if (!err) {
                        User.removeUser(name);
                    }
                    socket.get('room', function (err, room) {
                        if (!err) {
 
                            //如果房间里没有人了，房间列表中，删除该房间
                            var sockets = webrtc.wss.sockets.clients(room);
                            if (sockets && sockets.length === 1) {	
								iolog(sockets.length);
                                return Room.removeRoom(room);
                            }
 
                            //通知房间其他人，该用户离开
                            socket.broadcast.to(room).emit('remove_user', {
                                room: room,
                                user: name
                            });
                        }
                    });
                });
 
            });
        });
 
    });
 
};
 
 
 
// 有关视频通信的事件在此添加
 
function attachRTCEvents(webrtc) {
 
    webrtc.rtc.on('get_all_users', function (data, socket, cb) {
        if (data.room) {
            var roomSockets = webrtc.wss.sockets.clients(data.room);
            Room.getUserNameList(data.room, roomSockets, function (err, userList) {
                cb(err, userList);
            });
        } else {
            User.getNameList(function (allUserList) {
                cb(null, allUserList);
            });
        }
    });
 
    webrtc.rtc.on('get_rooms', function (data, socket, cb) {
        Room.getRoomList(function (rooms) {
			if(rooms){
				var sockets , i ;
				for(i = 0; i< rooms.length ; i++){
					sockets = webrtc.wss.sockets.clients(rooms[i].id) || [];
					rooms[i].count = sockets.length ;
				}
			}
            cb(null, rooms);
        });
    });
 
    webrtc.rtc.on('create_room', function (data, socket, cb) {
        var room = new Room({
            name: data.name,
            limit: data.limit,
			owner: data.owner
        });
 
        room.save(function (room) {
            return cb(null, room.id);
        });
 
        //debug
        Room.getRoomList(function (roomList) {
            iolog(roomList);
        });
    });
 
    webrtc.rtc.on('join_room', function (data, socket, cb) {
        var err;
        roomId = data.room;
 
        //查找房间，若无，返回false
        Room.getOne(roomId, function (room) {
            if (!room) {
                err = '不存在该房间';
                return cb(err);
            }
            //加入房间
            socket.join(roomId);
            socket.set('room', roomId);
 
            //广播给该房间人 new_peer_connected
            socket.get('name', function (err, name) {
                if (!err) {
                    socket.broadcast.to(roomId).emit('new_user_connected', {
                        room: roomId,
                        user: name
                    });
                }
            });
            //给自己发送该房间信息
            var roomSockets = webrtc.wss.sockets.clients(roomId);
            Room.getUserNameList(roomId, roomSockets, function (err, userList) {
                return cb(err, {
                    id: room.id,
                    name: room.name,
                    limit: room.limit,
                    userList: userList
                });
 
            });
        });
    });
	
	//用户建立连接的交互
	webrtc.rtc.on('calling', function(data, socket, cb){
		//根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('calling', {
                    "from": data.from,
					"goal": data.goal
                });
            }
        });
	
	});
	
	webrtc.rtc.on('agree', function(data, socket, cb){
		//根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('agree', {
					"from": data.from,
					"goal": data.goal
                });
            }
        });
	
	});
	
	webrtc.rtc.on('decline', function(data, socket, cb){
		//根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('decline', {
                    "from": data.from,
					"goal": data.goal
                });
            }
        });
	
	});
	
	
	//peerConnection
    webrtc.rtc.on('send_ice_candidate', function (data, socket, cb) {
 
        //根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('receive_ice_candidate', {
                    "label": data.label,
                    "candidate": data.candidate,
                    "from": data.from
                });
            }
        });
    });
 
    webrtc.rtc.on('send_offer', function (data, socket, cb) {
 
        //根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('receive_offer', {
                    "sdp": data.sdp,
                    "from": data.from
                });
            }
        });
 
    });
 
    webrtc.rtc.on('send_answer', function (data, socket, cb) {
 
        //根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('receive_answer', {
                    "sdp": data.sdp,
                    "from": data.from
                });
            }
 
        });
    });
	
	webrtc.rtc.on('close_call', function (data, socket, cb) {
 
        //根据昵称找到目标人,发送转发的消息
        User.getOne(data.goal, function (user) {
            if (user) {
                user.sockets.emit('close_call', {
                    "from": data.from,
					"goal": data.goal
                });
            }
        });
 
    });
 
    //文字消息
    webrtc.rtc.on('chat_msg', function (data, socket, cb) {
 
        if (data.room) {
            socket.broadcast.to(data.room).emit('receive_chat', {
                message: data.message,
                room: data.room,
                from: data.from
            });
            return;
        }
        var to_users = data.collection;
 
        if (to_users) {
            for (var i = 0; i < to_users.length; i++) {
                User.getOne(to_users[i], function (user) {
                    if (user) {
                        user.sockets.emit('receive_personal_chat', {
                            message: data.message,
                            from: data.from
                        });
                    }
                });
            }
        }
    });
};