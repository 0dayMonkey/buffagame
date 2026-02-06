import { Entity } from './Entity.js';

export class Brain extends Entity {
    constructor(x, y) {
        super(x, y, 24, 20);
        this.gravity = 0.5;
        this.friction = 0.98;
        this.groundFriction = 0.80; 
        this.active = true;
        this.timer = 600; 
        this.isStabilized = false;
    }

    update(dt, canvas, terrain, obstacles) {
        this.vy += this.gravity;
        this.vx *= this.friction;
        
        this.x += this.vx;
        this.y += this.vy;
        
        if (terrain) {
            const groundY = terrain.getHeight(this.x);
            if (this.y + this.height / 2 > groundY) {
                this.y = groundY - this.height / 2;
                this.vy = 0;
                
                const slope = terrain.getSlopeAngle(this.x);
                this.angle = slope;

                if (!this.isStabilized) {
                    this.vx *= this.groundFriction;
                    
                    if (Math.abs(slope) > 0.2) {
                        this.vx += Math.sin(slope) * 0.3;
                    }

                    if (Math.abs(this.vx) < 0.2 && Math.abs(slope) < 0.3) {
                        this.vx = 0;
                        this.isStabilized = true;
                    }
                } else {
                    this.vx = 0;
                    if (Math.abs(slope) > 0.5) {
                        this.isStabilized = false;
                    }
                }
            } else {
                this.angle += this.vx * 0.05;
                this.isStabilized = false;
            }
        }

        if (obstacles) {
            obstacles.forEach(o => {
                const overlapX = (this.width + o.width) / 2 - Math.abs(this.x - o.x);
                const overlapY = (this.height + o.height) / 2 - Math.abs(this.y - o.y);

                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX < overlapY) {
                        this.x += this.x < o.x ? -overlapX : overlapX;
                        this.vx *= -0.4; 
                    } else {
                        this.y += this.y < o.y ? -overlapY : overlapY;
                        this.vy *= -0.2; 
                        this.isStabilized = false;
                    }
                }
            });
        }
        
        this.timer--;
        if (this.timer <= 0) this.active = false;
    }

    _render(ctx) {
        ctx.fillStyle = "#e0a3a3";
        
        ctx.beginPath();
        ctx.ellipse(-4, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(4, 0, 10, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = "#c48282";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-8, -2);
        ctx.quadraticCurveTo(-4, -6, 0, -2);
        ctx.quadraticCurveTo(4, -6, 8, -2);
        ctx.stroke();

        ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        ctx.beginPath();
        ctx.ellipse(-4, -3, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(4, -3, 3, 2, 0, 0, Math.PI * 2);
        ctx.fill();
    }
}