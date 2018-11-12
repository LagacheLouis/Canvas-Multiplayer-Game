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

