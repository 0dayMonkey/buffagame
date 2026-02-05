import { InputHandler } from './InputHandler.js';
import { Player } from '../entities/Player.js';
import { Zombie } from '../entities/Zombie.js';
import { Projectile } from '../entities/Projectile.js';
import { Spot } from '../entities/Spot.js';
import { Brain } from '../entities/Brain.js';
import { FloatingText } from '../entities/FloatingText.js';
import { Terrain } from '../entities/Terrain.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.input = new InputHandler(this.canvas);
        
        this.entities = [];
        this.projectiles = [];
        this.spots = [];
        this.brains = [];
        this.texts = [];
        
        this.lastTime = 0;
        this.ratio = 2.35;
        
        this.cameraX = 0;
        this.lastSpotX = 0; 
        
        this.initCanvas();
        this.terrain = new Terrain(this.canvas.height - 100);
        this.player = new Player(200, this.terrain.getHeight(200) - 50); 
        this.entities.push(this.player);
        
        this.generateMapSegment(0);

        window.addEventListener('resize', () => this.handleResize());
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const currentRatio = this.canvas.width / this.canvas.height;
        if (currentRatio > this.ratio) this.canvas.width = this.canvas.height * this.ratio;
        else this.canvas.height = this.canvas.width / this.ratio;
        if (this.terrain) this.terrain.baseHeight = this.canvas.height - 100;
    }

    handleResize() {
        this.initCanvas();
    }

    generateMapSegment(startX) {
        let currentX = Math.max(startX, this.lastSpotX + 300); 
        
        for(let i = 0; i < 3; i++) {
            const distance = 400 + Math.random() * 400;
            currentX += distance;
            
            const groundY = this.terrain.getHeight(currentX);
            const spot = new Spot(currentX, groundY);
            this.spots.push(spot);
            
            this.entities.push(new Zombie(currentX, groundY - 50));
            
            this.lastSpotX = currentX;
        }
    }

    start() {
        requestAnimationFrame((t) => this.loop(t));
    }

    addFloatingText(text, x, y, color) {
        this.texts.push(new FloatingText(x, y, text, color));
    }

    checkCollisions() {
        this.projectiles.forEach(p => {
            if (!p.active || p.connectedZombie || p.isStuck) return;
            this.entities.forEach(z => {
                if (z instanceof Zombie && z.state !== 'HIDDEN' && z.state !== 'CAPTURED') {
                    const dx = p.x - z.x;
                    const dy = p.y - z.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 40) {
                        p.connectedZombie = z;
                        z.state = 'CAPTURED';
                    }
                }
            });
        });

        this.entities.forEach(z => {
            if (z instanceof Zombie) {
                if (z.state === 'CAPTURED') {
                    const dist = Math.sqrt((z.x - this.player.x)**2 + (z.y - this.player.y)**2);
                    if (dist < 50) {
                        z.active = false;
                        this.player.money += 50;
                        this.addFloatingText("+$50", this.player.x, this.player.y - 50, "#2ecc71");
                        this.projectiles.forEach(p => { 
                            if (p.connectedZombie === z) p.active = false; 
                        });
                    }
                } else if (z.hasEscaped) {
                    z.active = false;
                    this.player.money -= 10;
                    this.addFloatingText("-$10", this.player.x, this.player.y - 50, "#e74c3c");
                }
            }
        });
    }

    loop(timestamp) {
        if (!this.lastTime) this.lastTime = timestamp;
        let dt = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (dt > 100) dt = 16;

        this.update(dt);
        this.render();
        requestAnimationFrame((t) => this.loop(t));
    }

    update(dt) {
        const targetX = this.player.x - this.canvas.width * 0.3;
        if (targetX > this.cameraX) {
            this.cameraX += (targetX - this.cameraX) * 0.1;
        }

        if (this.cameraX + this.canvas.width > this.lastSpotX - 200) {
            this.generateMapSegment(this.lastSpotX);
        }

        const deleteThreshold = this.cameraX - 1000;
        this.spots = this.spots.filter(s => s.x > deleteThreshold);

        this.entities = this.entities.filter(e => e.active !== false);
        this.projectiles = this.projectiles.filter(p => p.active !== false);
        this.brains = this.brains.filter(b => b.active !== false);
        this.texts = this.texts.filter(t => t.active !== false);

        this.entities.forEach(e => {
            if (e instanceof Player) e.update(dt, this.input, this.canvas, this, this.terrain);
            else if (e instanceof Zombie) e.update(dt, this.player, this.canvas, this.brains, this, this.terrain);
        });
        this.projectiles.forEach(p => p.update(dt, this.canvas, this.terrain));
        this.brains.forEach(b => b.update(dt, this.canvas, this.terrain));
        this.texts.forEach(t => t.update(dt));
        
        this.checkCollisions();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(-this.cameraX, 0);

        this.terrain.draw(this.ctx, this.cameraX, this.canvas.width, this.canvas.height);

        this.spots.forEach(s => s.draw(this.ctx));
        
        this.brains.forEach(b => b.draw(this.ctx));
        
        this.projectiles.forEach(p => {
            this.ctx.beginPath();
            this.ctx.strokeStyle = "#333";
            this.ctx.lineWidth = 2;
            
            const gunLen = 45;
            const startX = this.player.x + Math.cos(this.player.armAngle) * gunLen;
            const startY = (this.player.y - 10) + Math.sin(this.player.armAngle) * gunLen;
            const endX = p.x;
            const endY = p.y;
            
            this.ctx.moveTo(startX, startY);
            this.ctx.lineTo(endX, endY);
            this.ctx.stroke();
            
            p.draw(this.ctx);
        });
        
        this.entities.forEach(e => e.draw(this.ctx));
        this.texts.forEach(t => t.draw(this.ctx));

        this.ctx.restore(); 

        this._renderUI();
    }

    _renderUI() {
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 24px Arial";
        this.ctx.fillText(`$${this.player.money}`, 30, 50);
        
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "#bdc3c7";
        this.ctx.fillText("APPUYEZ SUR [E] POUR POSER UN CERVEAU | DISTANCE: " + Math.floor(this.player.x / 100) + "m", 30, 80);
    }
}