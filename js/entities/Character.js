import { Entity } from './Entity.js';

export class Character extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.health = 100;
        this.speed = 0.6;
        this.isGrounded = false;
        this.gravity = 0.28;
        this.friction = 0.94;
    }

    applyPhysics(terrain) {
        this.vy += this.gravity;
        this.vx *= this.friction;
        
        const groundY = terrain.getHeight(this.x);
        const feetY = this.y + this.height / 2;

        if (feetY >= groundY) {
            const slope = terrain.getSlopeAngle(this.x);
            if (this.vy > 0) {
                this.y = groundY - this.height / 2;
                this.vy = 0;
            }
            this.isGrounded = true;
            this.angle += (slope - this.angle) * 0.1;
        } else {
            this.isGrounded = false;
        }
    }

    checkBounds(canvas) {
        if (this.x < 0) this.x = 0;
    }
}