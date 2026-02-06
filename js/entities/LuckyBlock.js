import { Entity } from './Entity.js';

export class LuckyBlock extends Entity {
    constructor(x, y, distance) {
        super(x, y, 40, 40);
        this.initialY = y;
        this.active = true;
        this.isOpened = false;
        
        // ÉCONOMIE REVUE
        // Ancien calcul : 50 + (15000 / 100) * 10 = 1550$ -> Trop cher.
        // Nouveau calcul : 50 + (15000 / 250) = 50 + 60 = 110$ -> Abordable.
        // Prix min : 50$. Augmente de 1$ tous les 2.5m (250px).
        this.price = Math.floor(50 + (distance / 250));
        
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update(dt) {
        const time = Date.now() / 300;
        this.y = this.initialY + Math.sin(time + this.floatOffset) * 5;
    }

    draw(ctx) {
        super.draw(ctx);
        if (!this.isOpened) {
            ctx.save();
            ctx.fillStyle = "white";
            ctx.font = "bold 14px Arial";
            ctx.textAlign = "center";
            // Ombre portée pour lisibilité
            ctx.shadowColor = "black";
            ctx.shadowBlur = 4;
            ctx.fillText(`$${this.price}`, this.x, this.y - 30);
            ctx.font = "10px Arial";
            ctx.fillText("[F]", this.x, this.y - 45);
            ctx.restore();
        }
    }

    _render(ctx) {
        if (this.isOpened) {
            ctx.fillStyle = "#555";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.strokeStyle = "#333";
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
        } else {
            ctx.fillStyle = "#f1c40f"; 
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.strokeStyle = "#e67e22";
            ctx.lineWidth = 3;
            ctx.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.fillStyle = "#d35400";
            ctx.font = "bold 28px monospace";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("?", 0, 2);
        }
    }
}