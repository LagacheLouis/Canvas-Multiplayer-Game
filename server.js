var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("."));

app.get('/', function(req, res){
    res.sendFile(__dirname + 'index.html');
});

let players = new Array();

io.on('connection', function(socket){
    console.log("client "+socket.id+" is connected");
    io.to(socket.id).emit("connection_granted",socket.id);
    io.emit("server_player_connect",socket.id);

    socket.on("client_position",function(data){
        data.id = socket.id;
        io.emit("server_position",data);
    });

    socket.on('disconnect', function(){
       io.emit("server_player_exit",socket.id);
       
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});