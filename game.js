let socket = io.connect("/");
let syncSpeed = 30;
let clientId;
let onlinePlayers = new Array();
let player = null;
let spectator = null;

let scoreboard;

function CreateOnlinePlayer(client){
    if(client.id != clientId){
        onlinePlayers.push(core.createEntity(new OnlinePlayer(client.id,client.pseudo)));
    }
    scoreboard = document.getElementById("scoreboard");
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
        let pseudo = document.querySelector("#connexion input").value.substring(0,15);
        socket.emit("client_connection",pseudo);
    };
}

socket.on("connection_granted",function(connectionData){

    document.getElementById("connexion").style.display = "none";

    clientId = connectionData.client;
    core.init();
    connectionData.otherClients.forEach(CreateOnlinePlayer);

    core.createEntity(new Spectator());

    log("---- Welcome to the battle ----");

    socket.on("game_restart",function(playersData){
        core.destroyEntity(spectator);
        core.destroyEntity(player);

        playersData.sort(function(a,b) {
            if (a.rank < b.rank)
                return -1;
            if (a.rank > b.rank)
                return 1;
            return 0;
        });


        scoreboard.innerHTML = "";      
        playersData.forEach((data)=>{
            if(data.rank != 0)
                scoreboard.innerHTML += "<p>"+data.rank + " - " + data.pseudo+"</p>";
        });
        scoreboard.classList.add("active");
        

        core.world.loadlevel();

        setTimeout(()=>{
            player = core.createEntity(new Player(window.innerWidth/2,window.innerHeight/2));
            document.getElementById("scoreboard").classList.remove("active");
            log("---- game restarting ----");
        },3000);
    });
    
    setInterval(function(){     
        if (document.hidden) {
            socket.emit("client_inactive");
        }else if(player != null){
            socket.emit("client_position", {position: player.position, useJetPack: player.useJetPack});
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
                p.sync(data);
            }
        })
    });

    socket.on("server_createBullet",function(data){
        let bullet = new Bullet(data);
        bullets.push(bullet);
        core.createEntity(bullet);
    });

    socket.on("server_bulletHit",function(data){
        getBullet(data.id).hit(data);
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
