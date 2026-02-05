export class Entity {
    constructor(x, y, width, height) {
        if (this.constructor === Entity) {
            throw new TypeError("Abstract class Entity cannot be instantiated");
        }
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.vx = 0;
        this.vy = 0;
        this.angle = 0;
        this.friction = 0.90;
        this.gravity = 0.6;
    }

    update(dt) {
        this.vx *= this.friction;
        this.vy += this.gravity;
        this.x += this.vx;
        this.y += this.vy;
        
        this.angle = this.vx * 0.05;
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        this._render(ctx);
        ctx.restore();
    }

    _render(ctx) {
        throw new Error("Method _render() must be implemented");
    }
}