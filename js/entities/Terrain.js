import { Noise } from './Noise.js';

export class Terrain {
    constructor(baseHeight) {
        this.noise = new Noise();
        this.baseHeight = baseHeight;
        this.chunkSize = 100;
        this.step = 10; 
    }

    getHeight(x) {
        const flatMask = (Math.sin(x * 0.0005) + 1) / 2; 
        const isFlatZone = flatMask > 0.85;

        if (isFlatZone) {
            return this.baseHeight;
        }

        let amplitude = 160;
        let frequency = 0.0007;
        let y = 0;
        let maxAmp = 0;

        for (let i = 0; i < 2; i++) {
            y += this.noise.noise(x * frequency, 0) * amplitude;
            maxAmp += amplitude;
            amplitude *= 0.4;
            frequency *= 2.2;
        }

        const blendFactor = Math.max(0, (flatMask - 0.7) * 3.3); 
        return (this.baseHeight - y) * (1 - blendFactor) + this.baseHeight * blendFactor;
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