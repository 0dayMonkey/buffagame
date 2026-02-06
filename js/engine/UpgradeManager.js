export class UpgradeManager {
    constructor(game) {
        this.game = game;
        this.player = game.player;
        
        this.width = 240;
        this.barHeight = 16;
        this.spacing = 5;
        this.opacity = 0.1;
        this.buttons = [];
        this.prevKeys = {}; 
        
        this.colors = {
            bg: "rgba(0, 0, 0, 0)", 
            barBg: "rgba(0, 0, 0, 0.6)",
            text: "#ecf0f1",
            textShadow: "rgba(0,0,0,0.9)"
        };
    }

    update(input) {
        let newTarget = 0.1;

        if (this.canAffordAnything()) {
            newTarget = 0.5;
        }

        const mx = input.mouse.x;
        const my = input.mouse.y;
        const menuX = this.game.canvas.width - this.width - 20;
        const menuH = 350; 
        const isHovering = (mx > menuX && mx < menuX + this.width && my > 10 && my < menuH);
        
        if (isHovering || input.isPressed('KeyU')) {
            newTarget = 1.0;
        }

        this.opacity += (newTarget - this.opacity) * 0.1;

        const keys = ['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6', 'Digit7', 'Digit8'];
        const statKeys = ['magnet', 'speed', 'jetpack', 'charge', 'pull', 'cable'];
        
        for(let i = 0; i < statKeys.length; i++) {
            const key = keys[i];
            const isPressed = input.isPressed(key);
            if (isPressed && !this.prevKeys[key]) {
                this.player.upgradeStat(statKeys[i]);
            }
            this.prevKeys[key] = isPressed;
        }

        const k7 = 'Digit7';
        if (input.isPressed(k7) && !this.prevKeys[k7]) this.buyMedkit();
        this.prevKeys[k7] = input.isPressed(k7);

        const k8 = 'Digit8';
        if (input.isPressed(k8) && !this.prevKeys[k8]) this.buyGoldenBrain();
        this.prevKeys[k8] = input.isPressed(k8);


        if (input.getClick() && this.opacity > 0.3) {
            this.buttons.forEach(btn => {
                if (mx >= btn.x && mx <= btn.x + btn.w && my >= btn.y && my <= btn.y + btn.h) {
                    btn.action();
                }
            });
        }
    }

    canAffordAnything() {
        for (let key in this.player.stats) {
            if (this.player.money >= this.player.stats[key].cost && this.player.stats[key].lvl < this.player.stats[key].max) return true;
        }
        if (this.player.money >= 500 && this.player.lives < this.player.maxLives) return true;
        if (this.player.money >= 1000) return true;
        return false;
    }

    buyMedkit() {
        if (this.player.money >= 500 && this.player.lives < this.player.maxLives) {
            this.player.money -= 500;
            this.player.lives++;
            this.game.addFloatingText("+1 ❤️", this.player.x, this.player.y - 80, "#e91e63");
        }
    }

    buyGoldenBrain() {
        if (this.player.money >= 1000) {
            this.player.money -= 1000;
            this.game.triggerGoldenBrain();
            this.game.addFloatingText("BRAIN LURE!", this.player.x, this.player.y - 80, "#f1c40f");
        }
    }

    draw(ctx) {
        if (this.opacity < 0.05) return;

        this.buttons = [];
        ctx.save();
        ctx.globalAlpha = this.opacity;

        const startX = this.game.canvas.width - this.width - 20;
        let currentY = 20;

        ctx.fillStyle = this.colors.bg;

        this._drawConsumable(ctx, startX, currentY, 7, "MEDKIT", 500, "#27ae60", () => this.buyMedkit());
        currentY += this.barHeight + this.spacing;
        
        this._drawConsumable(ctx, startX, currentY, 8, "GOLDEN BRAIN", 1000, "#d35400", () => this.buyGoldenBrain());
        currentY += (this.barHeight + this.spacing) * 1.5;

        const statsOrder = ['magnet', 'speed', 'jetpack', 'charge', 'pull', 'cable'];
        
        statsOrder.forEach((key, index) => {
            this._drawStatBar(ctx, startX, currentY, index + 1, this.player.stats[key], key);
            currentY += this.barHeight + this.spacing;
        });

        if (this.opacity > 0.8) {
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "right";
            ctx.fillText("[U] Menu", startX + this.width, currentY + 5);
        }

        ctx.restore();
    }

    _drawStatBar(ctx, x, y, digit, stat, key) {
        ctx.fillStyle = this.colors.barBg;
        ctx.fillRect(x, y, this.width, this.barHeight);

        const segmentWidth = (this.width - 2) / stat.max; 
        
        ctx.fillStyle = stat.color;
        for (let i = 0; i < stat.lvl; i++) {
            ctx.fillRect(x + 1 + (i * segmentWidth), y + 1, segmentWidth - 1, this.barHeight - 2);
        }

        ctx.fillStyle = this.colors.text;
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.shadowColor = this.colors.textShadow;
        ctx.shadowBlur = 2;
        ctx.fillText(`[${digit}] ${stat.name.toUpperCase()}`, x + 5, y + this.barHeight/2 + 1);
        ctx.shadowBlur = 0;

        const canAfford = this.player.money >= stat.cost;
        const isMaxed = stat.lvl >= stat.max;

        if (!isMaxed) {
            ctx.textAlign = "right";
            ctx.font = "bold 10px monospace";
            ctx.fillStyle = canAfford ? "#fff" : "#7f8c8d";
            ctx.fillText(`$${stat.cost}`, x + this.width - 5, y + this.barHeight/2 + 1);

            this.buttons.push({
                x: x, y: y, w: this.width, h: this.barHeight,
                action: () => this.player.upgradeStat(key)
            });
        } else {
            ctx.textAlign = "right";
            ctx.fillStyle = "#e74c3c";
            ctx.fillText("MAX", x + this.width - 5, y + this.barHeight/2 + 1);
        }
    }

    _drawConsumable(ctx, x, y, digit, name, cost, color, action) {
        ctx.fillStyle = this.colors.barBg;
        ctx.fillRect(x, y, this.width, this.barHeight);
        
        ctx.fillStyle = color;
        ctx.fillRect(x, y, 3, this.barHeight);

        ctx.fillStyle = this.colors.text;
        ctx.font = "bold 10px sans-serif";
        ctx.textAlign = "left";
        ctx.textBaseline = "middle";
        ctx.fillText(`[${digit}] ${name}`, x + 10, y + this.barHeight/2 + 1);

        const canAfford = this.player.money >= cost;
        ctx.textAlign = "right";
        ctx.font = "bold 10px monospace";
        ctx.fillStyle = canAfford ? "#fff" : "#7f8c8d";
        ctx.fillText(`$${cost}`, x + this.width - 5, y + this.barHeight/2 + 1);

        if (canAfford) {
            this.buttons.push({
                x: x, y: y, w: this.width, h: this.barHeight,
                action: action
            });
        }
    }
}