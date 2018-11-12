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

        if(!core.collision(this.position.x,this.position.y + y * deltaTime,10,20)){
            this.position.y += y * deltaTime;
            this.isGrounded = false;
        }else if(y >= 0){         
            this.isGrounded = true;
            let dir = 1;
            do{
                for(let i = 0;i<10;i++){
                    if(!core.collision(this.position.x + dir,this.position.y + y * deltaTime,10,20)){
                        let colvalue = core.collisionValue(this.position.x + -dir * 15, this.position.y + y * deltaTime,20,20);
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
                    let colvalue = core.collisionValue(this.position.x + Math.sign(x) * 15 + x * deltaTime, this.position.y - i ,20,20);   
                    let val = colvalue > 0.6 ? (1 - colvalue): 1;
                    if(!core.collision(this.position.x + x * deltaTime * val,this.position.y - i,10,20)){
                        if(core.collision(this.position.x + x * deltaTime * val,this.position.y - i + 5,10,20)){
                            this.position.y -= i;
                        }                             
                        this.position.x += x * deltaTime * val;
                        break; 
                    }                                 
                }
            }else{
                if(!core.collision(this.position.x + x * deltaTime,this.position.y,10,20)){     
                    this.position.x += x * deltaTime;
                } 
            }   
            
        }
    }

    update(){
        if(core.inputs.getKey("q")){
            this.momentum.x = clamp(this.momentum.x - 300 * deltaTime,-100,100);
        }
        else if(core.inputs.getKey("d")){
            this.momentum.x = clamp(this.momentum.x + 300 * deltaTime,-100,100);
        }else{
            this.momentum.x -= Math.sign(this.momentum.x) * 300 * deltaTime;
        }

        //IS GROUNDED
        if(this.isGrounded){
            if(core.inputs.getKey("z")){
                this.momentum.y = -200;
            }
        }

        this.attackTimer += deltaTime;
        if(this.attackTimer > 0.3 && core.inputs.getKey("click")){
            console.log()
            this.attackTimer = 0;
            let dir = vectorNormalize({x: core.inputs.mousepos.x - this.position.x, y: core.inputs.mousepos.y - this.position.y}); 
            core.createEntity(new Bullet(this.position.x,this.position.y,dir.x,dir.y,500));
        }

        this.momentum.y = clamp(this.momentum.y + 300 * deltaTime,-300,150);

        this.move(this.momentum.x,this.momentum.y);
    }

    draw(ctx){
        drawRect(ctx,this.position.x,this.position.y,10,20,"red");
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

    update(){

    }

    draw(ctx){
        drawRect(ctx,this.position.x,this.position.y,10,20,"blue");
    }
}


class Bullet{
    constructor(x,y,dirx,diry,speed){
        this.position = {x: x, y: y};
        this.dir = {x: dirx, y: diry};
        this.speed = speed;
    }

    update(){
        this.position.x += this.dir.x * this.speed * deltaTime;
        this.position.y += this.dir.y * this.speed * deltaTime;
        if(core.collision(this.position.x,this.position.y,7,7)){
            core.digMap(this.position.x,this.position.y,30);
            core.destroyEntity(this);
        }
    }

    draw(ctx){
        ctx.save();
        ctx.translate(this.position.x, this.position.y);
        ctx.beginPath();
        ctx.arc(0,0,5,0,2 * Math.PI);
        ctx.fillStyle = "green";
        ctx.fill();
        ctx.restore();
    }
}

