var register_user = $('#register');
var nickname = $('#nickname');
var rtc = meetting.createClient({host:lib.host});
var register_flash = $('#register_flash');
var room_id = lib.getRoomId(location.pathname);

//注册
register_user.submit(function (event) {
    event.preventDefault();
    if (!nickname.val()) {
        return register_flash.html('nickname can not be null.');
    }
    rtc.register(nickname.val(), function (worked) {
        if (worked) {
            console.log('register success');
            register_user.hide();
            $('div').show();
			
			//注册之后加入房间
			rtc.join(room_id, function(err, room){
				if(!err){
					updataUserList('users', room.getUserList());
					room.on('user in',function(user){
						console.log(user + ' join room .')
						updataUserList('users', room.getUserList());
					});
					room.on('user out',function(user){
						console.log(user + ' out of room .')
						updataUserList('users', room.getUserList());
					});
					
					//退出房间
					var out_btn = document.getElementById('outOfRoom');
					out_btn.onclick = function(){
						rtc.out();
						//window.location.href='/create';
					}
					
					//文字聊天初始化
					var color = "#" + ((1 << 24) * Math.random() | 0).toString(16);
					var input = document.getElementById("chatinput");
					var toggleHideShow = document.getElementById("hideShowMessages");
					input.addEventListener('keydown', function(event) {
						var key = event.which || event.keyCode;
						if(key === 13) {
						  rtc.chat(input.value);
						  addToChat(input.value, color);
						  input.value = "";
						}
					  }, false);
					  toggleHideShow.addEventListener('click', function() {
						var element = document.getElementById("messages");

						if(element.style.display === "block") {
						  element.style.display = "none";
						}
						else {
						  element.style.display = "block";
						}

					  });
					  rtc.on('room chat', function(data){
						addToChat(data.from + ' : ' + data.message);
					  });
					
				}else{
					console.log('join error');
				}
			});
			
			
        } else {
            register_flash.html('<p>sorry - that nickname is already taken.</p>');
        }
    });
});


function updataUserList(element, users){
	var container ;
	if(typeof element === 'string'){
		container = document.getElementById(element);
	}else{
		container = element ;
	}
	removeChildren(container);
	
	users = users || [] ;
	for(var i = 0 ; i<users.length; i++){
		addUser(container, users[i]);
	}
}
function addUser(container, name){

	var pre=document.createElement("p");
	pre.style.wordWrap="break-word";
	pre.id=name;
	pre.innerHTML=name;
	container.appendChild(pre);
	
}
function removeChildren(pnode){   
	var childs=pnode.childNodes;    
	for(var i=childs.length-1;i>=0;i--){    
		pnode.removeChild(childs.item(i));    
	}    
} 

function addToChat(msg, color) {
  var messages = document.getElementById('messages');
  msg = sanitize(msg);
  if(color) {
    msg = '<span style="color: ' + color + '; padding-left: 15px">' + msg + '</span>';
  } else {
    msg = '<strong style="padding-left: 15px">' + msg + '</strong>';
  }
  messages.innerHTML = messages.innerHTML + msg + '<br>';
  messages.scrollTop = 10000;
}
function sanitize(msg) {
  return msg.replace(/</g, '&lt;');
}