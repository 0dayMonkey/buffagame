import { Entity } from './Entity.js';

export class Obstacle extends Entity {
    constructor(x, y, type) {
        let width = 60;
        let height = 50;
        if (type === 'STUMP') { width = 45; height = 40; }
        if (type === 'ROCK') { width = 70; height = 60; }
        if (type === 'LOG') { width = 120; height = 40; }
        
        super(x, y, width, height);
        this.type = type;
        this.active = true;
    }

    update(dt) {
    }

    _render(ctx) {
        ctx.fillStyle = this.type === 'STUMP' ? '#5d4037' : '#78909c';
        if (this.type === 'LOG') ctx.fillStyle = '#4e342e';
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.strokeStyle = 'rgba(0,0,0,0.2)';
        ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
    }
}