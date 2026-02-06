import { Character } from './Character.js';

export class Zombie extends Character {
    static STATES = {
        HIDDEN: 'HIDDEN',
        PEEKING: 'PEEKING',
        EMERGING: 'EMERGING',
        EATING: 'EATING',
        FLEEING: 'FLEEING',
        ATTACKING: 'ATTACKING',
        CAPTURED: 'CAPTURED'
    };

    static PERSONALITIES = {
        COWARD: 'COWARD',     // Fuit vite (50%)
        AGGRESSIVE: 'AGGRESSIVE', // Attaque le joueur (30%)
        CRAZY: 'CRAZY'        // Saute partout, imprévisible (20%)
    };

    constructor(x, y) {
        super(x, y, 26, 40);
        this.state = Zombie.STATES.HIDDEN;
        this.active = true;
        this.safetyDistance = 350;
        
        // --- PROFILAGE ALEATOIRE (RNG) ---
        const rand = Math.random();
        if (rand < 0.5) this.personality = Zombie.PERSONALITIES.COWARD;
        else if (rand < 0.8) this.personality = Zombie.PERSONALITIES.AGGRESSIVE;
        else this.personality = Zombie.PERSONALITIES.CRAZY;

        // --- VARIATIONS PHYSIQUES ---
        // Vitesse : entre 90% et 125% de la normale
        this.speedMultiplier = 0.9 + Math.random() * 0.35;
        // Force de saut : un peu aléatoire pour désynchroniser la horde
        this.jumpForce = -7.5 - Math.random() * 2; 
        // Maladresse : Chance de rater un obstacle (0% à 15%)
        this.clumsiness = Math.random() * 0.15;
        
        // Timers
        this.stealthTimer = 0;
        this.eatingTimer = 0;
        this.offScreenTimer = 0;
        this.stunTimer = 0; // Temps d'étourdissement si saut raté

        // Gameplay
        this.pullSpeed = 13;
        this.targetBrain = null;
        this.wobble = 0;
        this.hasEscaped = false;
        this.scanDistance = 80;
    }

    update(dt, player, canvas, brains, game, terrain) {
        const distToPlayer = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
        const groundY = terrain.getHeight(this.x);

        // Gestion de l'étourdissement (si saut raté)
        if (this.stunTimer > 0) {
            this.stunTimer--;
            this.vx = 0;
            this.applyPhysics(terrain);
            // Petit tremblement visuel
            this.x += (Math.random() - 0.5) * 2;
            return;
        }

        switch(this.state) {
            case Zombie.STATES.HIDDEN:
                this.y = groundY + 50;
                this.vx = 0;
                this.vy = 0;
                this.angle = 0;
                
                const nearBrain = brains.find(b => Math.abs(b.x - this.x) < 150 && b.active);
                
                // Les agressifs sortent plus facilement
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
                
                // Temps d'observation variable selon personnalité
                let peekTime = 120;
                if (this.personality === Zombie.PERSONALITIES.CRAZY) peekTime = 60; // Impatient

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
                // Comportement face au joueur
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
                        this.vx = dir * 1.1 * this.speedMultiplier;
                        this.detectObstacles(game.obstacles);
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
                
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles);
                this.applyPhysics(terrain);
                break;

            case Zombie.STATES.ATTACKING:
                // Court VERS le joueur
                const attackDir = Math.sign(player.x - this.x);
                this.vx = attackDir * 3.5 * this.speedMultiplier; // Un peu plus lent que la fuite
                
                // Saute comme un fou si CRAZY
                if (this.personality === Zombie.PERSONALITIES.CRAZY && this.isGrounded && Math.random() < 0.05) {
                    this.vy = this.jumpForce;
                    this.isGrounded = false;
                }

                this.detectObstacles(game.obstacles);
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles);
                this.applyPhysics(terrain);

