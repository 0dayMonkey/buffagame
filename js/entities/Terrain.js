import { Noise } from './Noise.js';

export class Terrain {
    constructor(baseHeight) {
        this.noise = new Noise();
        this.baseHeight = baseHeight;
        this.chunkSize = 100;
        this.step = 5;
        this.holes = [];
    }

    addHole(x, width) {
        this.holes.push({ x, width });
    }

    isInHole(x) {
        return this.holes.find(h => x >= h.x && x <= h.x + h.width);
    }

    getHeight(x) {
        const hole = this.isInHole(x);
        if (hole) return this.baseHeight + 350;

        const flatMask = (Math.sin(x * 0.0003) + 1) / 2;
        const isFlatZone = flatMask > 0.9;
        if (isFlatZone) return this.baseHeight;

        let amplitude = 250;
        let frequency = 0.0002;
        let y = 0;
        for (let i = 0; i < 2; i++) {
            y += this.noise.noise(x * frequency, 0) * amplitude;
            amplitude *= 0.3;
            frequency *= 3;
        }

        const blendFactor = Math.max(0, Math.min(1, (flatMask - 0.7) * 5));
        const targetHeight = this.baseHeight - y;
        return targetHeight * (1 - blendFactor) + this.baseHeight * blendFactor;
    }

    getSlopeAngle(x) {
        const delta = 10;
        const y1 = this.getHeight(x - delta);
        const y2 = this.getHeight(x + delta);
        return Math.atan2(y2 - y1, delta * 2);
    }

    draw(ctx, cameraX, width, height) {
        const startX = Math.floor(cameraX / this.step) * this.step - this.step;
        const endX = cameraX + width + this.step;

        ctx.fillStyle = "#4e342e";
        ctx.beginPath();
        ctx.moveTo(startX, height);

        for (let x = startX; x <= endX; x += this.step) {
            const y = this.getHeight(x);
            if (y > this.baseHeight + 300) {
                ctx.lineTo(x, height);
                ctx.moveTo(x + this.step, height);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.lineTo(endX, height);
        ctx.fill();

        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 8;
        ctx.beginPath();
        for (let x = startX; x <= endX; x += this.step) {
            const y = this.getHeight(x);
            if (y <= this.baseHeight + 300) {
                if (x === startX || this.getHeight(x - this.step) > this.baseHeight + 300) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
        }
        ctx.stroke();
    }
}