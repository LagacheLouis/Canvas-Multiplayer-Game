class Player{
    
    constructor(x,y){
        this.position = {x: x,y: y};
        this.momentum = {x: 0,y: 0};
        this.attackTimer = 0;
        this.isGrounded = false;
        this.jetPackMaxFuel = 5;
        this.jetPackFuel = 5;
        this.charge = 0;

        this.sprite_l = new Image();
        this.sprite_r = new Image();

        this.sprite_l.src = "levels/player_l.png";
        this.sprite_r.src = "levels/player_r.png";

        this.lookLeft = false;

        this.angle =  0;

        this.useJetPack = false;

        this.particleTimer = 0;

        this.godmode = false;
    }

    move(x,y){

        if(core.world.collision(this.position.x + x  * deltaTime,this.position.y + y * deltaTime,20,32)){
            this.momentum.x = clamp(this.momentum.x,-200,200);
            this.momentum.y = clamp(this.momentum.y,-200,200);
        }

        if(!core.world.collision(this.position.x,this.position.y + y * deltaTime,20,32)){
            this.position.y += y * deltaTime;
            this.isGrounded = false;
        }else if(y >= 0){       
            this.isGrounded = true;
            let dir = 1;
            do{
                for(let i = 0;i<10;i++){
                    if(!core.world.collision(this.position.x + dir,this.position.y + y * deltaTime,20,32)){
                        let colvalue = core.world.collisionValue(this.position.x + -dir * 24, this.position.y + y * deltaTime,32,32);
                        if(colvalue > 0.85){
                            this.position.y += y * deltaTime;
                            this.position.x += dir;
                        }else{
                            this.momentum.y = 0;
                        }
                        break;
                    }
                }                                               
                dir = -dir;
            }while(dir == -1)
        }

        if(x != 0){
            if(this.isGrounded){ 
                for(let i= -11;i<11;i++){
                    let colvalue = core.world.collisionValue(this.position.x + Math.sign(x) * 24 + x * deltaTime, this.position.y - i ,32,32);   
                    let val = colvalue > 0.6 ? (1 - colvalue): 1;
                    if(!core.world.collision(this.position.x + x * deltaTime * val,this.position.y - i,20,32)){
                        if(core.world.collision(this.position.x + x * deltaTime * val,this.position.y - i + 5,20,32)){
                            this.position.y -= i;
                        }                             
                        this.position.x += x * deltaTime * val;
                        break; 
                    }                                 
                }
            }else{
                if(!core.world.collision(this.position.x + x * deltaTime,this.position.y,20,32)){     
                    this.position.x += x * deltaTime;
                }
            }             
        }
    }

    knock(x,y){
        this.angle += Math.PI * 2;
        this.momentum.x += x;
        this.momentum.y += y;
    }

    collision(position){
        let delta = {x: this.position.x - position.x,y: this.position.y - position.y};
        return vectorMagnitude(delta) < 10;
    }

    update(){
        if(core.inputs.getKey("q") && this.momentum.x > -200){
            this.momentum.x -= 300 * deltaTime;
        }
        else if(core.inputs.getKey("d") && this.momentum.x < 200){
            this.momentum.x += 300 * deltaTime;
        }else{
            this.momentum.x -= Math.sign(this.momentum.x) * 300 * deltaTime;
            if(Math.abs(this.momentum.x) < 1)
                this.momentum.x = 0;
        }

        this.particleTimer += deltaTime;

        //IS GROUNDED
        if(this.isGrounded){
            this.jetPackFuel = clamp(this.jetPackFuel + deltaTime,0,this.jetPackMaxFuel);
           if(core.inputs.getKey("z") && this.momentum.y > -200){
                this.momentum.y = -200;
            }
            this.useJetPack = false;
        }else if(core.inputs.getKey("z") && this.jetPackFuel > 0){
            if(this.momentum.y > -200){
                this.momentum.y -= 1000 * deltaTime;
            }
            this.jetPackFuel = clamp(this.jetPackFuel - deltaTime,0,this.jetPackMaxFuel);
            core.createEntity(new JetPackParticle(this.position));
            this.useJetPack = true;
        }else  if(this.momentum.y < 200){
            this.momentum.y += 500 * deltaTime;
            this.useJetPack = false;
        }

        core.renderer.moveCamera(this.position.x,this.position.y,0);

        this.attackTimer += deltaTime;

        if(core.inputs.getKey("click")){
            if(this.charge < 500){
                this.charge += 50 * deltaTime;
                 if(this.godmode)
                    this.charge = 500;
            }else{
                this.charge = 500;
            }
        }else if(this.charge > 0 && this.attackTimer > 0.3){
            this.attackTimer = 0;
            let dir = vectorNormalize({x: core.inputs.mousepos.x - this.position.x + core.renderer.getOffset().x, y: core.inputs.mousepos.y - this.position.y + core.renderer.getOffset().y}); 
            socket.emit("client_createBullet",{bulletId : Math.random(),position: this.position, dir: dir, charge: this.charge});
            this.charge = 0;
        }
       
        this.move(this.momentum.x,this.momentum.y);

        if(this.position.y > core.world.canvas.height + 100 || this.position.y < -5000 || this.position.x < -2000 || this.position.x > core.world.canvas.width + 2000){
            socket.emit("client_death");
            core.createEntity(new Spectator());
            core.destroyEntity(this);
        }

      

        this.lookLeft = core.inputs.mousepos.x < window.innerWidth / 2;
        let n_angle = 0;
        if(!this.isGrounded && Math.abs(this.momentum.x) > 5){
           n_angle = Math.atan2(this.momentum.y,this.momentum.x) + Math.PI/2;
        }

        this.angle += shortAngleDist(this.angle,n_angle) * 0.1;
        this.lookLeft = core.inputs.mousepos.x < window.innerWidth / 2 && (this.angle > (Math.PI * 2)/3 || this.angle < Math.PI/2);

    }

    draw(){
        let ctx = core.ctx_entities;
        document.getElementById("position").innerText = parseInt(this.position.x) + " "+ parseInt(this.position.y);
        document.getElementById("charge").innerText = parseInt(this.charge);
        document.querySelector("#fuel div").style.width = this.jetPackFuel/this.jetPackMaxFuel * 100 +"%";


        let of = core.renderer.getOffset();
        let pos = {x: this.position.x - of.x, y:this.position.y - of.y};
        ctx.save();
        ctx.translate(pos.x,pos.y);
        ctx.rotate(this.angle);
        if(this.lookLeft && this.sprite_l.complete){
            ctx.drawImage(this.sprite_l, - 16, - 16,32,32);
        }else if(this.sprite_r.complete){
            ctx.drawImage(this.sprite_r, - 16, - 16,32,32);
        }
        ctx.restore();
           
  

        ctx.beginPath();
        ctx.rect(-2000 - core.renderer.getOffset().x,- 5000 - core.renderer.getOffset().y, core.world.canvas.width + 4000, core.world.canvas.height + 5100);
        ctx.strokeStyle = "blue";
        ctx.stroke();
    }
}

