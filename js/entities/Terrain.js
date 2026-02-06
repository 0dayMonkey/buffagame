import { Noise } from './Noise.js';

export class Terrain {
    constructor(baseHeight) {
        this.noise = new Noise();
        this.baseHeight = baseHeight;
        this.chunkSize = 100;
        this.step = 5; // Résolution horizontale
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
        // Optimisation rendu : On dessine un peu plus large que l'écran pour éviter le flickering sur les bords
        const buffer = 100;
        const startX = Math.floor((cameraX - buffer) / this.step) * this.step;
        const endX = cameraX + width + buffer;

        // 1. DESSIN DE LA TERRE (Remplissage)
        ctx.fillStyle = "#4e342e";
        ctx.beginPath();
        
        // On commence en bas à gauche
        ctx.moveTo(startX, height); 
        
        for (let x = startX; x <= endX; x += this.step) {
            const y = this.getHeight(x);
            // On force un "plafond" pour éviter de dessiner par dessus les trous graphiquement
            if (y > this.baseHeight + 300) {
                ctx.lineTo(x, height); 
            } else {
                ctx.lineTo(x, Math.floor(y)); // Math.floor évite le flou/sub-pixel rendering
            }
        }
        
        // On ferme la forme en bas à droite
        ctx.lineTo(endX, height);
        ctx.lineTo(startX, height);
        ctx.closePath();
        ctx.fill();

        // 2. DESSIN DE L'HERBE (Contour)
        ctx.strokeStyle = "#2ecc71";
        ctx.lineWidth = 10;
        ctx.lineCap = "round"; // Adoucit les joints
        ctx.lineJoin = "round";
        ctx.beginPath();

        let isDrawing = false;

        for (let x = startX; x <= endX; x += this.step) {
            const y = this.getHeight(x);
            
            // Si c'est un trou, on arrête de dessiner l'herbe
            if (y > this.baseHeight + 300) {
                isDrawing = false;
            } else {
                if (!isDrawing) {
                    ctx.moveTo(x, Math.floor(y));
                    isDrawing = true;
                } else {
                    ctx.lineTo(x, Math.floor(y));
                }
            }
        }
        ctx.stroke();
    }
}