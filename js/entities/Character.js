import { Entity } from './Entity.js';

export class Character extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.health = 100;
        this.speed = 0.7;
        this.isGrounded = false;
        this.gravity = 0.22;
        this.friction = 0.92;
    }

    applyPhysics(terrain) {
        this.vy += this.gravity;
        this.vx *= this.friction;
        
        const groundY = terrain.getHeight(this.x);
        const feetY = this.y + this.height / 2;

        if (feetY >= groundY) {
            const slope = terrain.getSlopeAngle(this.x);
            this.y = groundY - this.height / 2;
            
            if (this.vy > 0) this.vy = 0;
            
            this.isGrounded = true;
            this.angle += (slope - this.angle) * 0.15;
        } else {
            this.isGrounded = false;
        }
    }

    checkBounds(canvas) {
        if (this.x < 0) this.x = 0;
    }
}