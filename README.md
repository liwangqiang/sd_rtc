rtc
======

# sns交流模块 v0.2.*

## Support

Chrome 24+ and Firefox 21+ (Currently Nightly)

## Example

### Server
 
```javascript

var server = require('http').createServer(app).listen(port);

var webrtc = require('./webrtc.io_new.js').listen(server);
```

### Client

Note: 依赖 socket.io-client v0.9.16
```javascript

<script src='/javascripts/socket.io.min.js'></script>

<script src="/javascripts/webrtc_new.js"></script>
```

## Demo

运行服务器  （-debug 打印日志文件）
```javascript
	node app_new.js -debug
```
浏览器访问
```javascript
	http://localhost:3000/create
```

## Client

### meetting 

#### .supported

#### .createStream(opt, successCallback, errorCallback)

#### .attachStream(stream, video)

#### .createClient(options)



### rtc

#### .register(name, cb)

#### .me()

#### .findRooms(query, cb)

#### .create(opt, cb)

#### .join(id, cb)

#### .out()

#### .chat(msg)

#### Event	
'room chat'  'personal chat'




	
### room

#### .getId()

#### .getName()

#### .getLimit()

#### .getUserList()

#### Event  
'user in'    'user out' 



### call
待补




