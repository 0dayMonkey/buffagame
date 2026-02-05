import { Entity } from './Entity.js';

export class Character extends Entity {
    constructor(x, y, width, height) {
        super(x, y, width, height);
        this.health = 100;
        this.speed = 1.2;
        this.isGrounded = false;
        this.gravity = 0.45;
    }

    applyPhysics(terrain) {
        this.vy += this.gravity;
        
        const groundY = terrain.getHeight(this.x);
        const feetY = this.y + this.height / 2;

        if (feetY > groundY) {
            this.y = groundY - this.height / 2;
            if (this.vy > 0) this.vy = 0;
            this.isGrounded = true;
            this.angle = terrain.getSlopeAngle(this.x);
        } else {
            this.isGrounded = false;
        }
    }

    checkBounds(canvas) {
        if (this.x < 0) this.x = 0;
    }
}