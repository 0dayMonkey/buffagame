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

        if (groundY > terrain.baseHeight + 400) {
            this.isFallingInHole = true;
            this.isGrounded = false;
            
            if (feetY >= groundY - 50) {
                this.y = groundY - 50 - this.height / 2;
                this.vy = -20;
                this.scaleX = 1.5;
                this.scaleY = 0.5;
            }
        } else {
            this.isFallingInHole = false;
            if (feetY >= groundY) {
                const slope = terrain.getSlopeAngle(this.x);
                if (!this.isGrounded && this.vy > 2) {
                    this.scaleX = 1.3;
                    this.scaleY = 0.7;
                }
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

        this.scaleX += (1 - this.scaleX) * 0.15;
        this.scaleY += (1 - this.scaleY) * 0.15;
    }

    checkBounds(canvas) {
        if (this.x < 0) this.x = 0;
    }
}