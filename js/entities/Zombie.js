import { Character } from './Character.js';
import { Coin } from './Coin.js';

export class Zombie extends Character {
    static STATES = {
        HIDDEN: 'HIDDEN',
        PEEKING: 'PEEKING',
        EMERGING: 'EMERGING',
        EATING: 'EATING',
        FLEEING: 'FLEEING',
        ATTACKING: 'ATTACKING',
        CAPTURED: 'CAPTURED',
        EXTRACTING: 'EXTRACTING'
    };

    static PERSONALITIES = {
        COWARD: 'COWARD',
        AGGRESSIVE: 'AGGRESSIVE',
        CRAZY: 'CRAZY'
    };

    constructor(x, y) {
        super(x, y, 26, 40);
        this.state = Zombie.STATES.HIDDEN;
        this.active = true;
        this.safetyDistance = 350;
        
        const rand = Math.random();
        if (rand < 0.5) this.personality = Zombie.PERSONALITIES.COWARD;
        else if (rand < 0.8) this.personality = Zombie.PERSONALITIES.AGGRESSIVE;
        else this.personality = Zombie.PERSONALITIES.CRAZY;

        this.speedMultiplier = 1.1 + Math.random() * 0.35;
        this.jumpForce = -8.5 - Math.random() * 2; 
        this.clumsiness = Math.random() * 0.10;
        
        this.stealthTimer = 0;
        this.eatingTimer = 0;
        this.offScreenTimer = 0;
        this.stunTimer = 0; 

        this.pullSpeed = 13;
        this.targetBrain = null;
        this.wobble = 0;
        this.hasEscaped = false;
        this.scanDistance = 100;
        this.coinsSpawned = false;
        this.extractTimer = 0;
    }

    update(dt, player, canvas, brains, game, terrain) {
        const distToPlayer = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
        const groundY = terrain.getHeight(this.x);

        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx = 0;
            this.applyPhysics(terrain);
            this.x += (Math.random() - 0.5) * 2;
            return;
        }

        let intendedDirection = 0;

        switch(this.state) {
            case Zombie.STATES.HIDDEN:
                this.y = groundY + 50;
                this.vx = 0;
                this.vy = 0;
                this.angle = 0;
                
                const nearBrain = brains.find(b => Math.abs(b.x - this.x) < 150 && b.active);
                const detectionDist = this.personality === Zombie.PERSONALITIES.AGGRESSIVE ? this.safetyDistance + 100 : this.safetyDistance;

                if (nearBrain && distToPlayer > detectionDist) {
                    this.state = Zombie.STATES.PEEKING;
                    this.targetBrain = nearBrain;
                }
                break;

            case Zombie.STATES.PEEKING:
                this.y = groundY - 8;
                this.vx = 0;
                this.vy = 0;
                this.angle = terrain.getSlopeAngle(this.x);

                if (distToPlayer < this.safetyDistance) {
                    this.state = Zombie.STATES.HIDDEN;
                    this.stealthTimer = 0;
                }
                
                let peekTime = 120;
                if (this.personality === Zombie.PERSONALITIES.CRAZY) peekTime = 60; 

                this.stealthTimer++;
                if (this.stealthTimer > peekTime) {
                    this.state = Zombie.STATES.EMERGING;
                    this.stealthTimer = 0;
                }
                break;

            case Zombie.STATES.EMERGING:
                this.y -= 1.2;
                this.vx = 0;
                this.vy = 0;
                this.wobble += 0.2;
                this.angle = terrain.getSlopeAngle(this.x) + Math.sin(this.wobble) * 0.1;
                
                if (this.y <= groundY - this.height / 2) {
                    this.state = Zombie.STATES.EATING;
                    this.eatingTimer = 0;
                }
                if (distToPlayer < this.safetyDistance - 50) {
                    this.state = Zombie.STATES.HIDDEN;
                }
                break;

            case Zombie.STATES.EATING:
                if (distToPlayer < 250) {
                    if (this.personality === Zombie.PERSONALITIES.AGGRESSIVE) {
                        this.state = Zombie.STATES.ATTACKING;
                    } else {
                        this.state = Zombie.STATES.FLEEING;
                    }
                }

                if (this.targetBrain && this.targetBrain.active) {
                    if (Math.abs(this.x - this.targetBrain.x) > 10) {
                        const dir = Math.sign(this.targetBrain.x - this.x);
                        this.vx = dir * 1.5 * this.speedMultiplier;
                        intendedDirection = dir;
                    } else {
                        this.vx = 0;
                        this.eatingTimer++;
                        this.wobble += 0.4;
                        this.angle = Math.sin(this.wobble) * 0.05;
                        if (this.eatingTimer > 100) {
                            this.targetBrain.active = false;
                            this.state = Zombie.STATES.FLEEING;
                        }
                    }
                } else {
                    this.state = Zombie.STATES.FLEEING;
                }
                
                this.detectObstacles(game.obstacles, intendedDirection);
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles);
                this.applyPhysics(terrain);
                break;

            case Zombie.STATES.ATTACKING:
                const attackDir = Math.sign(player.x - this.x);
                this.vx = attackDir * 4.0 * this.speedMultiplier;
                intendedDirection = attackDir;
                
                if (this.personality === Zombie.PERSONALITIES.CRAZY && this.isGrounded && Math.random() < 0.05) {
                    this.vy = this.jumpForce;
                    this.isGrounded = false;
                }

