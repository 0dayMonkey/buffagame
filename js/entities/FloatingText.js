import { Entity } from './Entity.js';

export class FloatingText extends Entity {
    constructor(x, y, text, color) {
        super(x, y, 0, 0);
        this.text = text;
        this.color = color;
        this.life = 60;
        this.opacity = 1;
        this.vy = -1;
    }

    update(dt) {
        this.y += this.vy;
        this.life--;
        this.opacity = this.life / 60;
        if (this.life <= 0) this.active = false;
    }

    _render(ctx) {
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = "bold 20px Arial";
        ctx.fillText(this.text, 0, 0);
        ctx.globalAlpha = 1;
    }
}