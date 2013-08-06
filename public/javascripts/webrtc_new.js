/**
    外部依赖 socket.io 0.9.x
*/
var meetting = (function (io) {
    /*
        一些公共的变量、函数的定义
    */
 
    // 兼容性定义 以后去除 使用adapter.js
    var PeerConnection = (window.PeerConnection || window.webkitPeerConnection00 || window.webkitRTCPeerConnection ||
        window.mozRTCPeerConnection);
    var URL = (window.URL || window.webkitURL || window.msURL || window.oURL);
    var getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia ||
        navigator.msGetUserMedia);
    var nativeRTCIceCandidate = (window.mozRTCIceCandidate || window.RTCIceCandidate);
    var nativeRTCSessionDescription = (window.mozRTCSessionDescription || window.RTCSessionDescription); // order is very important: "RTCSessionDescription" defined in Nighly but useless
 
    var sdpConstraints = {
        'mandatory': {
            'OfferToReceiveAudio': true,
            'OfferToReceiveVideo': true
        }
    };
    if (navigator.webkitGetUserMedia) {
        if (!webkitMediaStream.prototype.getVideoTracks) {
            webkitMediaStream.prototype.getVideoTracks = function () {
                return this.videoTracks;
            };
            webkitMediaStream.prototype.getAudioTracks = function () {
                return this.audioTracks;
            };
        }
 
        // New syntax of getXXXStreams method in M26.
        if (!webkitRTCPeerConnection.prototype.getLocalStreams) {
            webkitRTCPeerConnection.prototype.getLocalStreams = function () {
                return this.localStreams;
            };
            webkitRTCPeerConnection.prototype.getRemoteStreams = function () {
                return this.remoteStreams;
            };
        }
    }
 
    //兼容性处理
 
    function preferOpus(sdp) {
        var sdpLines = sdp.split('\r\n');
        var mLineIndex = null;
        // Search for m line.
        for (var i = 0; i < sdpLines.length; i++) {
            if (sdpLines[i].search('m=audio') !== -1) {
                mLineIndex = i;
                break;
            }
        }
        if (mLineIndex === null) return sdp;
 
        // If Opus is available, set it as the default in m line.
        for (var j = 0; j < sdpLines.length; j++) {
            if (sdpLines[j].search('opus/48000') !== -1) {
                var opusPayload = extractSdp(sdpLines[j], /:(\d+) opus\/48000/i);
                if (opusPayload) sdpLines[mLineIndex] = setDefaultCodec(sdpLines[mLineIndex], opusPayload);
                break;
            }
        }
 
        // Remove CN in m line and sdp.
        sdpLines = removeCN(sdpLines, mLineIndex);
 
        sdp = sdpLines.join('\r\n');
        return sdp;
    }
 
    function extractSdp(sdpLine, pattern) {
        var result = sdpLine.match(pattern);
        return (result && result.length == 2) ? result[1] : null;
    }
 
    function setDefaultCodec(mLine, payload) {
        var elements = mLine.split(' ');
        var newLine = [];
        var index = 0;
        for (var i = 0; i < elements.length; i++) {
            if (index === 3) // Format of media starts from the fourth.
                newLine[index++] = payload; // Put target payload to the first.
            if (elements[i] !== payload) newLine[index++] = elements[i];
        }
        return newLine.join(' ');
    }
 
    function removeCN(sdpLines, mLineIndex) {
        var mLineElements = sdpLines[mLineIndex].split(' ');
        // Scan from end for the convenience of removing an item.
        for (var i = sdpLines.length - 1; i >= 0; i--) {
            var payload = extractSdp(sdpLines[i], /a=rtpmap:(\d+) CN\/\d+/i);
            if (payload) {
                var cnPos = mLineElements.indexOf(payload);
                if (cnPos !== -1) {
                    // Remove CN payload from m line.
                    mLineElements.splice(cnPos, 1);
                }
                // Remove CN line in sdp
                sdpLines.splice(i, 1);
            }
        }
 
        sdpLines[mLineIndex] = mLineElements.join(' ');
        return sdpLines;
    }
 
    function mergeConstraints(cons1, cons2) {
        var merged = cons1;
        for (var name in cons2.mandatory) {
            merged.mandatory[name] = cons2.mandatory[name];
        }
        merged.optional.concat(cons2.optional);
        return merged;
    }
 
    //简单的调试打印函数
    var iolog = function (msg) {
        if (typeof msg === 'string') {
            console.log(msg);
        } else {
            console.dir(msg);
        }
    };
 
    //添加事件处理的部件
    var eventuality = function (that) {
        var register = {};
 
        that.on = function (eventName, callback) {
            register[eventName] = register[eventName] || [];
            register[eventName].push(callback);
            return this;
        };
        that.fire = function (eventName, _) {
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
 
 
    /**
        私有变量 + 私有方法的定义
    */
    function isSupported() {
        var supported = true;
        if (!(PeerConnection && getUserMedia)) {
            supported = false;
        }
        return supported;
    };
 
    function createStream(constraints, successCallback, errorCallback) {
        var options;
        successCallback = successCallback || function () {};
        errorCallback = errorCallback || function () {};
 
        options = {
            video: !! constraints.video,
            audio: !! constraints.audio
        };
 
        if (getUserMedia) {
            getUserMedia.call(navigator, options, function (stream) {
                successCallback(stream);
            }, function () {
                iolog("Could not connect stream.");
                errorCallback();
            });
        } else {
            iolog('webRTC is not yet supported in this browser.');
        }
 
    };
 
    function attachStream(stream, video) {
        var selector;
        if (typeof video === 'string') {
            selector = document.getElementById(video);
        } else {
            selector = video;
        }
        if (navigator.mozGetUserMedia) {
            iolog("Attaching media stream");
            selector.mozSrcObject = stream;
            selector.play();
        } else {
            selector.src = webkitURL.createObjectURL(stream);
        }
    };
 
    var instantiated;
 
    function init(options) {
 
        //初始化私有变量
        var HOST = options.host || 'http://localhost';
        var SERVER = function () {
            if (navigator.mozGetUserMedia) {
                return {
                    "iceServers": [{
                            "url": "stun:23.21.150.121"
                        }]
                };
            }
            return {
                "iceServers": [{
                        "url": "stun:stun.l.google.com:19302"
                    }]
            };
        };
		var pc_constraints = {
			"optional": [{
			  "DtlsSrtpKeyAgreement": true
			}]
		};
		
		
        var _socket = null;
        var _me = null;
        var rtc = eventuality({});
        var current_room = {};
		
		//only a test function
		rtc.go = function(id){
			if(id){
				window.location.href='/room/'+id;
			}else{
				alert('进入房间出错');
			}
		};
        rtc.register = function (name, cb) {
            name = name || '';
            cb = cb || function () {};
            _socket = io.connect(HOST);
            _socket.on('connect', function () {
                _socket.emit('register', {
                    name: name
                }, function (err) {
                    if (!err) {
                        _me = name;
                        return cb(true);
                    } else {
                        iolog(err);
                        return cb(false);
                    }
                });
				
				/* 如果只考虑客户端的断开 则不需要这段代码
                _socket.on('disconnect', function () {
                    //socket关闭，代表退出房间，释放所有视频资源,并且因为服务器会删除用户，所以客户端也需要去清理
					current_room = {};
					_me = null ;
					
					//释放视频资源
                });
				*/
 
            });
        };
 
        rtc.findRooms = function (query, cb) {
            query = query || '';
            cb = cb || function () {};
 
            _socket.emit('event', {
					eventName: 'get_rooms',
					data: {
						from: _me ,
						query: query
					}
				},
                function(err, roomList){
                    cb(err, roomList);
                });
        };
        rtc.create = function (opt, cb) {
            var options = opt || {};
            cb = cb || function () {};
            if (_me) {
                _socket.emit('event', {
                    eventName: 'create_room',
                    data: {
                        from: _me,
                        name: options.name,
                        limit: options.limit,
						owner: options.owner
                    }
                }, function (err, id) {
                    return cb(err, id);
                });
            } else {
                iolog('Error: 创建房间失败，用户未注册 ！');
            }
        };
		rtc.me = function(){
			return _me;
		};
        rtc.join = function (id, cb) {
            cb = cb || function () {};
			if( !current_room.id ){
				_socket.emit('event', {
					eventName: 'join_room',
					data: {
						from: _me,
						room: id
					}
				}, function (err, data) {
					if (!err) {
						//加入房间成功后 进行room模块的初始化工作
						var room = (function () {
							current_room = {
								id: data.id,
								name: data.name,
								limit: data.limit,
								userList: data.userList
							};
	 
							//1、初始化当前房间的参数、事件处理
							var model = eventuality({
								getId: function () {
									return current_room.id;
								},
								getName: function () {
									return current_room.name;
								},
								getLimit: function () {
									return current_room.limit;
								},
								getUserList: function () {
									return current_room.userList;
								}
							});
							//有人离开
							_socket.on('remove_user', function (data) {
								if (data.room === current_room.id) {
									var exist = current_room.userList.indexOf(data.user);
									if (exist !== -1) {
										current_room.userList.splice(exist, 1);
	 
										model.fire('user out', data.user);
									} else {
										iolog('Error : ' + '该用户不在当前人员列表中 ！');
									}
								} else {
									iolog('Error : ' + '与当前房间ID不匹配');
								}
	 
							});
							//有人加入
							_socket.on('new_user_connected', function (data) {
								if (data.room === current_room.id) {
									current_room.userList.push(data.user);
									model.fire('user in', data.user);
	 
								} else {
									iolog('Error : ' + '与当前房间ID不匹配');
								}
	 
							});
							return model;
	 
						})();
	 
						//2、进行文字聊天初始化
						_socket.on('receive_chat', function (data) {
							if(current_room.id === data.room){
								//	TODO 
								rtc.fire('room chat', data);
							}	
						});
						_socket.on('receive_personal_chat', function (data) {
							if(current_room.id){
								//	TODO 
								rtc.fire('personal chat', data);
							}	
						});
						
					}
					cb(err, room);
				});
			}
 
        };
		
		rtc.getMediaCall = function(){
			if(!_me) {
				return false ;
			}
			var calls = {};
			var mediaCall = eventuality({}) ;
			
			mediaCall.getCalls = function(){
				return calls ;
			};
			
			//caller
			mediaCall.createCall = function(id, cb){
			
				var caller = (function(){
					var model = eventuality({});
					model.user = id;
					model.isCaller = true ;
					
					model.calling = function(){
						
						_socket.emit('event',{
							'eventName': 'calling',
							'data': {
								'from': _me,
								'goal': id
							}
						});
					};
					
					model.addStream = function(stream){
						var pc = caller.pc = new createPeerConnection(id);
						pc.addStream(stream);
						sendOffer();
					};
					return model;
				});
				
				calls[data.from] = caller ;
				cb(caller);
			};
			
			_socket.on('agree', function(data){
			
				calls[data.from].fire('agree');
				calls[data.from].state = 'start';
				
			});
			
			_socket.on('decline', function(data){
			
				calls[data.from].fire('decline');
				calls[data.from].state = 'decline';
			});
			
			//callee
			_socket.on('calling', function(data){
				var callee = {};
				callee.user = data.from;
				callee.isCaller = false ;
				
				callee.decline = function(){
					_socket.emit('event', {
						'eventName': 'decline',
						'data': {
							'from': _me,
							'goal': data.from
						}
					});
					callee.state = 'decline';
				};
				
				callee.addStream = function(stream){
					_socket.emit('event', {
						'eventName': 'agree',
						'data': {
							'from': _me,
							'goal': data.from
						}
					});
					
					callee.state = 'start';
					
					var pc = callee.pc = new createPeerConnection(data.from);
					pc.addStream(stream);
				};
				
				calls[data.from] = callee;
				mediaCall.fire('call', callee);
			});
			
			_socket.on('receive_ice_candidate', function(data){
			
				var candidate = new nativeRTCIceCandidate(data);
				calls[data.socketId].pc.addIceCandidate(candidate);
				
			});
			
			_socket.on('receive_offer', function(data){
				
				receiveOffer(data.socketId, data.sdp);
			
			});
			
			_socket.on('receive_answer', function(data){
				
				receiveAnswer(data.socketId, data.sdp);
			});
			
			_socket.on('remove_peer_connected', function(data){
				
				delete calls[data.socketId];
			});
			
			
			var createPeerConnection = function(id){
				    var config = pc_constraints;

					var pc = new PeerConnection(rtc.SERVER(), config);
					pc.onicecandidate = function(event) {
					  if (event.candidate) {
					  
						_socket.emit('event', {
						  "eventName": "send_ice_candidate",
						  "data": {
							"label": event.candidate.sdpMLineIndex,
							"candidate": event.candidate.candidate,
							"socketId": id
						  }
						});
					  }
					};

					pc.onopen = function() {
					
					};

					pc.onaddstream = function(event) {
					  // TODO: Finalize this API
					  calls[id].fire('ready', event.stream, id);
					};

					return pc;
			};
			
			var sendOffer = function(socketId){
				var pc = calls[socketId].pc;

				var constraints = {
				  "optional": [],
				  "mandatory": {
					"MozDontOfferDataChannel": true
				  }
				};
				// temporary measure to remove Moz* constraints in Chrome
				if (navigator.webkitGetUserMedia) {
				  for (var prop in constraints.mandatory) {
					if (prop.indexOf("Moz") != -1) {
					  delete constraints.mandatory[prop];
					}
				  }
				}
				constraints = mergeConstraints(constraints, sdpConstraints);

				pc.createOffer(function(session_description) {
				  session_description.sdp = preferOpus(session_description.sdp);
				  pc.setLocalDescription(session_description);
				  
				  _socket.emit('event', {
					"eventName": "send_offer",
					"data": {
					  "socketId": socketId,
					  "sdp": session_description
					}
				  });
				  
				}, null, sdpConstraints);
			};
			
			var receiveOffer = function(socketId, sdp){
				sendAnswer(socketId, sdp);
			};
			
			var receiveAnswer = function(socketId, sdp){
				var pc = calls[socketId].pc;
				pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
			};
			
			var sendAnswer = function(socketId, sdp){
				var pc = calls[socketId].pc;
				pc.setRemoteDescription(new nativeRTCSessionDescription(sdp));
				pc.createAnswer(function(session_description) {
				  pc.setLocalDescription(session_description);
				  
				  _socket.emit('event', {
					"eventName": "send_answer",
					"data": {
					  "socketId": socketId,
					  "sdp": session_description
					}
				  });
				  
				}, null, sdpConstraints);
			
			};
			
			return mediaCall;
			
		};
		
		//bug ！ 房间不能删除
        rtc.out = function () {
			if(current_room.id){
				_socket.disconnect();
				
				//复位相关变量
				_socket = null ;
				_me = null ;
				current_room = {};
				/*
					因为register 之后 socket 才能连上服务器
					所以out之后需要再调用 register 才能启用rtc 
					不过本来就是单页面应用，大部分情况是一退出就跳转其他页面。
				*/
				iolog('out of room');
				//释放视频资源
			}else{
				iolog('Error : 未加入任何房间 ！');
			}
        };
        rtc.chat = function () {
            if (_me && current_room.id) {
				var data = {};
				if( arguments.length === 1 ){
						data = {
							from: _me,
							room: current_room.id,
							message: arguments[0]
						};
				}else if(arguments.length === 2){
						data = {
							from: _me,
							collection: arguments[0] || [],
							message: msg
						};
				}else{
					iolog('Error ：参数有误 ！');
				}
				_socket.emit('event',{eventName:'chat_msg',data:data});
            } else {
                iolog('Error: 发送消息失败，未注册或者未加入房间！');
            }
        };

        rtc.on('room chat', function (data) {
            var from = data.from;
            var message = data.message;
            iolog('room chat message from ' + from + ' : ' + message);
        });
		
		rtc.on('personal chat', function (data) {
            var from = data.from;
            var message = data.message;
            iolog('personal chat message from ' + from + ' : ' + message);
        });
        //instantiated提供的接口方法
        return rtc;
    };
	
    /**
        meetting返回的接口 有关流
    */
    return {
        //惰性加载
        createClient: function (options) {
			options = options || {};
            if (!instantiated) {
                instantiated = init(options);
            }
            return instantiated;
        },
        //是否支持rtc
        supported: isSupported(),
        //创建本地流
        createStream: createStream,
        //流与vedio关联
        attachStream: attachStream
 
    };
 
}((function () {
    if (typeof window.io === 'undefined') {
        console.log('error: argument io is undefined , socket.io missed ! ');
    } else {
        return window.io;
    }
})()));