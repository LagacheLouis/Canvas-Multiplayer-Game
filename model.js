function vectorMagnitude(vect){
    return Math.sqrt(Math.pow(vect.x,2) + Math.pow(vect.y,2));
}

function vectorNormalize(vect){
    let magnitude = vectorMagnitude(vect);
    return {x: vect.x/magnitude, y: vect.y/magnitude};
}

class Player{
    
    constructor(x,y){
        this.position = {x: x,y: y};
        this.momentum = {x: 0,y: 0};
        this.attackTimer = 0;
        this.isGrounded = false;
    }

    move(x,y){
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
        }else{
            this.momentum.y = 0;
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

    update(){
        if(core.inputs.getKey("q")){
            this.momentum.x = clamp(this.momentum.x - 300 * deltaTime,-200,200);
        }
        else if(core.inputs.getKey("d")){
            this.momentum.x = clamp(this.momentum.x + 300 * deltaTime,-200,200);
        }else{
            this.momentum.x -= Math.sign(this.momentum.x) * 300 * deltaTime;
        }

        //IS GROUNDED
        if(this.isGrounded){
            if(core.inputs.getKey("z")){
                this.momentum.y = -400;
            }
        }

        core.renderer.moveCamera(this.position.x,this.position.y,0);

        this.attackTimer += deltaTime;
        if(this.attackTimer > 0.1 && core.inputs.getKey("click")){
            this.attackTimer = 0;
            let dir = vectorNormalize({x: core.inputs.mousepos.x - this.position.x + core.renderer.getOffset().x, y: core.inputs.mousepos.y - this.position.y + core.renderer.getOffset().y}); 
            socket.emit("client_createBullet",{position: this.position, dir: dir});
        }

        this.momentum.y = clamp(this.momentum.y + 300 * deltaTime,-500,150);

        this.move(this.momentum.x,this.momentum.y);

        if(this.position.y > core.world.canvas.height + 100){
            socket.emit("client_death");
            core.destroyEntity(this);
        }
    }

    draw(ctx){
        drawRect(ctx,this.position.x - core.renderer.getOffset().x,this.position.y - core.renderer.getOffset().y,10,20,"red");
    }
}

class OnlinePlayer{
    constructor(id){
        this.id = id;
        this.position = {x: 0,y: 0};
    }

    sync(position){
        this.position = position;
    }

    draw(ctx){
        drawRect(ctx,this.position.x - core.renderer.getOffset().x,this.position.y - core.renderer.getOffset().y,10,20,"blue");
    }
}

class BulletTrail{
    constructor(position,dir){
        this.position = position;
        this.dir = dir;
        this.color = "yellow";
        this.opacity = 1;



        this.hit = raycast(this.position.x,this.position.y,this.dir.x,this.dir.y,1000);
        if(this.hit){
            core.world.dig(this.hit.x,this.hit.y,30);
        }else{
            this.hit = {x: this.position.x + this.dir.x * 1000,y: this.position.y + this.dir.y * 1000};
        }
        this.speed = 500;
        this.magnitude = vectorMagnitude({x: this.hit.x - this.position.x,y: this.hit.y - this.position.y});
    }

    update(){
        let oldmagnitude = vectorMagnitude({x: this.hit.x - this.position.x,y: this.hit.y - this.position.y});
        this.position.x += this.dir.x * this.speed * deltaTime * 3;
        this.position.y += this.dir.y * this.speed * deltaTime * 3;
        this.magnitude = vectorMagnitude({x: this.hit.x - this.position.x,y: this.hit.y - this.position.y});
        if(oldmagnitude < this.magnitude)
            core.destroyEntity(this);
    }

    draw(ctx){

        let of = core.renderer.getOffset();

        ctx.beginPath();
        ctx.moveTo(this.position.x - of.x,this.position.y - of.y);
        ctx.lineTo(this.hit.x - of.x,this.hit.y - of.y);
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 5;
        //ctx.globalAlpha = this.opacity;
        ctx.stroke();
        //ctx.globalAlpha = 1;
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

