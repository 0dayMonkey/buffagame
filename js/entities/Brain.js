import { Entity } from './Entity.js';

export class Brain extends Entity {
    constructor(x, y) {
        super(x, y, 20, 20);
        this.gravity = 0.5;
        this.friction = 0.8;
        this.active = true;
        this.timer = 500; 
    }

    update(dt, canvas, terrain) {
        super.update(dt);
        
        const groundY = terrain ? terrain.getHeight(this.x) : canvas.height;
        
        if (this.y + this.height / 2 > groundY) {
            this.y = groundY - this.height / 2;
            this.vy = 0;
            this.vx = 0;
            if (terrain) this.angle = terrain.getSlopeAngle(this.x);
        }
        
        this.timer--;
        if (this.timer <= 0) this.active = false;
    }

    _render(ctx) {
        ctx.fillStyle = "#ff9999";
        ctx.beginPath();
        ctx.arc(0, 0, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ff6666";
        ctx.fillRect(-5, -2, 10, 4);
    }
}