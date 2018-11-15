function clamp(val,min,max){
    if(val < min)
        return min;
    else if(val > max)
        return max;
    else
        return val;
}

function drawRect(ctx,x,y,w,h,color,rotation = 0){
    ctx.save();
    ctx.translate(x, y);
    if(rotation != 0)
        ctx.rotate(Math.PI/180 * rotation);
    ctx.beginPath();
    ctx.rect(-w/2,-h/2,w,h);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.restore();
}

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

