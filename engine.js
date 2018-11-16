const core = {};

core.deltaTime = 0;
core.time = 0;

core.entities = new Array();
core.world = null;
core.renderer = null;

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
    ctx_entities = canvas_entities.getContext("2d");

    canvas_entities.width = window.innerWidth;
    canvas_entities.height = window.innerHeight;


    this.deltaTime = 0;
    this.time = Date.now();

    function update(){

        ctx_entities.clearRect(0,0,window.innerWidth,window.innerHeight);

        this.deltaTime = (Date.now() - this.time)/1000;
        this.time = Date.now();

        core.renderer.clear();
        core.renderer.draw(core.world.canvas);

        //core.light.draw();

        core.entities.forEach((obj)=>{
            if(typeof obj.update != "undefined")
                obj.update();
        });
        core.entities.forEach((obj)=>{
            if(typeof obj.draw != "undefined")
                obj.draw(ctx_entities);
        });

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
        this.canvas.width = 2000;
        this.canvas.height = 2000;
        this.canvas.style.display = "none";
        setImageSmoothing(this.ctx,false);
    }

    collision(x,y,w,h){
        return this.collisionValue(x,y,w,h) != 0;
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
           /* this.ctx.rect(0,0,this.canvas.width,this.canvas.height);
            this.ctx.fillStyle = "green";
            this.ctx.fill();*/
            //core.light.calculate();
        }
        img.src = "levels/level.png";
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

        //core.light.calculate();
    }
}

class Renderer{
    constructor(id){
        this.canvas = document.getElementById(id);
        this.ctx = this.canvas.getContext("2d");
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.position = {x: 0,y: 0,z: 0};
    }

    moveCamera(x,y,z){
        this.position.x = x;
        this.position.y = y;
        this.position.z = z;
    }

    getOffset(){
        return {x: this.position.x - this.canvas.width/2,y: this.position.y - this.canvas.height/2,z: this.position.z};
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

        this.hits = new Array();
    }

    calculate(){
        this.hits.length = 0;
        let precision = 300;
        for(let i = 0;i<precision;i++){
            this.hits.push(raycast(i * (2000/precision),0,0,1,2000));
        }
    }

    draw(){
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        let of = core.renderer.getOffset();
        this.ctx.beginPath();
        this.ctx.moveTo(0,0);
        this.hits.forEach((hit)=>{       
            this.ctx.lineTo(hit.x - of.x,hit.y - of.y);
        });
        this.ctx.lineTo(this.canvas.width,0);
        this.ctx.fillStyle = "rgb(255,255,255,0.5)";
        this.ctx.fill();
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
    return collidePosition;
}