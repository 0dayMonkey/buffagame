import { InputHandler } from './InputHandler.js';
import { Player } from '../entities/Player.js';
import { Zombie } from '../entities/Zombie.js';
import { Projectile } from '../entities/Projectile.js';
import { Spot } from '../entities/Spot.js';
import { Brain } from '../entities/Brain.js';
import { FloatingText } from '../entities/FloatingText.js';
import { Terrain } from '../entities/Terrain.js';
import { Obstacle } from '../entities/Obstacle.js';
import { LuckyBlock } from '../entities/LuckyBlock.js';
import { Coin } from '../entities/Coin.js';
import { UpgradeManager } from './UpgradeManager.js';
import { ParticleSystem } from './ParticleSystem.js';
import { Background } from './Background.js';

export class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.ctx.imageSmoothingEnabled = false; 
        
        this.input = new InputHandler(this.canvas);
        
        this.entities = [];
        this.projectiles = [];
        this.spots = [];
        this.brains = [];
        this.texts = [];
        this.obstacles = [];
        this.luckyBlocks = [];
        this.coins = [];
        
        this.lastTime = 0;
        this.ratio = 2.35;
        this.cameraX = 0;
        this.cameraY = 0;
        this.lastSpotX = 0; 
        this.gameOver = false;
        
        this.shakeTimer = 0;
        this.shakeIntensity = 0;
        
        this.initCanvas();
        this.terrain = new Terrain(this.canvas.height - 100);
        this.player = new Player(200, this.terrain.getHeight(200) - 50); 
        this.entities.push(this.player);
        
        this.upgradeManager = new UpgradeManager(this);
        this.particleSystem = new ParticleSystem();
        this.background = new Background(this.canvas.width, this.canvas.height);

        this.generateMapSegment(0);
        window.addEventListener('resize', () => this.handleResize());

        this._createDevMenu();
        window.addEventListener('keydown', (e) => {
            if (e.code === 'KeyP') this._toggleDevMenu();
        });
    }

    _createDevMenu() {
        const div = document.createElement('div');
        div.id = 'devMenu';
        div.style.cssText = `
            position: fixed; top: 10px; right: 10px; background: rgba(0,0,0,0.8); 
            color: #0f0; font-family: monospace; padding: 15px; border: 2px solid #0f0;
            display: none; z-index: 1000; min-width: 200px;
        `;
        div.innerHTML = `
            <h3 style="margin: 0 0 10px 0; text-align:center; border-bottom: 1px solid #0f0">DEV CONSOLE</h3>
            <button id="btnAddMoney" style="width:100%; color: black; font-weight:bold">+ $1000</button><br><br>
            <label><input type="checkbox" id="devGod"> God Mode</label>
        `;
        document.body.appendChild(div);

        document.getElementById('btnAddMoney').addEventListener('click', () => {
            this.player.money += 1000;
            this.addFloatingText("+$1000 (DEV)", this.player.x, this.player.y - 50, "#0f0");
        });
        document.getElementById('devGod').addEventListener('change', (e) => {
            this.player.invincibility = e.target.checked ? 9999999 : 0;
        });
    }

    _toggleDevMenu() {
        const el = document.getElementById('devMenu');
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
    }

    screenShake(amount) {
        this.shakeTimer = 15;
        this.shakeIntensity = amount;
    }

    triggerGoldenBrain() {
        this.entities.forEach(e => {
            if (e instanceof Zombie && e.active) {
                e.forceLure(this.player, this.terrain);
            }
        });
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        const currentRatio = this.canvas.width / this.canvas.height;
        if (currentRatio > this.ratio) this.canvas.width = this.canvas.height * this.ratio;
        else this.canvas.height = this.canvas.width / this.ratio;
        if (this.terrain) this.terrain.baseHeight = this.canvas.height - 100;
        
        if (this.background) {
            this.background.width = this.canvas.width;
            this.background.height = this.canvas.height;
        }
        
        this.ctx.imageSmoothingEnabled = false; 
    }

    handleResize() {
        this.initCanvas();
    }

    generateMapSegment(startX) {
        let currentX = Math.max(startX, this.lastSpotX + 400); 
        
        for(let i = 0; i < 4; i++) {
            if (Math.random() < 0.25) {
                this.terrain.addHole(currentX, 240);
                currentX += 350;
            }

            currentX += 200 + Math.random() * 250;

            if (Math.random() < 0.6) {
                const groundY = this.terrain.getHeight(currentX);
                if (groundY <= this.terrain.baseHeight + 100) {
                    this.spots.push(new Spot(currentX, groundY));
                    this.entities.push(new Zombie(currentX, groundY - 50));
                }
            }

            if (currentX > 2000 && Math.random() < 0.05) { 
                const blockX = currentX - 100;
                const groundY = this.terrain.getHeight(blockX);
                if (groundY <= this.terrain.baseHeight + 100) {
                    this.luckyBlocks.push(new LuckyBlock(blockX, groundY - 120, blockX));
                }
            }

            currentX += 200 + Math.random() * 250;

            if (Math.random() < 0.4) {
                const types = ['STUMP', 'ROCK', 'LOG'];
                const type = types[Math.floor(Math.random() * types.length)];
                const groundY = this.terrain.getHeight(currentX);
                if (groundY <= this.terrain.baseHeight + 100) {
                    this.obstacles.push(new Obstacle(currentX, groundY, type));
                }
            }
            
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
        if (this.gameOver) return;

        this.projectiles.forEach(p => {
            if (!p.active || p.connectedZombie || p.isStuck) return;
            this.entities.forEach(z => {
                if (z instanceof Zombie) {
                    const isCapturable = z.state !== Zombie.STATES.HIDDEN && 
                                         z.state !== Zombie.STATES.PEEKING && 
                                         z.state !== Zombie.STATES.CAPTURED &&
                                         z.state !== Zombie.STATES.EXTRACTING;
                                         
                    if (isCapturable) {
                        const dx = p.x - z.x;
                        const dy = p.y - z.y;
                        if (Math.sqrt(dx * dx + dy * dy) < 40) {
                            p.connectedZombie = z;
                            z.state = Zombie.STATES.CAPTURED;
                        }
                    }
                }
            });
        });

        this.entities.forEach(z => {
            if (z instanceof Zombie) {
                const distToPlayer = Math.sqrt((this.player.x - z.x)**2 + (this.player.y - z.y)**2);
                
                if (distToPlayer < 40 && z.state !== 'CAPTURED' && z.state !== 'HIDDEN' && z.state !== 'PEEKING' && z.state !== 'EXTRACTING' && this.player.invincibility === 0) {
                    this.player.lives--;
                    this.player.invincibility = 60;
                    this.screenShake(10);
                    this.addFloatingText("-1 ❤️", this.player.x, this.player.y - 60, "#e74c3c");
                    this.player.vx = (this.player.x - z.x) * 0.8;
                    this.player.vy = -5;
                }
                
                if (z.y > this.terrain.baseHeight + 200 && z.state !== 'EXTRACTING') {
                    z.active = false;
                    this.player.money -= 10;
                    this.addFloatingText("-$10", z.x, z.y - 100, "#e74c3c");
                }
                
                if (z.hasEscaped) {
                    z.active = false;
                    this.player.money -= 10;
                    this.addFloatingText("-$10", this.player.x, this.player.y - 50, "#e74c3c");
                }
            }
        });

        const magnetRadius = this.player.getMagnetRadius();
        this.coins.forEach(c => {
            if (!c.active) return;
            
            const dist = Math.sqrt((this.player.x - c.x)**2 + (this.player.y - c.y)**2);
            
            if (dist < magnetRadius) {
                const angle = Math.atan2(this.player.y - c.y, this.player.x - c.x);
                c.vx += Math.cos(angle) * 1.5;
                c.vy += Math.sin(angle) * 1.5;
            }

            if (dist < 40) {
                c.active = false;
                c.onCollect(this.particleSystem);
                this.player.money += c.value;
                this.addFloatingText(`+$${c.value}`, c.x, c.y - 20, "#f1c40f");
            } else if (c.y > this.terrain.baseHeight + 200) {
                c.active = false;
                this.player.money += c.value;
                this.addFloatingText(`+$${c.value}`, c.x, this.terrain.baseHeight, "#f1c40f");
            }
        });

        const killZoneY = this.terrain.baseHeight + 250;
        if (this.player.y > killZoneY) {
            this.player.lives--;
            if (this.player.lives > 0) {
                this.screenShake(15);
                this.addFloatingText("-1 ❤️", this.player.x, this.player.y - 100, "#e74c3c");
                const safeX = Math.max(0, this.cameraX + 100);
                this.player.x = safeX;
                this.player.y = this.terrain.getHeight(safeX) - 100;
                this.player.vx = 0;
                this.player.vy = 0;
                this.player.invincibility = 60;
            }
        }

        if (this.player.lives <= 0 && !this.gameOver) {
            this.gameOver = true;
            setTimeout(() => location.reload(), 2000);
        }

        this.obstacles.forEach(o => {
            const overlapX = (this.player.width + o.width) / 2 - Math.abs(this.player.x - o.x);
            const overlapY = (this.player.height + o.height) / 2 - Math.abs(this.player.y - o.y);
            
            if (overlapX > 0 && overlapY > 0) {
                const isFallingOrLanded = this.player.vy >= 0;
                const isAbove = this.player.y < o.y;

                if (overlapX < overlapY && isFallingOrLanded) {
                    this.player.x += this.player.x < o.x ? -overlapX : overlapX;
                    this.player.vx = 0;
                } 
                else if (isFallingOrLanded && isAbove) {
                    this.player.y -= overlapY;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                } 
                else {
                    this.player.x += this.player.x < o.x ? -overlapX : overlapX;
                    this.player.vx = 0;
                }
            }
        });
    }

    _cleanArrays(deleteThreshold) {
        const arraysToClean = [this.spots, this.obstacles, this.entities, this.projectiles, this.brains, this.texts, this.luckyBlocks, this.coins];
        
        arraysToClean.forEach(arr => {
            for (let i = arr.length - 1; i >= 0; i--) {
                const item = arr[i];
                if (item.active === false || (item.x !== undefined && item.x <= deleteThreshold)) {
                    arr.splice(i, 1);
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
        if (this.gameOver) return;
        
        this.upgradeManager.update(this.input);
        this.particleSystem.update();
        if (this.background) this.background.update(this.cameraX);

        if (this.shakeTimer > 0) {
            this.shakeTimer--;
        }

        const targetX = this.player.x - this.canvas.width * 0.3;
        if (targetX > this.cameraX) {
            this.cameraX += (targetX - this.cameraX) * 0.1;
        }

        const rawGroundY = this.terrain.getHeight(this.player.x);
        let safeCameraGround = rawGroundY;
        
        if (safeCameraGround > this.terrain.baseHeight + 50) {
            safeCameraGround = this.terrain.baseHeight;
        }

        const targetY = safeCameraGround - this.canvas.height * 0.8;
        this.cameraY += (targetY - this.cameraY) * 0.1;

        if (this.cameraX + this.canvas.width > this.lastSpotX - 400) {
            this.generateMapSegment(this.lastSpotX);
        }
        
        const deleteThreshold = this.cameraX - 1000;
        
        this._cleanArrays(deleteThreshold);

        this.entities.forEach(e => {
            if (e instanceof Player) e.update(dt, this.input, this.canvas, this, this.terrain);
            else if (e instanceof Zombie) e.update(dt, this.player, this.canvas, this.brains, this, this.terrain);
        });
        
        this.projectiles.forEach(p => p.update(dt, this.canvas, this.terrain, this.obstacles, this.particleSystem));
        this.brains.forEach(b => b.update(dt, this.canvas, this.terrain, this.obstacles));
        this.texts.forEach(t => t.update(dt));
        this.coins.forEach(c => c.update(dt, this.terrain, this.obstacles));
        
        this.luckyBlocks.forEach(block => {
            block.update(dt);
            if (!block.isOpened) {
                const dist = Math.sqrt((this.player.x - block.x)**2 + (this.player.y - block.y)**2);
                if (dist < 80 && this.input.isPressed('KeyF')) {
                    if (this.player.money >= block.price) {
                        this.player.money -= block.price;
                        this.player.lives++; 
                        block.isOpened = true;
                        this.addFloatingText(`-$${block.price}`, block.x, block.y - 50, "#e74c3c");
                        this.addFloatingText("+1 ❤️", block.x + 20, block.y - 80, "#e91e63");
                    } else {
                        if (Math.random() < 0.1) { 
                            this.addFloatingText("Pas assez d'argent !", block.x, block.y - 50, "white");
                        }
                    }
                }
            }
        });

        this.checkCollisions();
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Background avant tout
        if (this.background) this.background.draw(this.ctx);

        this.ctx.save();
        
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        if (this.shakeTimer > 0) {
            shakeOffsetX = (Math.random() - 0.5) * this.shakeIntensity;
            shakeOffsetY = (Math.random() - 0.5) * this.shakeIntensity;
        }

        this.ctx.translate(-this.cameraX + shakeOffsetX, -this.cameraY + shakeOffsetY);
        this.terrain.draw(this.ctx, this.cameraX, this.canvas.width, this.canvas.height + 2000);
        this.spots.forEach(s => s.draw(this.ctx));
        this.obstacles.forEach(o => o.draw(this.ctx));
        this.luckyBlocks.forEach(b => b.draw(this.ctx)); 
        this.brains.forEach(b => b.draw(this.ctx));
        this.coins.forEach(c => c.draw(this.ctx));
        
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
        this.particleSystem.draw(this.ctx);
        this.texts.forEach(t => t.draw(this.ctx));
        this.ctx.restore(); 
        
        this._renderUI();
        if (this.gameOver) this._renderGameOver();
    }

    _renderUI() {
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 24px Arial";
        this.ctx.fillText(`$${this.player.money}`, 30, 50);
        let hearts = "";
        for(let i = 0; i < this.player.lives; i++) hearts += "❤️";
        this.ctx.fillText(hearts, 30, 85);
        this.ctx.font = "16px Arial";
        this.ctx.fillStyle = "#bdc3c7";
        this.ctx.fillText("DISTANCE: " + Math.floor(this.player.x / 100) + "m", 30, 115);
        
        this.upgradeManager.draw(this.ctx);

        this.ctx.font = "10px monospace";
        this.ctx.fillStyle = "rgba(255,255,255,0.3)";
        this.ctx.fillText("Dev: [P]", this.canvas.width - 50, 20);
    }

    _renderGameOver() {
        this.ctx.fillStyle = "rgba(0,0,0,0.85)";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = "white";
        this.ctx.font = "bold 60px Arial";
        this.ctx.textAlign = "center";
        this.ctx.fillText("GAME OVER", this.canvas.width / 2, this.canvas.height / 2);
    }
}