import { Entity } from './Entity.js';

export class Projectile extends Entity {
    constructor(x, y, angle, power, range) {
        super(x, y, 25, 6);
        this.angle = angle;
        this.vx = Math.cos(angle) * power;
        this.vy = Math.sin(angle) * power;
        this.gravity = 0.28;
        this.friction = 0.99;
        this.active = true;
        this.connectedZombie = null;
        this.isStuck = false;
        this.stuckTimer = 0;
        this.maxLife = range || 60;
        this.life = 0;
    }

    update(dt, canvas, terrain) {
        if (this.connectedZombie) {
            this.x = this.connectedZombie.x;
            this.y = this.connectedZombie.y;
            return;
        }
        if (this.isStuck) {
            this.stuckTimer++;
            if (this.stuckTimer > 30) this.active = false;
            return;
        }

        this.life++;
        if (this.life > this.maxLife) {
            this.active = false;
        }

        super.update(dt);
        this.angle = Math.atan2(this.vy, this.vx);
        
        if (terrain) {
            const groundY = terrain.getHeight(this.x);
            if (this.y >= groundY && !this.isStuck) {
                this.y = groundY;
                this.isStuck = true;
                this.vx = 0;
                this.vy = 0;
            }
        }
        
        if (this.x < -2000 || this.x > this.x + 10000) {
            this.active = false;
        }
    }

    draw(ctx) {
        super.draw(ctx);
    }

    _render(ctx) {
        ctx.fillStyle = "#f1c40f";
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = "#bdc3c7";
        ctx.beginPath();
        ctx.moveTo(this.width / 2, -this.height);
        ctx.lineTo(this.width / 2 + 18, 0);
        ctx.lineTo(this.width / 2, this.height);
        ctx.fill();
    }
}