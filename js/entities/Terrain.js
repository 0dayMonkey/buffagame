import { Noise } from './Noise.js';

export class Terrain {
    constructor(baseHeight) {
        this.noise = new Noise();
        this.baseHeight = baseHeight;
        this.chunkSize = 100;
        this.step = 5; 
    }

    getHeight(x) {
        const flatMask = (Math.sin(x * 0.0003) + 1) / 2; 
        const isFlatZone = flatMask > 0.9;

        if (isFlatZone) {
            return this.baseHeight;
        }

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
        ctx.fillStyle = "#2c3e50";
        ctx.beginPath();
        
        const startX = Math.floor(cameraX / this.step) * this.step - this.step;
        const endX = cameraX + width + this.step;

        ctx.moveTo(startX, height); 
        ctx.lineTo(startX, this.getHeight(startX));

        for (let x = startX; x <= endX; x += this.step) {
            ctx.lineTo(x, this.getHeight(x));
        }

        ctx.lineTo(endX, height);
        ctx.fill();

        ctx.lineWidth = 5;
        ctx.strokeStyle = "#2ecc71";
        ctx.stroke();
    }
}