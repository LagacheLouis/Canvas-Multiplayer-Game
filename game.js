let socket = io.connect("/");
let clientId;

socket.on("connection_granted",function(id){
    clientId = id;

    core.init();
    core.loadlevel();
    let player = core.createEntity(new Player(window.innerWidth/2,window.innerHeight/2));
    
    setInterval(function(){
        socket.emit("client_position", {position: player.position});
    },1000/20);

    let onlinePlayers = new Array();
    socket.on("server_player_connect",function(id){
        onlinePlayers.push(core.createEntity(new OnlinePlayer(id)));
    });

    socket.on("server_position",function(data){
        console.log(data);
        onlinePlayers.forEach((p)=>{
            if(data.id = p.id)
                p.sync(data.position);
        })
    });
});