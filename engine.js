const core = {};

core.deltaTime = 0;
core.time = 0;
core.entities = new Array();
core.ctx_world = null;
ctx_entities = null;

core.createEntity = function( entity){
    this.entities.push(entity);
    return entity;
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
    let canvas_map = document.getElementById("map");
    let canvas_entities = document.getElementById("entities");

    this.ctx_world = canvas_map.getContext("2d");
    ctx_entities = canvas_entities.getContext("2d");

    setCanvasSize(canvas_map);
    setCanvasSize(canvas_entities);

    this.deltaTime = 0;
    this.time = Date.now();
    function update(){
        ctx_entities.clearRect(0,0,window.innerWidth,window.innerHeight);
        this.deltaTime = (Date.now() - this.time)/1000;
        this.time = Date.now();

        core.entities.forEach((obj)=>{
            obj.update();
        });
        core.entities.forEach((obj)=>{
            obj.draw(ctx_entities);
        });

        requestAnimationFrame(update);
    }
    update();
}

core.collision = function(x,y,w,h){
    return this.collisionValue(x,y,w,h) != 0;
}

core.collisionValue = function(x,y,w,h){
    let pix = this.ctx_world.getImageData(x - w/2, y - h/2, w, h).data; 
    let averageOpacity = 0;
    for (var i = 0, n = pix.length; i < n; i += 4) {
        averageOpacity += pix[i+3];
    }
    averageOpacity = (averageOpacity/(w*h))/255;
    return averageOpacity;
}

core.loadlevel = function(){
    this.ctx_world.clearRect(0,0,window.innerWidth,window.innerHeight);
    let img = new Image();
    img.onload = ()=>{
        this.ctx_world.drawImage(img,0, 0,window.innerWidth,window.innerHeight);
    }
    img.src = "levels/test2.png";
}

core.digMap = function(x,y,radius){
    this.ctx_world.save();
    this.ctx_world.translate(x, y);
    this.ctx_world.beginPath();
    this.ctx_world.globalCompositeOperation = 'destination-out';
    this.ctx_world.arc(0,0,radius,0,2 * Math.PI);
    this.ctx_world.fill();
    this.ctx_world.globalCompositeOperation = 'source-over';
    this.ctx_world.restore();
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

function setCanvasSize(canvas){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

function setImageSmoothing(ctx,val){
    ctx.mozImageSmoothingEnabled = val;
    ctx.webkitImageSmoothingEnabled = val;
    ctx.msImageSmoothingEnabled = val;
    ctx.imageSmoothingEnabled = val;
}