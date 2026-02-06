import { Entity } from './Entity.js';

export class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = -5 - Math.random() * 5;
        this.value = 10;
        this.bounciness = 0.2;
        this.active = true;
    }

    update(dt, terrain) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        const groundY = terrain.getHeight(this.x);
        if (this.y + this.height / 2 > groundY) {
            this.y = groundY - this.height / 2;
            this.vy *= -this.bounciness;
            this.vx *= 0.9;
            
            if (Math.abs(this.vy) < 1) this.vy = 0;
        }

        if (this.y > terrain.baseHeight + 500) {
            this.active = false;
        }
    }

    _render(ctx) {
        ctx.fillStyle = "#f1c40f";
        ctx.beginPath();
        ctx.arc(0, 0, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.strokeStyle = "#f39c12";
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = "#f39c12";
        ctx.font = "bold 12px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("$", 0, 1);
    }
}   