class OnlinePlayer{
    constructor(id,pseudo){
        this.id = id;
        this.position = {x: 0,y: 0};
        this.renderPosition = {x: 0,y: 0};

        this.pseudo = pseudo;

        this.delta = {x: 0, y: 0};
        this.useJetPack = false;

        this.sprite_l = new Image();
        this.sprite_r = new Image();

        this.sprite_l.src = "levels/player_l.png";
        this.sprite_r.src = "levels/player_r.png";

        this.angle = 0;
        this.lookLeft = false;
    }

    sync(data){
        this.position = data.position;
        this.useJetPack = data.useJetPack;
        this.delta = {x: this.position.x - this.renderPosition.x, y: this.position.y - this.renderPosition.y};
        this.lookLeft = data.lookLeft;
        this.angle = data.angle;
        this.syncTimer = 0;
    }

    update(){
        this.particleTimer += deltaTime;
        if(this.useJetPack){
            core.createEntity(new JetPackParticle(this.renderPosition));
        }
        this.renderPosition.x += this.delta.x * deltaTime * syncSpeed;
        this.renderPosition.y += this.delta.y * deltaTime * syncSpeed;
    }

    draw(){
        let ctx = core.ctx_entities;
        let of = core.renderer.getOffset();

        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle= "rgba(128,128,128,1)";
        ctx.fillText(this.pseudo,this.renderPosition.x - of.x,this.renderPosition.y - 20 - of.y);
        
        let pos = {x: this.renderPosition.x - of.x, y:this.renderPosition.y - of.y};

        ctx.save();
        ctx.translate(pos.x,pos.y);
        ctx.rotate(this.angle);
        if(this.lookLeft && this.sprite_l.complete){
            ctx.drawImage(this.sprite_l, - 16, - 16,32,32);
        }else if(this.sprite_r.complete){
            ctx.drawImage(this.sprite_r, - 16, - 16,32,32);
        }
        ctx.restore();

        if(pos.x < 0 || pos.x > window.innerWidth || pos.y < 0 || pos.y > window.innerHeight){     
            let pointer = {x: clamp(this.renderPosition.x - of.x,0,window.innerWidth),y: clamp(this.renderPosition.y - of.y,0,window.innerHeight)};
            drawRect(core.light.ctx,pointer.x,pointer.y,40,40,"white",45);
        }

    }
}

function compare(a, b) {
    if (a.rank < b.rank)
       return -1;
    if (a.rank > b.rank)
       return 1;
    return 0;
  }

let bullets = new Array();

function getBullet(id){
    for(let i = 0;i<bullets.length;i++){
        if(bullets[i].id == id){
            return bullets[i];
        }
    }
    console.log(id + "do not exist");
    return null;
}

class Bullet{
    constructor(data){
        this.id = data.bulletId;
        this.position = data.position;
        this.oldPosition = this.position;
        this.dir = data.dir;
        this.explosionSize = 30 + data.charge;
        this.explosionPower = 500 + (data.charge/500) * 1000;


        this.drawStates = new Array();
        this.collide = false;

        this.calculatePhysics = false;
        if(data.id == clientId){
            this.calculatePhysics = true;
        }

        this.explosionDuration = 0.2; 
    }

