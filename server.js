var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("."));

app.get('/', function(req, res){
    res.sendFile(__dirname + 'index.html');
});



io.on('connection', function(socket){
    connected_ids.push(socket.id);

    io.to(socket.id).emit("connection_granted",{client: socket.id, otherClients: connected_ids});
    io.emit("server_player_connect",socket.id);

    console.log("client "+socket.id+" is connected, "+connected_ids.length+" online");

    let lastMovement = Date.now();

    tryRestart();

    socket.on("client_position",function(data){
        data.id = socket.id;
        io.emit("server_position",data);
        lastMovement = Date.now();
    });

    //Objects instantiation
    socket.on("client_createBullet",function(data){
        io.emit("server_createBullet",data);
    });

    socket.on("client_death",function(){
        players_alive--;
        tryRestart();
    });

    socket.on('disconnect', function(){
        deleteId(socket.id);
        io.emit("server_player_exit",socket.id); 
        players_alive--;
        console.log("client "+socket.id+" is disconnected, "+connected_ids.length+" online");
    });
});



let connected_ids = new Array();

function deleteId(id){
    for(let i = 0;i<connected_ids.length;i++){
        if(connected_ids[i] == id)
            connected_ids.splice(i,1);
    }
}

let players_alive = 0;
function tryRestart(){
    if(players_alive <= 1){
        io.emit("game_restart");
        players_alive = connected_ids.length;
        console.log("game restarting");
    }
    console.log(players_alive);
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});

class GameClient{
    constructor(id){
        this.id = id;
        this.lastSync = Date.now();
    }

    wakeUp(){
        this.lastSync = Date.now();
    }

    checIdle(){
        if(this.lastSync < Date.now() + 5000)
        io.to(this.id).disconnect();
    }
}