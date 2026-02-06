import { Character } from './Character.js';

export class Zombie extends Character {
    static STATES = {
        HIDDEN: 'HIDDEN',
        PEEKING: 'PEEKING',
        EMERGING: 'EMERGING',
        EATING: 'EATING',
        FLEEING: 'FLEEING',
        CAPTURED: 'CAPTURED'
    };

    constructor(x, y) {
        super(x, y, 26, 40);
        this.state = Zombie.STATES.HIDDEN;
        this.active = true;
        this.safetyDistance = 350;
        
        // Timers et compteurs
        this.stealthTimer = 0;
        this.eatingTimer = 0;
        this.offScreenTimer = 0;
        
        // Propriétés de mouvement et IA
        this.pullSpeed = 13;
        this.targetBrain = null;
        this.wobble = 0;
        this.hasEscaped = false;
        this.jumpForce = -8; // Force de saut pour éviter les obstacles
        this.scanDistance = 80; // Distance de détection des obstacles devant
    }

    update(dt, player, canvas, brains, game, terrain) {
        const distToPlayer = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
        const groundY = terrain.getHeight(this.x);

        // Gestion des états
        switch(this.state) {
            case Zombie.STATES.HIDDEN:
                this.y = groundY + 50;
                this.vy = 0;
                this.vx = 0;
                this.angle = 0;
                // Détection de l'appât (Cerveau)
                const nearBrain = brains.find(b => Math.abs(b.x - this.x) < 150 && b.active);
                if (nearBrain && distToPlayer > this.safetyDistance) {
                    this.state = Zombie.STATES.PEEKING;
                    this.targetBrain = nearBrain;
                }
                break;

            case Zombie.STATES.PEEKING:
                this.y = groundY - 8; // Juste la tête qui dépasse
                this.vy = 0;
                this.vx = 0;
                this.angle = terrain.getSlopeAngle(this.x);
                
                // Si le joueur revient, on se cache immédiatement
                if (distToPlayer < this.safetyDistance) {
                    this.state = Zombie.STATES.HIDDEN;
                    this.stealthTimer = 0;
                }
                
                this.stealthTimer++;
                if (this.stealthTimer > 120) { // 2 secondes d'observation
                    this.state = Zombie.STATES.EMERGING;
                    this.stealthTimer = 0;
                }
                break;

            case Zombie.STATES.EMERGING:
                this.y -= 1.2; // Sortie lente du sol
                this.vy = 0;
                this.vx = 0;
                this.wobble += 0.2;
                this.angle = terrain.getSlopeAngle(this.x) + Math.sin(this.wobble) * 0.1;
                
                if (this.y <= groundY - this.height / 2) {
                    this.state = Zombie.STATES.EATING;
                    this.eatingTimer = 0;
                }
                // Si le joueur arrive pendant l'émergence, le zombie se cache
                if (distToPlayer < this.safetyDistance - 50) {
                    this.state = Zombie.STATES.HIDDEN;
                }
                break;

            case Zombie.STATES.EATING:
                if (this.targetBrain && this.targetBrain.active) {
                    if (Math.abs(this.x - this.targetBrain.x) > 10) {
                        // Se déplacer vers le cerveau
                        const dir = Math.sign(this.targetBrain.x - this.x);
                        this.vx = dir * 1.1;
                        this.detectObstacles(game.obstacles); // Vérifier les obstacles
                    } else {
                        // Manger le cerveau
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
                
                // Si le joueur approche, fuite immédiate
                if (distToPlayer < 200) this.state = Zombie.STATES.FLEEING;
                
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles); // Physique contre les murs
                this.applyPhysics(terrain);
                break;

            case Zombie.STATES.FLEEING:
                // Fuir à l'opposé du joueur
                const direction = Math.sign(this.x - player.x);
                this.vx = direction * 5; // Vitesse de course
                
                // IA de Navigation
                this.detectObstacles(game.obstacles);
                
                super.update(dt);
                this.resolveObstacleCollisions(game.obstacles);
                this.applyPhysics(terrain);
                
                // Gestion sortie d'écran (Fuite réussie)
                if (this.x < game.cameraX - 100 || this.x > game.cameraX + canvas.width + 100) {
                    this.offScreenTimer++;
                    if (this.offScreenTimer > 60) {
                        this.hasEscaped = true;
                    }
                }
                break;

            case Zombie.STATES.CAPTURED:
                // Physique de capture (Grappin)
                const angleToPlayer = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angleToPlayer) * this.pullSpeed;
                this.vy = Math.sin(angleToPlayer) * this.pullSpeed;
                this.x += this.vx;
                this.y += this.vy;
                this.angle += 0.3; // Rotation paniquée

                // Empêcher de passer sous la map pendant la capture
                const currentGroundY = terrain.getHeight(this.x);
                if (this.y + this.height / 2 > currentGroundY) {
                    this.y = currentGroundY - this.height / 2;
                }
                break;
        }
    }

    // --- NOUVELLE MÉTHODE : Détection et Saut ---
    detectObstacles(obstacles) {
        if (!this.isGrounded) return; // Ne pas sauter si déjà en l'air

        // Chercher un obstacle devant dans la direction du mouvement
        const lookAheadX = this.x + Math.sign(this.vx) * this.scanDistance;
        
        const obstacleAhead = obstacles.find(o => {
            const dist = Math.abs(o.x - lookAheadX);
            // Vérifie si l'obstacle est proche en X et à la même hauteur (pas sur une autre plateforme)
            return dist < o.width && Math.abs(o.y - this.y) < 100;
        });

        if (obstacleAhead) {
            this.vy = this.jumpForce; // Sauter !
            this.isGrounded = false;
        }
    }

    // --- NOUVELLE MÉTHODE : Collisions Physiques (Mur) ---
    resolveObstacleCollisions(obstacles) {
        obstacles.forEach(o => {
            const overlapX = (this.width + o.width) / 2 - Math.abs(this.x - o.x);
            const overlapY = (this.height + o.height) / 2 - Math.abs(this.y - o.y);

            if (overlapX > 0 && overlapY > 0) {
                // Collision détectée
                if (overlapX < overlapY) {
                    // Collision horizontale (Mur)
                    // On repousse le zombie hors de l'obstacle
                    this.x += this.x < o.x ? -overlapX : overlapX;
                    this.vx = 0; // Arrêt net
                } else {
                    // Collision verticale (atterrissage sur l'obstacle)
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
        
        // Couleur selon l'état
        if (this.state === Zombie.STATES.FLEEING) ctx.fillStyle = "#e74c3c"; // Rouge panique
        else if (this.state === Zombie.STATES.EATING) ctx.fillStyle = "#f39c12"; // Orange mange
        else ctx.fillStyle = "#9b59b6"; // Violet normal

        if (this.state === Zombie.STATES.PEEKING) {
            // Dessiner seulement le haut de la tête
            ctx.fillRect(-this.width / 2, -8, this.width, 8);
            // Yeux qui clignent (optionnel pour le détail)
            ctx.fillStyle = "white";
            ctx.fillRect(-6, -6, 4, 4);
            ctx.fillRect(2, -6, 4, 4);
        } else {
            // Corps entier
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            // Bandeau vert (style Zombie Catchers)
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 6);
            
            // Yeux
            ctx.fillStyle = "white";
            ctx.fillRect(-6, -15, 5, 5);
            ctx.fillRect(4, -15, 5, 5);
        }
    }
}