                // Si le joueur s'éloigne trop ou meurt, on repasse en fuite
                if (distToPlayer > 600 || player.lives <= 0) {
                    this.state = Zombie.STATES.FLEEING;
                }
                break;

            case Zombie.STATES.FLEEING:
                // Court A L'OPPOSE du joueur
                const fleeDir = Math.sign(this.x - player.x);
                let speed = 5 * this.speedMultiplier;
                if (this.personality === Zombie.PERSONALITIES.COWARD) speed *= 1.15; // Bonus vitesse lâche

                this.vx = fleeDir * speed;
                
                // Comportement "CRAZY" : Sauts aléatoires (Paranoïa)
                if (this.personality === Zombie.PERSONALITIES.CRAZY && this.isGrounded) {
                    if (Math.random() < 0.03) { // 3% de chance par frame de sauter pour rien
                        this.vy = this.jumpForce;
                        this.isGrounded = false;
                    }
                }

                this.detectObstacles(game.obstacles);
                
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
                break;
        }
    }

    detectObstacles(obstacles) {
        if (!this.isGrounded) return;

        // Facteur Maladresse : Chance de rater le check d'obstacle
        if (Math.random() < this.clumsiness) {
            // Si le zombie rate son check, il ne saute pas et va se cogner (géré par resolveCollisions)
            // On peut ajouter un flag pour le faire s'arrêter s'il tape
            return;
        }

        const lookAheadX = this.x + Math.sign(this.vx) * this.scanDistance;
        
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
                    // Collision Mur
                    this.x += this.x < o.x ? -overlapX : overlapX;
                    
                    // Si on tape un mur alors qu'on voulait avancer, on est étourdi (maladresse)
                    if (Math.abs(this.vx) > 1) {
                        this.stunTimer = 30; // 0.5 sec de pause
                        this.vx = 0;
                    }
                } else {
                    // Atterrissage sur obstacle
                    this.y += this.y < o.y ? -overlapY : overlapY;
                    if (this.y < o.y) {
                        this.vy = 0;
                        this.isGrounded = true;
                    }
                }
            }
        });
    }

    _render(ctx) {
        if (this.state === Zombie.STATES.HIDDEN) return;
        
        ctx.scale(this.scaleX, this.scaleY);
        
        // Code couleur pour debug visuel (optionnel, peut être retiré pour prod pure)
        // FLEEING/ATTACKING = Rouge
        // EATING = Orange
        // PEEKING/EMERGING = Violet
        
        if (this.state === Zombie.STATES.ATTACKING) ctx.fillStyle = "#c0392b"; // Rouge sang foncé
        else if (this.state === Zombie.STATES.FLEEING) ctx.fillStyle = "#e74c3c"; // Rouge clair
        else if (this.state === Zombie.STATES.EATING) ctx.fillStyle = "#f39c12"; 
        else ctx.fillStyle = "#9b59b6"; 

        if (this.state === Zombie.STATES.PEEKING) {
            ctx.fillRect(-this.width / 2, -8, this.width, 8);
            ctx.fillStyle = "white";
            ctx.fillRect(-6, -6, 4, 4);
            ctx.fillRect(2, -6, 4, 4);
        } else {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            // Bandeau
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 6);
            
            // Accessoire selon personnalité
            if (this.personality === Zombie.PERSONALITIES.AGGRESSIVE) {
                // Bandeau rouge ou yeux rouges
                ctx.fillStyle = "#e74c3c";
                ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 6);
            }
            
            // Yeux
            ctx.fillStyle = "white";
            ctx.fillRect(-6, -15, 5, 5);
            ctx.fillRect(4, -15, 5, 5);
            
            // Yeux fous pour le CRAZY
            if (this.personality === Zombie.PERSONALITIES.CRAZY) {
                ctx.fillStyle = "black";
                ctx.fillRect(-5, -14, 2, 2); // Pupille décalée
                ctx.fillRect(6, -13, 1, 1);
            }
        }
    }
}