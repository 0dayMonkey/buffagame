import { Entity } from './Entity.js';

export class Coin extends Entity {
    constructor(x, y) {
        super(x, y, 16, 16);
        this.vx = (Math.random() - 0.5) * 10;
        this.vy = -5 - Math.random() * 5;
        this.value = 10;
        this.bounciness = 0.6;
        this.active = true;
    }

    onCollect(particleSystem) {
        if (particleSystem) {
            particleSystem.emit(this.x, this.y, 'SPARK', 5);
        }
    }

    update(dt, terrain, obstacles) {
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;

        if (terrain) {
            const groundY = terrain.getHeight(this.x);
            if (this.y + this.height / 2 > groundY) {
                this.y = groundY - this.height / 2;
                this.vy *= -this.bounciness;
                this.vx *= 0.9;
                
                if (Math.abs(this.vy) < 1) this.vy = 0;
            }
        }

        if (obstacles) {
            obstacles.forEach(o => {
                const overlapX = (this.width + o.width) / 2 - Math.abs(this.x - o.x);
                const overlapY = (this.height + o.height) / 2 - Math.abs(this.y - o.y);

                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX < overlapY) {
                        this.x += this.x < o.x ? -overlapX : overlapX;
                        this.vx *= -0.8; 
                    } else {
                        this.y += this.y < o.y ? -overlapY : overlapY;
                        this.vy *= -this.bounciness;
                    }
                }
            });
        }

        if (terrain && this.y > terrain.baseHeight + 500) {
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