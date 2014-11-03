
/**
 * 初始化变量
 */

var express = require('express'),
	http = require('http'),
	path = require('path'),
	//flash = require('connect-flash'),
	//MongoStore = require('connect-mongo')(express),
	routes = require('./routes/index_new'),			//维护端口
	
    settings = require("./settings"),		// 定义了一些变量
    
    structures = require("./lib/structures"),   // 导入javascirpt实现的map和circlelist
	
	tools = require("./lib/tools"),
    
    port = settings.port;					
    
	

var app = express(),
	server = http.createServer(app);
// Configuration

app.configure(function(){
app.set('port', port);
app.set('views', __dirname + '/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.cookieParser(settings.cookieSecret));
app.use(express.session({
	key:settings.db,
	cookie:{maxAge: 1000*60*60*24*30},
	/*
	store: new MongoStore({
		db:settings.db
		})
	*/
	})
);
//app.use(flash());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));
});

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// Routes
routes(app);

// 启动服务器，并监听端口号
server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

/**
 *   实时通信模块
 */
var webrtc = require('./webrtc.io_new.js').listen(server);
