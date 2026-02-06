import { Entity } from './Entity.js';

export class Character extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.health = 100;
        this.speed = 0.6;
        this.isGrounded = false;
        this.gravity = 0.28;
        this.friction = 0.94;
        this.scaleX = 1;
        this.scaleY = 1;
        this.isFallingInHole = false;
    }

    applyPhysics(terrain) {
        this.vy += this.gravity;
        this.vx *= this.friction;
        
        const groundY = terrain.getHeight(this.x);
        const feetY = this.y + this.height / 2;

        if (groundY > terrain.baseHeight + 200) {
            this.isFallingInHole = true;
            this.isGrounded = false;
        } else {
            this.isFallingInHole = false;
            if (feetY >= groundY - 5) {
                this.y = groundY - this.height / 2;
                if (this.vy > 0) this.vy = 0;
                this.isGrounded = true;
                const slope = terrain.getSlopeAngle(this.x);
                this.angle += (slope - this.angle) * 0.1;
            } else {
                this.isGrounded = false;
            }
        }

        this.scaleX += (1 - this.scaleX) * 0.15;
        this.scaleY += (1 - this.scaleY) * 0.15;
    }
}