    update(){
        if(!this.collide){
            this.oldPosition = {x: this.position.x, y: this.position.y};
            this.position.x +=  this.dir.x * deltaTime * 800;
            this.position.y +=  this.dir.y * deltaTime * 800;
            if(this.calculatePhysics){
                if(core.world.collision(this.position.x,this.position.y,5,5)){
                    socket.emit("client_bulletHit",{id:this.id,position: this.position});
                }else{
                    onlinePlayers.forEach((player) =>{
                        if(vectorMagnitude({x: player.position.x - this.position.x, y: player.position.y - this.position.y}) < this.explosionSize/10 + 20){
                            socket.emit("client_bulletHit",{id:this.id,position: this.position});
                        }
                    });
                }
            }
        }

        this.drawStates.forEach((state)=>{
            state.opacity -= deltaTime * 3;
            if(state.opacity <= 0){
                this.drawStates = this.drawStates.filter(state => state.opacity > 0);
            } 
        });

        if(this.collide && this.drawStates.length == 0){
            core.destroyEntity(this);
        }
        if(!this.collide){
            this.drawStates.push({position: this.position,oldPosition: this.oldPosition, opacity: 1});
        }
    }

    hit(data){

        let playerdelta = {x: player.position.x - data.position.x, y: player.position.y - data.position.y};
        if(vectorMagnitude(playerdelta) < this.explosionSize + 25){
            let norm = vectorNormalize(playerdelta);
            player.knock(norm.x * this.explosionPower,norm.y * this.explosionPower);
        }
        core.world.dig(data.position.x,data.position.y,this.explosionSize);
        
        core.renderer.screenShake(this.explosionPower - 500);
        /**/

        this.collide = true;
    }

    draw(){
        let ctx = core.ctx_entities;

        ctx = core.light.ctx;
        
        let of = core.renderer.getOffset();

        this.drawStates.forEach((state)=>{
            ctx.beginPath();
            ctx.moveTo(state.oldPosition.x - of.x,state.oldPosition.y - of.y);
            ctx.lineTo(state.position.x - of.x,state.position.y - of.y);
            ctx.lineWidth = 3;
            ctx.strokeStyle = "#ffffcc";
            ctx.globalAlpha = state.opacity;
            ctx.stroke();
            ctx.globalAlpha = 1;
        });

        if(this.collide){
            if(this.explosionDuration < 0.15 && this.explosionDuration > 0){
                ctx.beginPath();
                ctx.arc(this.position.x - of.x,this.position.y - of.y,this.explosionSize,0,2 * Math.PI);
                ctx.globalAlpha = 1;
                ctx.fillStyle = "white";
                ctx.fill();
            }else if(this.explosionDuration >= 0.15){
                ctx.beginPath();
                ctx.arc(this.position.x - of.x,this.position.y - of.y,this.explosionSize,0,2 * Math.PI);
                ctx.globalAlpha = 1;
                ctx.fillStyle = "black";
                ctx.fill();
            }
            this.explosionDuration = clamp(this.explosionDuration - deltaTime,0,1);
        }else{
            ctx.beginPath();
            ctx.arc(this.position.x - of.x,this.position.y - of.y,this.explosionSize/10,0,2 * Math.PI);
            this.globalAlpha = 1;
            ctx.fillStyle = "white";
            ctx.fill();
        }
    }
}

let simplex = new SimplexNoise();
class JetPackParticle{
    constructor(position){
        this.position = {x: position.x,y: position.y};
        this.size = Math.random() * 5 + 3;
        this.opacity = 1;
        this.noiseX = Math.random() * 100; 
        this.noiseY = Math.random() * 100;
    }

    update(){
        this.opacity -= deltaTime/3;
        if(this.opacity < 0)
            core.destroyEntity(this);

        this.noiseX += deltaTime;
        this.noiseY += deltaTime;

        this.position.x += simplex.noise2D(0,this.noiseX/5) * 25 * deltaTime;
        this.position.y += simplex.noise2D(0,this.noiseY/5) * 25 * deltaTime;
    }

    draw(){   
        let ctx = core.ctx_entities;
        let of = core.renderer.getOffset();
        ctx.beginPath();
        ctx.arc(this.position.x - of.x,this.position.y - of.y,this.size,0,2 * Math.PI);
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = "white";
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

class Spectator{
    constructor(){
        this.position = {x: core.world.canvas.width/2,y: core.world.canvas.height/2};
        this.speed = 300;
    }

    update(){
        document.getElementById("position").innerText = parseInt(this.position.x) + " "+ parseInt(this.position.y);
        if(core.inputs.getKey("z"))
            this.position.y -= this.speed * deltaTime;
        if(core.inputs.getKey("q"))
            this.position.x -= this.speed * deltaTime;
        if(core.inputs.getKey("s"))
            this.position.y += this.speed * deltaTime;
        if(core.inputs.getKey("d"))
            this.position.x += this.speed * deltaTime;

        core.renderer.moveCamera(this.position.x,this.position.y,0);
    }
}