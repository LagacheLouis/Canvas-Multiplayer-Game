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
        if(connected_clients.filter(client => client.id == socket.id).length == 0){
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
                data.id = socket.id;
                io.emit("server_createBullet",data);
            });

            socket.on("client_bulletHit",function(data){
                io.emit("server_bulletHit",data);
            });

            socket.on("client_death",function(){
                io.emit("server_player_death",client);
                client.alive = false;
                connected_clients.forEach(client => client.updateRank());
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
        }
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
        io.emit("game_restart",connected_clients);
        console.log("restart ...");
        connected_clients.forEach((client)=>{
            client.reset();
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
        this.rank = 0;
    }

    updateRank(){
        if(this.alive){
            this.rank--;
        }
    }

    reset(){
        this.alive = true;
        this.rank = connected_clients.length;
    }
}