import { Entity } from './Entity.js';

export class Projectile extends Entity {
    constructor(x, y, angle, power, range, owner) {
        super(x, y, 25, 6);
        this.angle = angle;
        this.vx = Math.cos(angle) * power;
        this.vy = Math.sin(angle) * power;
        this.gravity = 0.5;
        this.active = true;
        this.connectedZombie = null;
        this.isStuck = false;
        this.stuckTimer = 0;
        this.maxLife = range || 60;
        this.life = 0;
        this.owner = owner;
        this.state = 'FLYING'; 
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

        if (this.state === 'FLYING') {
            this.life++;
            if (this.life > this.maxLife) {
                this.state = 'RETRACTING';
                this.vx *= 0.1; 
                this.vy *= 0.1;
            }
            
            this.vx *= 0.99; 
            this.vy += 0.28; 
            this.x += this.vx;
            this.y += this.vy;
            this.angle = Math.atan2(this.vy, this.vx);

            if (terrain) {
                const groundY = terrain.getHeight(this.x);
                if (this.y >= groundY) {
                    this.y = groundY;
                    this.isStuck = true;
                    this.vx = 0;
                    this.vy = 0;
                }
            }
        } 
        else if (this.state === 'RETRACTING') {
            const dx = this.owner.x - this.x;
            const dy = this.owner.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < 30) {
                this.active = false;
            } else {
                const angleToPlayer = Math.atan2(dy, dx);
                const pullSpeed = 15; 
                this.vx = Math.cos(angleToPlayer) * pullSpeed;
                this.vy += this.gravity; 
                this.vy *= 0.9; 

                this.x += this.vx;
                this.y += this.vy;

                if (terrain) {
                    const groundY = terrain.getHeight(this.x);
                    if (this.y >= groundY) {
                        this.y = groundY;
                        this.vy = 0; 
                    }
                }
                
                this.angle = angleToPlayer + Math.PI; 
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