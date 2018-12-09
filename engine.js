const core = {};

let deltaTime = 0;
let time = 0;

core.entities = new Array();
core.world = null;
core.renderer = null;
core.light = null;

const WORLD_SIZE = 2500;

core.createEntity = function(obj){
    this.entities.push(obj);
    return obj;
}

core.destroyEntity = function(entity){
    for(let i = 0; i < this.entities.length; i++){
        if(this.entities[i] == entity){
            this.entities.splice(i,1);
        }
    }
    entity = null;
    delete entity;
}


core.init = function(){
    this.world = new World("world");
    this.renderer = new Renderer("renderer");
    this.light = new Light("light");

    let canvas_entities = document.getElementById("entities");
    this.ctx_entities = canvas_entities.getContext("2d");

    canvas_entities.width = window.innerWidth;
    canvas_entities.height = window.innerHeight;

    time = Date.now();

    function update(){

        core.ctx_entities.clearRect(0,0,window.innerWidth,window.innerHeight);

        deltaTime = (Date.now() - time)/1000;
        time = Date.now();

        core.renderer.clear();
        core.renderer.update();
        core.renderer.draw(core.world.canvas);

        core.light.draw();

        core.entities.forEach((obj)=>{
            if(typeof obj.update != "undefined")
                obj.update();
        });

        for(let i = core.entities.length - 1; i>=0 ;i--){
            if(typeof core.entities[i].draw != "undefined")
                core.entities[i].draw();
        }

        requestAnimationFrame(update);
    }
    update();
}

class InputManager{
    constructor(){
        this.keys = new Array();
        this.mousepos = {x: 0, y: 0};

        document.onkeydown = (e) => {
            this.removeKey(e.key);
            this.keys.push(e.key);
        };

        document.onmousedown = (e)=>{
            this.removeKey("click");
            this.keys.push("click");
            if(player != null)
                e.preventDefault();
        }

        document.onmouseup = (e)=>{
            this.removeKey("click");
        }

        document.onmousemove = (e)=>{
            this.mousepos.x = e.clientX;
            this.mousepos.y = e.clientY;
        }

        document.onkeyup = (e) => {
            this.removeKey(e.key);
        };
    }

    getKey(key){
        for(let i = 0; i < this.keys.length; i++){
            if(this.keys[i].toUpperCase() == key.toUpperCase()){
                return true;
            }
        }
        return false;
    }

    removeKey(key){
        for(let i = 0; i < this.keys.length; i++){
            if(this.keys[i] == key){
                this.keys.splice(i,1);
            }
        }
    }
}
core.inputs = new InputManager();

class World{
    constructor(id){
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = WORLD_SIZE;
        this.canvas.height = WORLD_SIZE;
        this.canvas.style.display = "none";
        setImageSmoothing(this.ctx,false);
    }

    collision(x,y,w,h){
        let pix = this.ctx.getImageData(x - w/2, y - h/2, w, h).data; 
        for (var i = 0, n = pix.length; i < n; i += 4) {
            if(pix[i+3] > 0){
                return true;
            }
        }
        return false;
    }
    
    collisionValue(x,y,w,h){
        let pix = this.ctx.getImageData(x - w/2, y - h/2, w, h).data; 
        let averageOpacity = 0;
        for (var i = 0, n = pix.length; i < n; i += 4) {
            averageOpacity += pix[i+3];
        }
        averageOpacity = (averageOpacity/(w*h))/255;
        return averageOpacity;
    }
    
    loadlevel(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        let img = new Image();
        img.onload = ()=>{
            this.ctx.drawImage(img,0, 0,this.canvas.width,this.canvas.height);
            core.light.calculate();     
        }
        img.src = "levels/level2.png";
    }

    dig(x,y,radius){
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.beginPath();
        this.ctx.globalCompositeOperation = 'destination-out';
        this.ctx.arc(0,0,radius,0,2 * Math.PI);
        this.ctx.fill();
        this.ctx.globalCompositeOperation = 'source-over';
        this.ctx.restore();
        core.light.calculatePart(x-radius,x+radius);
    }
}