                this.detectObstacles(game.obstacles, intendedDirection);
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles);
                this.applyPhysics(terrain);

                if (distToPlayer > 600 || player.lives <= 0) {
                    this.state = Zombie.STATES.FLEEING;
                }
                break;

            case Zombie.STATES.FLEEING:
                const fleeDir = Math.sign(this.x - player.x);
                let speed = 6.0 * this.speedMultiplier; 
                if (this.personality === Zombie.PERSONALITIES.COWARD) speed *= 1.2; 

                this.vx = fleeDir * speed;
                intendedDirection = fleeDir;
                
                if (this.personality === Zombie.PERSONALITIES.CRAZY && this.isGrounded) {
                    if (Math.random() < 0.03) { 
                        this.vy = this.jumpForce;
                        this.isGrounded = false;
                    }
                }

                this.detectObstacles(game.obstacles, intendedDirection);
                
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles);
                this.applyPhysics(terrain);
                
                if (this.x < game.cameraX - 100 || this.x > game.cameraX + canvas.width + 100) {
                    this.offScreenTimer++;
                    if (this.offScreenTimer > 60) this.hasEscaped = true;
                }
                break;

            case Zombie.STATES.CAPTURED:
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angleToPlayer) * this.pullSpeed;
                this.vy = Math.sin(angleToPlayer) * this.pullSpeed;
                this.x += this.vx;
                this.y += this.vy;
                this.angle += 0.3;
                
                const currentGroundY = terrain.getHeight(this.x);
                if (this.y + this.height / 2 > currentGroundY) {
                    this.y = currentGroundY - this.height / 2;
                }

                const dist = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
                if (dist < 60) {
                    this.state = Zombie.STATES.EXTRACTING;
                    game.projectiles.forEach(p => { 
                        if (p.connectedZombie === this) p.active = false; 
                    });
                }
                break;

            case Zombie.STATES.EXTRACTING:
                this.vy -= 0.5;
                if (this.vy < -12) this.vy = -12;
                this.vx = Math.sin(Date.now() / 100) * 2;
                this.y += this.vy;
                this.x += this.vx;
                this.angle = this.vx * 0.1;
                
                this.extractTimer++;

                if (this.extractTimer > 45 && !this.coinsSpawned) {
                    const coinCount = 5;
                    for(let i=0; i<coinCount; i++) {
                        game.coins.push(new Coin(this.x + (Math.random() * 40 - 20), this.y));
                    }
                    this.coinsSpawned = true;
                }

                if (this.y < -500) {
                    this.active = false;
                }
                break;
        }
    }

    detectObstacles(obstacles, direction) {
        if (!this.isGrounded && this.vy > 0) return;

        if (Math.random() < this.clumsiness) return;
        
        const checkDir = direction !== 0 ? direction : this.scaleX;
        const lookAheadX = this.x + checkDir * this.scanDistance;
        
        const obstacleAhead = obstacles.find(o => {
            const dist = Math.abs(o.x - lookAheadX);
            return dist < o.width && Math.abs(o.y - this.y) < 100;
        });

        if (obstacleAhead) {
            this.vy = this.jumpForce;
            this.isGrounded = false;
        }
    }

    resolveObstacleCollisions(obstacles) {
        obstacles.forEach(o => {
            const overlapX = (this.width + o.width) / 2 - Math.abs(this.x - o.x);
            const overlapY = (this.height + o.height) / 2 - Math.abs(this.y - o.y);

            if (overlapX > 0 && overlapY > 0) {
                if (overlapX < overlapY) {
                    this.x += this.x < o.x ? -overlapX : overlapX;
                    
                    if (this.isGrounded) {
                        if (Math.abs(this.vx) > 1) {
                            if(Math.random() > 0.5) {
                                this.vy = this.jumpForce;
                                this.isGrounded = false;
                            } else {
                                this.stunTimer = 10;
                                this.vx = 0;
                            }
                        }
                    }
                } else {
                    if (this.vy >= 0) {
                        this.y += this.y < o.y ? -overlapY : overlapY;
                        if (this.y < o.y) {
                            this.vy = 0;
                            this.isGrounded = true;
                        }
                    }
                }
            }
        });
    }

    _render(ctx) {
        if (this.state === Zombie.STATES.HIDDEN) return;

        if (this.state === Zombie.STATES.EXTRACTING) {
            ctx.beginPath();
            ctx.moveTo(0, -this.height/2);
            ctx.lineTo(0, -this.height/2 - 40);
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = "#e74c3c";
            ctx.beginPath();
            ctx.ellipse(0, -this.height/2 - 55, 20, 25, 0, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = "rgba(255,255,255,0.3)";
            ctx.beginPath();
            ctx.ellipse(5, -this.height/2 - 60, 5, 8, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.scale(this.scaleX, this.scaleY);
        
        if (this.state === Zombie.STATES.ATTACKING) ctx.fillStyle = "#c0392b"; 
        else if (this.state === Zombie.STATES.FLEEING) ctx.fillStyle = "#e74c3c"; 
        else if (this.state === Zombie.STATES.EATING) ctx.fillStyle = "#f39c12"; 
        else ctx.fillStyle = "#9b59b6"; 

        if (this.state === Zombie.STATES.PEEKING) {
            ctx.fillRect(-this.width / 2, -8, this.width, 8);
            ctx.fillStyle = "white";
            ctx.fillRect(-6, -6, 4, 4);
            ctx.fillRect(2, -6, 4, 4);
        } else {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 6);
            
            if (this.personality === Zombie.PERSONALITIES.AGGRESSIVE) {
                ctx.fillStyle = "#e74c3c";
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 6);
            }
            
            ctx.fillStyle = "white";
            ctx.fillRect(-6, -15, 5, 5);
            ctx.fillRect(4, -15, 5, 5);
            
            if (this.personality === Zombie.PERSONALITIES.CRAZY) {
                ctx.fillStyle = "black";
                ctx.fillRect(-5, -14, 2, 2); 
                ctx.fillRect(6, -13, 1, 1);
            }
        }
    }
}