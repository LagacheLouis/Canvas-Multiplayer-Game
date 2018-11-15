let socket = io.connect("/");
let syncSpeed = 30;
let clientId;
let onlinePlayers = new Array();
let player = null;

function CreateOnlinePlayer(client){
    console.log(client);
    if(client.id != clientId){
        onlinePlayers.push(core.createEntity(new OnlinePlayer(client.id,client.pseudo)));
    }
}

function DestroyOnlinePlayer(id){
    for(let i = 0;i<onlinePlayers.length;i++){
        if(onlinePlayers[i].id == id){
            core.destroyEntity(onlinePlayers[i]);
            onlinePlayers.splice(i,1);
        }
    }
}

window.onload = function(){
    document.querySelector("#connexion button").onclick = function(){
        let pseudo = document.querySelector("#connexion input").value;
        socket.emit("client_connection",pseudo);
    };
}

socket.on("connection_granted",function(connectionData){

    document.getElementById("connexion").style.display = "none";

    clientId = connectionData.client;
    core.init();
    connectionData.otherClients.forEach(CreateOnlinePlayer);


    log("---- Welcome to the battle ----");

    socket.on("game_restart",function(winner){
        core.destroyEntity(player);
        core.world.loadlevel();
        player = core.createEntity(new Player(window.innerWidth/2,window.innerHeight/2));
        log(winner.pseudo + " won  the game");
        log("---- game restarting ----");
    });
    
    setInterval(function(){     
        if (document.hidden) {
            socket.emit("client_inactive");
        }else if(player != null){
            socket.emit("client_position", {position: player.position});
        }
    },1000/syncSpeed);

   
    socket.on("server_player_connect",function(client){
        CreateOnlinePlayer(client);
        log(client.pseudo+" comes to the battle");
    });

    socket.on("server_player_exit",function(client){
        DestroyOnlinePlayer(client.id);
        log(client.pseudo+" has fled like a coward");
    });

    socket.on("server_position",function(data){
        onlinePlayers.forEach((p)=>{
            if(data.id == p.id){
                p.sync(data.position);
            }
        })
    });

    socket.on("server_createBullet",function(data){
        core.createEntity(new BulletTrail(data));
    });

    socket.on('disconnect', function(){
        log("You have been DISCONNECTED");
        setTimeout(() => {
            location.reload();
        }, 1000);
    });
});

function log(text){
    let logwindow = document.getElementById("log");
    var msg = document.createElement("p");
    msg.textContent = text;
    logwindow.prepend(msg);
}
