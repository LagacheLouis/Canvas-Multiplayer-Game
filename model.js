function vectorMagnitude(vect){
    return Math.sqrt(Math.pow(vect.x,2) + Math.pow(vect.y,2));
}

function vectorNormalize(vect){
    let magnitude = vectorMagnitude(vect);
    if(magnitude != 0){
        return {x: vect.x/magnitude, y: vect.y/magnitude};
    }else{
        return {x: 0, y: 0};
    }
}

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
            socket.emit("client_createBullet",{position: this.position, dir: dir});
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

class BulletTrail{
    constructor(position,dir){
        this.position = position;
        this.dir = dir;
        this.color = "yellow";

        this.hit = raycast(this.position.x,this.position.y,this.dir.x,this.dir.y,1000);
        if(this.hit){
            core.world.dig(this.hit.x,this.hit.y,50);
        }else{
            this.hit = {x: this.position.x + this.dir.x * 1000,y: this.position.y + this.dir.y * 1000};
        }

        let playerdelta = {x: player.position.x - this.hit.x, y: player.position.y - this.hit.y};

        if(vectorMagnitude(playerdelta) < 80){
            let norm = vectorNormalize(playerdelta);
            player.knock(norm.x * 1000,norm.y * 1000);
        }

        this.speed = 500;
        this.magnitude = vectorMagnitude({x: this.hit.x - this.position.x,y: this.hit.y - this.position.y});

        this.test = false;
    }

    update(){
        if(this.test){
            let oldmagnitude = vectorMagnitude({x: this.hit.x - this.position.x,y: this.hit.y - this.position.y});
            this.position.x += this.dir.x * this.speed * deltaTime * 3;
            this.position.y += this.dir.y * this.speed * deltaTime * 3;
            this.magnitude = vectorMagnitude({x: this.hit.x - this.position.x,y: this.hit.y - this.position.y});
            if(oldmagnitude < this.magnitude)
                core.destroyEntity(this);
        }else{
            this.test = true;
        }
    }

    draw(ctx){

        let of = core.renderer.getOffset();

        ctx.beginPath();
        ctx.moveTo(this.position.x - of.x,this.position.y - of.y);
        ctx.lineTo(this.hit.x - of.x,this.hit.y - of.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}

function raycast(x,y,dirx,diry,distance){
    let collidePosition = {x: x,y: y};
    for(let i = 0; i<distance * 2; i++){
        collidePosition.x += dirx/2 * i;
        collidePosition.y += diry/2 * i;
        if(core.world.collision(collidePosition.x-1,collidePosition.y-1,3,3)){
            return collidePosition;
        }
    }
    return null;
}