class Renderer{
    constructor(id){
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.position = {x: 0,y: 0,z: 0};

        this.isShaking = false;
        this.shakePower = 0;
        this.shakeTimer = {x: 0,y: 0};
        this.shake = {x: 0,y: 0};
    }

    moveCamera(x,y,z){
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    screenShake(power){
        let ratio = power/1000;
        this.shakePower = ratio > 0.1 ? 50 * ratio : 0;
        this.shakeTimer = {x: Math.PI *2 * Math.random(),y: Math.PI *2 * Math.random()};
        this.isShaking = true;
    }

    update(){
        if(this.isShaking){ 
            this.shake.x += Math.sin(this.shakeTimer.x) * this.shakePower;
            this.shake.y += Math.sin(this.shakeTimer.y) * this.shakePower;
            this.shakeTimer.x += deltaTime * 80;  
            this.shakeTimer.y += deltaTime * 80;         
            if(this.shakeTimer.x > Math.PI * 2 * 4){
                this.shakeTimer = {x: 0,y: 0};
                this.shake = {x: 0,y: 0};
                this.isShaking = false;
            }
        }
    }

    getOffset(){
        return {x: this.position.x + this.shake.x - this.canvas.width/2,y: this.position.y + this.shake.y - this.canvas.height/2,z: this.position.z};
    }
 
    draw(data){
        this.ctx.drawImage(data,-this.getOffset().x, -this.getOffset().y,data.width,data.height);
    }
    
    clear(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }
}

function setImageSmoothing(ctx,val){
    ctx.mozImageSmoothingEnabled = val;
    ctx.webkitImageSmoothingEnabled = val;
    ctx.msImageSmoothingEnabled = val;
    ctx.imageSmoothingEnabled = val;
}

class Light{
    constructor(id){
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        this.rays = new Array();
        this.precision = 400;
        for(let i = 0;i<this.precision;i++){
            this.rays.push(new LightRay((WORLD_SIZE * 2)/this.precision * i));
        }
    }

    calculate(){
        this.rays.forEach((ray)=>{  
            ray.hit.y = 0;
            ray.hit.x = 0;
        });
        setTimeout(()=>{
            this.calculatePart(0,WORLD_SIZE);
        },10);
    }

    calculatePart(min,max){
        (async () =>{
            for(let i = 0;i<this.rays.length;i++){
                if(this.rays[i].hit.x >= min - 1 && this.rays[i].hit.x <= max + 1){
                    this.rays[i].calculate(); 
                    await sleep(0);           
                }
            }
        })();
    }

    draw(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        this.ctx.beginPath();

        let of = core.renderer.getOffset();
        this.ctx.beginPath();

                
        this.ctx.moveTo(0,window.innerHeight);
        this.ctx.lineTo(0,this.rays[0].hit.y);

        this.rays.forEach((ray)=>{  
            if(ray.hit.y != WORLD_SIZE){
                this.ctx.lineTo(ray.hit.x - of.x,ray.hit.y - of.y);
            }else{
                this.ctx.lineTo(ray.x - WORLD_SIZE * 2 - of.x,WORLD_SIZE * 2 - of.y);
            }
        });

        this.ctx.lineTo(window.innerWidth,this.rays[this.precision - 1].hit.y);        
        this.ctx.lineTo(window.innerWidth,window.innerHeight);
        this.ctx.filter = 'blur(5px)';
        this.ctx.fillStyle = "rgba(51,0,0,0.3)";
        this.ctx.fill();
        this.ctx.filter = 'none';
    }
}

class LightRay{
    constructor(x){
        this.x = x;
        this.hit = {x: 0,y:0};
    }

    calculate(){
        (async () =>{
            for(let i = this.hit.y; i<WORLD_SIZE; i+=10){
                if(i > this.hit.y){
                    this.hit.y = i;
                    this.hit.x = this.x - i;
                }
                if(core.world.collision(this.hit.x-1,this.hit.y,1,1)){
                    return;
                }
                await sleep(0); 
            }
            this.hit.y = WORLD_SIZE;
        })();
    }
      
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  

