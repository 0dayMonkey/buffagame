import { Entity } from './Entity.js';

export class Spot extends Entity {
    constructor(x, y) {
        super(x, y, 60, 20);
    }
    
    draw(ctx) { 
        super.draw(ctx);
    }

    _render(ctx) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
        ctx.beginPath();
        ctx.ellipse(0, 0, 30, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#4e342e";
        ctx.lineWidth = 3;
        ctx.stroke();
    }
}