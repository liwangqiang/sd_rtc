
/*
 * GET home page.
 */
 
var Room = require('../models/room');

module.exports = function(app){
	app.get('/create', function(req, res) {
		res.render('createRoom_new',{});
	});
	app.get('/test_server', function(req, res) {
		res.render('test_server', {title:'test_server'});
	});
	app.get('/test_client', function(req, res){
		res.render('test_client', {title:'test_client'});
	});
	//进入房间响应
	app.get('/room/:id', function(req, res) {
		Room.getOne(req.params.id, function(room){
			if(room){
				res.render('room_new');
				console.log('someone join room '+req.params.id);
			}else{
				res.send("cannot find the room!");
			}
		
		});
	});
};