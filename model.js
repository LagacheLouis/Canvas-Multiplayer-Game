class Player{
    
    constructor(x,y){
        this.position = {x: x,y: y};
        this.momentum = {x: 0,y: 0};
        this.attackTimer = 0;
        this.isGrounded = false;
        this.jetPackMaxFuel = 3;
        this.jetPackFuel = 3;
    }

    move(x,y){

        if(core.world.collision(this.position.x + x  * deltaTime,this.position.y + y * deltaTime,10,20)){
            this.momentum.x = clamp(this.momentum.x,-200,200);
            this.momentum.y = clamp(this.momentum.y,-200,200);
        }

        if(!core.world.collision(this.position.x,this.position.y + y * deltaTime,10,20)){
            this.position.y += y * deltaTime;
            this.isGrounded = false;
        }else if(y >= 0){       
            this.isGrounded = true;
            let dir = 1;
            do{
                for(let i = 0;i<10;i++){
                    if(!core.world.collision(this.position.x + dir,this.position.y + y * deltaTime,10,20)){
                        let colvalue = core.world.collisionValue(this.position.x + -dir * 15, this.position.y + y * deltaTime,20,20);
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
                    let colvalue = core.world.collisionValue(this.position.x + Math.sign(x) * 15 + x * deltaTime, this.position.y - i ,20,20);   
                    let val = colvalue > 0.6 ? (1 - colvalue): 1;
                    if(!core.world.collision(this.position.x + x * deltaTime * val,this.position.y - i,10,20)){
                        if(core.world.collision(this.position.x + x * deltaTime * val,this.position.y - i + 5,10,20)){
                            this.position.y -= i;
                        }                             
                        this.position.x += x * deltaTime * val;
                        break; 
                    }                                 
                }
            }else{
                if(!core.world.collision(this.position.x + x * deltaTime,this.position.y,10,20)){     
                    this.position.x += x * deltaTime;
                }
            }             
        }
    }

    knock(x,y){
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
        }

        //IS GROUNDED
       if(this.isGrounded){
            this.jetPackFuel = clamp(this.jetPackFuel + deltaTime,0,this.jetPackMaxFuel);
           if(core.inputs.getKey("z") && this.momentum.y > -200){
                this.momentum.y = -200;
            }
        }else if(core.inputs.getKey("z") && this.jetPackFuel > 0 && this.momentum.y > -150){
            if(this.momentum.y > -200){
                this.momentum.y -= 1000 * deltaTime;
                this.jetPackFuel = clamp(this.jetPackFuel - deltaTime,0,this.jetPackMaxFuel);
            }
        }else  if(this.momentum.y < 200){
            this.momentum.y += 500 * deltaTime;
        }

        core.renderer.moveCamera(this.position.x,this.position.y,0);

        this.attackTimer += deltaTime;
        if(this.attackTimer > 0.3 && core.inputs.getKey("click")){
            this.attackTimer = 0;
            let dir = vectorNormalize({x: core.inputs.mousepos.x - this.position.x + core.renderer.getOffset().x, y: core.inputs.mousepos.y - this.position.y + core.renderer.getOffset().y}); 
            socket.emit("client_createBullet",{bulletId : Math.random(),position: this.position, dir: dir});
        }
       
        this.move(this.momentum.x,this.momentum.y);

        if(this.position.y > core.world.canvas.height + 100){
            socket.emit("client_death");
            core.destroyEntity(this);
        }
    }

    draw(ctx){
        drawRect(ctx,window.innerWidth/2,10,300,10,"black");
        drawRect(ctx,window.innerWidth/2,10,300 * this.jetPackFuel/this.jetPackMaxFuel,10,"orange");

        drawRect(ctx,this.position.x - core.renderer.getOffset().x,this.position.y - core.renderer.getOffset().y,10,20,"red");
    }
}

class OnlinePlayer{
    constructor(id,pseudo){
        this.id = id;
        this.position = {x: 0,y: 0};
        this.renderPosition = {x: 0,y: 0};

        this.pseudo = pseudo;

        this.delta = {x: 0, y: 0};
    }

    sync(position){
        this.position = position;
        this.delta = {x: this.position.x - this.renderPosition.x, y: this.position.y - this.renderPosition.y};
    }

    update(){
        this.renderPosition.x += this.delta.x * deltaTime * syncSpeed;
        this.renderPosition.y += this.delta.y * deltaTime * syncSpeed;
    }

    draw(ctx){
        let of = core.renderer.getOffset();

        ctx.font = "15px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle= "rgba(128,128,128,0.5)";
        ctx.fillText(this.pseudo,this.renderPosition.x - of.x,this.renderPosition.y - 20 - of.y);
        

        drawRect(ctx,this.renderPosition.x - of.x,this.renderPosition.y - of.y,10,20,"blue");
    }
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

        this.calculatePhysics = false;
        if(data.id == clientId){
            this.calculatePhysics = true;
        }
    }

    update(){
        this.oldPosition = {x: this.position.x, y: this.position.y};
        this.position.x +=  this.dir.x * deltaTime * 800;
        this.position.y +=  this.dir.y * deltaTime * 800;
        if(this.calculatePhysics){
            if(core.world.collision(this.position.x,this.position.y,5,5)){
                socket.emit("client_bulletHit",{id:this.id,position: this.position});
            }else{
                onlinePlayers.forEach((player) =>{
                    if(vectorMagnitude({x: player.position.x - this.position.x, y: player.position.y - this.position.y}) < 10){
                        socket.emit("client_bulletHit",{id:this.id,position: this.position});
                    }
                });
            }
        }
    }

    hit(data){

        let playerdelta = {x: player.position.x - data.position.x, y: player.position.y - data.position.y};
        if(vectorMagnitude(playerdelta) < 80){
            let norm = vectorNormalize(playerdelta);
            player.knock(norm.x * 1000,norm.y * 1000);
        }
        core.world.dig(data.position.x,data.position.y,50);

        ctx_particles.beginPath();
        ctx_particles.arc(data.position.x,data.position.y,80,0,2 * Math.PI);
        ctx_particles.fillStyle = "yellow";
        ctx_particles.fill();
        ctx_particles.beginPath();
        ctx_particles.arc(data.position.x,data.position.y,30,0,2 * Math.PI);
        ctx_particles.fillStyle = "white";
        ctx_particles.fill();

        core.destroyEntity(this);
    }

    draw(ctx){
        ctx_particles.beginPath();
        ctx_particles.moveTo(this.oldPosition.x,this.oldPosition.y);
        ctx_particles.lineTo(this.position.x,this.position.y);
        ctx_particles.lineWidth = 5;
        ctx_particles.strokeStyle = "yellow";
        ctx_particles.stroke();
    }
}