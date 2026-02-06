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

        // Collision Projectiles - Zombies
        this.projectiles.forEach(p => {
            if (!p.active || p.connectedZombie || p.isStuck) return;
            this.entities.forEach(z => {
                if (z instanceof Zombie) {
                    // Vérification que le zombie est vulnérable
                    const isCapturable = z.state !== Zombie.STATES.HIDDEN && 
                                         z.state !== Zombie.STATES.PEEKING && 
                                         z.state !== Zombie.STATES.CAPTURED;
                                         
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

        // Collision Joueur - Zombies
        this.entities.forEach(z => {
            if (z instanceof Zombie) {
                const distToPlayer = Math.sqrt((this.player.x - z.x)**2 + (this.player.y - z.y)**2);
                
                // Dégâts au joueur (seulement si le zombie est sorti)
                if (distToPlayer < 40 && z.state !== 'CAPTURED' && z.state !== 'HIDDEN' && z.state !== 'PEEKING' && this.player.invincibility === 0) {
                    this.player.lives--;
                    this.player.invincibility = 60;
                    this.addFloatingText("-1 ❤️", this.player.x, this.player.y - 60, "#e74c3c");
                    this.player.vx = (this.player.x - z.x) * 0.8;
                    this.player.vy = -5;
                }
                
                // Zombie tombe dans un trou (Kill Z pour Zombie)
                if (z.y > this.terrain.baseHeight + 200) {
                    z.active = false;
                    this.player.money -= 10;
                    this.addFloatingText("-$10", z.x, z.y - 100, "#e74c3c");
                }
                
                // Zombie capturé ou enfui
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

        // --- CORRECTION BUG : Mort du joueur (Kill Z) ---
        // Avant, on vérifiait "isFallingInHole" (X). Maintenant, on vérifie la profondeur (Y).
        // Si le joueur est plus bas que le sol + 250px, il meurt, qu'il soit dans un trou ou buggé sous la map.
        const killZoneY = this.terrain.baseHeight + 250;
        
        if (this.player.y > killZoneY) {
            this.player.lives--;
            if (this.player.lives > 0) {
                this.addFloatingText("-1 ❤️", this.player.x, this.player.y - 100, "#e74c3c");
                
                // Respawn en lieu sûr (en arrière)
                const safeX = Math.max(0, this.cameraX + 100);
                this.player.x = safeX;
                // On le place bien au-dessus du sol pour éviter de re-tomber tout de suite
                this.player.y = this.terrain.getHeight(safeX) - 100;
                this.player.vx = 0;
                this.player.vy = 0;
                this.player.invincibility = 60; // 1 seconde d'invincibilité
            }
        }

        // Game Over
        if (this.player.lives <= 0 && !this.gameOver) {
            this.gameOver = true;
            setTimeout(() => location.reload(), 2000);
        }

        // Collision Joueur - Obstacles (avec correctif Anti-TP et Coin)
        this.obstacles.forEach(o => {
            const overlapX = (this.player.width + o.width) / 2 - Math.abs(this.player.x - o.x);
            const overlapY = (this.player.height + o.height) / 2 - Math.abs(this.player.y - o.y);
            
            if (overlapX > 0 && overlapY > 0) {
                const isFallingOrLanded = this.player.vy >= 0;
                const isAbove = this.player.y < o.y;

                if (overlapX < overlapY && isFallingOrLanded) {
                    // Collision latérale
                    this.player.x += this.player.x < o.x ? -overlapX : overlapX;
                    this.player.vx = 0;
                } 
                else if (isFallingOrLanded && isAbove) {
                    // Atterrissage sur l'obstacle
                    this.player.y -= overlapY;
                    this.player.vy = 0;
                    this.player.isGrounded = true;
                } 
                else {
                    // Collision forcée latérale (cas du saut contre un coin)
                    // Empêche le TP vers le haut quand on saute et qu'on touche le coin bas de l'obstacle
                    this.player.x += this.player.x < o.x ? -overlapX : overlapX;
                    this.player.vx = 0;
                }
            }
        });
    }

    _cleanArrays(deleteThreshold) {
        const arraysToClean = [this.spots, this.obstacles, this.entities, this.projectiles, this.brains, this.texts];
        
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
        const targetX = this.player.x - this.canvas.width * 0.3;
        if (targetX > this.cameraX) {
            this.cameraX += (targetX - this.cameraX) * 0.1;
        }
        if (this.cameraX + this.canvas.width > this.lastSpotX - 400) {
            this.generateMapSegment(this.lastSpotX);
        }
        
        const deleteThreshold = this.cameraX - 1000;
        
        this._cleanArrays(deleteThreshold);

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