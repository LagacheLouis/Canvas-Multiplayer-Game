var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static("."));

app.get('/', function(req, res){
    res.sendFile(__dirname + 'index.html');
});



io.on('connection', function(socket){

    socket.on("client_connection",function(pseudo){

        let client = new GameClient(socket.id,pseudo);
        connected_clients.push(client);

        io.to(socket.id).emit("connection_granted",{client: socket.id, otherClients: connected_clients});
        io.emit("server_player_connect",client);

        console.log("client "+socket.id+" is connected, "+connected_clients.length+" online");

        tryRestart();

        socket.on("client_position",function(data){
            data.id = socket.id;
            io.emit("server_position",data);
        });

        //Objects instantiation
        socket.on("client_createBullet",function(data){
            io.emit("server_createBullet",data);
        });

        socket.on("client_death",function(){
            client.alive = false;
            tryRestart();
        });

        socket.on('disconnect', function(){
            deleteId(socket.id);
            io.emit("server_player_exit",client);
            console.log("client "+socket.id+" is disconnected, "+connected_clients.length+" online");
        });

        socket.on("client_inactive",function(){
            socket.disconnect();
        });
    });
});




let connected_clients = new Array();

function deleteId(id){
    for(let i = 0;i<connected_clients.length;i++){
        if(connected_clients[i].id == id)
            connected_clients.splice(i,1);
    }
}

function tryRestart(){
    let alives = connected_clients.filter(client => client.alive);
    console.log(alives.length+" player(s) alive");
    if(alives.length <= 1){
        io.emit("game_restart",alives[0]);
        connected_clients.forEach((client)=>{
            client.alive = true;
        });
    }
}

http.listen(3000, function(){
  console.log('listening on *:3000');
});

class GameClient{
    constructor(id, pseudo){
        this.id = id;
        this.pseudo = pseudo;
        this.alive = false;
    }
}