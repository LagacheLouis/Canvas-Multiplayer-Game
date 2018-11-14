let socket = io.connect("/");
let clientId;
let onlinePlayers = new Array();
function CreateOnlinePlayer(id){
    if(id != clientId){
        onlinePlayers.push(core.createEntity(new OnlinePlayer(id)));
    }
}

function DestroyOnlinePlayer(id){
    for(let i = 0;i<onlinePlayers.length;i++){
        if(onlinePlayers[i].id = id){
            core.destroyEntity(onlinePlayers[i]);
            onlinePlayers.splice(i,1);
        }
    }
}

socket.on("connection_granted",function(connectionData){
    console.log("connected");

    clientId = connectionData.client;
    connectionData.otherClients.forEach(CreateOnlinePlayer);

    core.init();

    let player = null;
    socket.on("game_restart",function(){
        core.destroyEntity(player);
        core.world.loadlevel();
        player = core.createEntity(new Player(window.innerWidth/2,window.innerHeight/2));
    });
    
    setInterval(function(){
        if(player != null)
            socket.emit("client_position", {position: player.position});
    },1000/30);

   
    socket.on("server_player_connect",function(id){
        CreateOnlinePlayer(id);
    });

    socket.on("server_position",function(data){
        onlinePlayers.forEach((p)=>{
            if(data.id == p.id){
                p.sync(data.position);
            }
        })
    });

    socket.on("server_createBullet",function(data){
        core.createEntity(new BulletTrail(data.position,data.dir));
    });

    socket.on("server_player_exit",function(id){
        DestroyOnlinePlayer(id);
    });

    socket.on('disconnect', function(){
        console.log("disconnected")
    });
});
