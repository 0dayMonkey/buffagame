import { InputHandler } from './InputHandler.js';
import { Player } from '../entities/Player.js';
import { Zombie } from '../entities/Zombie.js';
import { Projectile } from '../entities/Projectile.js';
import { Spot } from '../entities/Spot.js';
import { Brain } from '../entities/Brain.js';
import { FloatingText } from '../entities/FloatingText.js';
import { Terrain } from '../entities/Terrain.js';
import { Obstacle } from '../entities/Obstacle.js';

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
        this.obstacles = [];
        
        this.lastTime = 0;
        this.ratio = 2.35;
        this.cameraX = 0;
        this.lastSpotX = 0; 
        this.gameOver = false;
        
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
                if (z instanceof Zombie && !['HIDDEN', 'CAPTURED'].includes(z.state)) {
                    const dx = p.x - z.x;
                    const dy = p.y - z.y;
                    if (Math.sqrt(dx * dx + dy * dy) < 40) {
                        p.connectedZombie = z;
                        z.state = 'CAPTURED';
                        this.entities.forEach(other => {
                            if (other instanceof Zombie && other !== z && Math.abs(other.x - z.x) < 450) other.alert();
                        });
                    }
                }
            });
        });

        this.entities.forEach(z => {
            if (z instanceof Zombie) {
                const distToPlayer = Math.sqrt((this.player.x - z.x)**2 + (this.player.y - z.y)**2);
                const dangerousStates = ['EATING', 'FLEEING', 'ATTACKING'];
                if (distToPlayer < 40 && dangerousStates.includes(z.state) && this.player.invincibility === 0) {
                    this.player.lives--;
                    this.player.invincibility = 60;
                    this.addFloatingText("-1 ❤️", this.player.x, this.player.y - 60, "#e74c3c");
                    this.player.vx = (this.player.x - z.x) * 0.8;
                    this.player.vy = -5;
                }
                if (z.isFallingInHole && z.y > this.terrain.baseHeight + 150) {
                    z.active = false;
                    this.player.money -= 10;
                    this.addFloatingText("-$10", z.x, z.y - 100, "#e74c3c");
                }
                if (z.state === 'CAPTURED') {
                    const dist = Math.sqrt((z.x - this.player.x)**2 + (z.y - this.player.y)**2);
                    if (dist < 50) {
                        z.active = false;
                        this.player.money += 50;
                        this.addFloatingText("+$50", this.player.x, this.player.y - 50, "#2ecc71");
                        this.projectiles.forEach(p => { if (p.connectedZombie === z) p.active = false; });
                    }
                } else if (z.hasEscaped) {
                    z.active = false;
                    this.player.money -= 10;
                    this.addFloatingText("-$10", this.player.x, this.player.y - 50, "#e74c3c");
                }
            }
        });

        if (this.player.isFallingInHole && this.player.y > this.terrain.baseHeight + 150) {
            this.player.lives--;
            if (this.player.lives > 0) {
                this.addFloatingText("-1 ❤️", this.player.x, this.player.y - 100, "#e74c3c");
                const safeX = this.cameraX + 100;
                this.player.x = safeX;
                this.player.y = this.terrain.getHeight(safeX) - 100;
                this.player.vx = 0;
                this.player.vy = 0;
                this.player.invincibility = 40;
            }
        }

        if (this.player.lives <= 0 && !this.gameOver) {
            this.gameOver = true;
            setTimeout(() => location.reload(), 2000);
        }

        this.obstacles.forEach(o => {
            const collisionTargets = [this.player, ...this.entities.filter(e => e instanceof Zombie && !['HIDDEN', 'PEEKING', 'CAPTURED'].includes(e.state))];
            collisionTargets.forEach(target => {
                const overlapX = (target.width + o.width) / 2 - Math.abs(target.x - o.x);
                const overlapY = (target.height + o.height) / 2 - Math.abs(target.y - o.y);
                if (overlapX > 0 && overlapY > 0) {
                    if (overlapX < overlapY) {
                        target.x += target.x < o.x ? -overlapX : overlapX;
                        target.vx = 0;
                        if (target instanceof Zombie && target.isGrounded) target.vy = -8.5;
                    } else {
                        target.y += target.y < o.y ? -overlapY : overlapY;
                        if (target.y < o.y) {
                            target.vy = 0;
                            target.isGrounded = true;
                        } else {
                            target.vy = 0;
                        }
                    }
                }
            });
        });

        const checkDist = 18;
        const leftWallY = this.terrain.getHeight(this.player.x - checkDist);
        const rightWallY = this.terrain.getHeight(this.player.x + checkDist);
        const pFeetY = this.player.y + this.player.height / 2;
        if (!this.player.isFallingInHole) {
            if (leftWallY < pFeetY - 15) { this.player.x += 2; this.player.vx = 0; }
            if (rightWallY < pFeetY - 15) { this.player.x -= 2; this.player.vx = 0; }
        }

        this.terrain.holes.forEach(hole => {
            if (this.player.y > this.terrain.baseHeight + 10) {
                const playerLeft = this.player.x - this.player.width / 2;
                const playerRight = this.player.x + this.player.width / 2;
                if (this.player.x < hole.x && playerRight > hole.x) {
                    this.player.x = hole.x - this.player.width / 2;
                    this.player.vx = 0;
                } else if (this.player.x > hole.x + hole.width && playerLeft < hole.x + hole.width) {
                    this.player.x = hole.x + hole.width + this.player.width / 2;
                    this.player.vx = 0;
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
        const targetX = this.player.x - this.canvas.width * 0.3;
        if (targetX > this.cameraX) this.cameraX += (targetX - this.cameraX) * 0.1;
        if (this.cameraX + this.canvas.width > this.lastSpotX - 400) this.generateMapSegment(this.lastSpotX);
        const deleteThreshold = this.cameraX - 1000;
        this.spots = this.spots.filter(s => s.x > deleteThreshold);
        this.obstacles = this.obstacles.filter(o => o.x > deleteThreshold);
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
        this.obstacles.forEach(o => o.draw(this.ctx));
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