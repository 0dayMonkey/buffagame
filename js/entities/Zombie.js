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

    constructor(x, y) {
        super(x, y, 30, 45);
        this.state = Zombie.STATES.HIDDEN;
        this.active = true;
        this.safetyDistance = 350;
        this.stealthTimer = 0;
        this.eatingTimer = 0;
        this.pullSpeed = 25;
        this.targetBrain = null;
        this.hasEscaped = false;
        this.animFrame = 0;
        this.targetY = y + 50;
    }

    alert() {
        if ([Zombie.STATES.HIDDEN, Zombie.STATES.PEEKING, Zombie.STATES.EMERGING].includes(this.state)) {
            this.state = Zombie.STATES.FLEEING;
        }
    }

    update(dt, player, canvas, brains, game, terrain) {
        const distToPlayer = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
        const groundY = terrain.getHeight(this.x);
        const playerIsMoving = Math.abs(player.vx) > 0.4 || Math.abs(player.vy) > 0.5;
        const playerIsVisible = distToPlayer < this.safetyDistance && playerIsMoving;

        this.animFrame += 0.1;

        if (this.state !== Zombie.STATES.CAPTURED && this.state !== Zombie.STATES.HIDDEN) {
            this.checkEnvironment(terrain, player);
        }

        switch(this.state) {
            case Zombie.STATES.HIDDEN:
                this.targetY = groundY + 50;
                this.y += (this.targetY - this.y) * 0.1;
                const nearBrain = brains.find(b => Math.abs(b.x - this.x) < 220);
                if (nearBrain && !playerIsVisible) {
                    this.state = Zombie.STATES.PEEKING;
                    this.targetBrain = nearBrain;
                }
                break;

            case Zombie.STATES.PEEKING:
                this.targetY = groundY - 10;
                this.y += (this.targetY - this.y) * 0.1;
                if (playerIsVisible) this.state = Zombie.STATES.HIDDEN;
                this.stealthTimer++;
                if (this.stealthTimer > 100) {
                    this.state = Zombie.STATES.EMERGING;
                    this.stealthTimer = 0;
                }
                break;

            case Zombie.STATES.EMERGING:
                this.y -= 1.2;
                if (playerIsVisible) this.state = Zombie.STATES.HIDDEN;
                if (this.y <= groundY - this.height / 2) {
                    this.state = Zombie.STATES.EATING;
                }
                break;

            case Zombie.STATES.EATING:
                if (this.targetBrain && this.targetBrain.active) {
                    const dir = Math.sign(this.targetBrain.x - this.x);
                    this.vx = dir * 1.8;
                    if (Math.abs(this.x - this.targetBrain.x) < 15) {
                        this.vx = 0;
                        this.eatingTimer++;
                        if (this.eatingTimer > 80) {
                            this.targetBrain.active = false;
                            this.decideNextMove(player);
                        }
                    }
                } else {
                    this.state = Zombie.STATES.FLEEING;
                }
                if (distToPlayer < 180 && playerIsMoving) this.decideNextMove(player);
                super.update(dt);
                this.applyPhysics(terrain);
                break;

            case Zombie.STATES.FLEEING:
                this.vx = Math.sign(this.x - player.x) * 6;
                super.update(dt);
                this.applyPhysics(terrain);
                if (this.x < game.cameraX - 200 || this.x > game.cameraX + canvas.width + 200) {
                    this.hasEscaped = true;
                }
                break;

            case Zombie.STATES.ATTACKING:
                const atkDir = Math.sign(player.x - this.x);
                this.vx = atkDir * 7.5;
                super.update(dt);
                this.applyPhysics(terrain);
                if (distToPlayer < 35) {
                    player.stunTimer = 1000;
                    game.addFloatingText("STUN!", player.x, player.y - 80, "#f1c40f");
                    this.state = Zombie.STATES.FLEEING;
                }
                if (distToPlayer > 600) this.state = Zombie.STATES.FLEEING;
                break;

            case Zombie.STATES.CAPTURED:
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angle) * this.pullSpeed;
                this.vy = Math.sin(angle) * this.pullSpeed;
                this.x += this.vx;
                this.y += this.vy;
                this.angle += 0.4;
                break;
        }
    }

    decideNextMove(player) {
        if (Math.random() < 0.2) this.state = Zombie.STATES.ATTACKING;
        else this.state = Zombie.STATES.FLEEING;
    }

    checkEnvironment(terrain, player) {
        if (!this.isGrounded) return;
        
        let moveDir = Math.sign(this.vx);
        if (moveDir === 0) {
            if (this.state === Zombie.STATES.FLEEING) moveDir = Math.sign(this.x - player.x);
            else if (this.state === Zombie.STATES.ATTACKING) moveDir = Math.sign(player.x - this.x);
            else if (this.targetBrain) moveDir = Math.sign(this.targetBrain.x - this.x);
        }
        
        if (moveDir === 0) return;

        const lookDist = moveDir * 45;
        const nextGround = terrain.getHeight(this.x + lookDist);
        const isObstacle = (nextGround < this.y - 15) && nextGround < terrain.baseHeight + 100;
        const isRavin = nextGround > terrain.baseHeight + 200;

        if (isObstacle) {
            this.vy = -9.2;
        } else if (isRavin) {
            if (Math.random() < 0.5) {
                this.vy = -11;
                this.vx = moveDir * 8;
            }
        }
    }

    _render(ctx) {
        if (this.state === Zombie.STATES.HIDDEN) return;

        const bodyColor = this.state === Zombie.STATES.FLEEING ? "#e74c3c" : 
                         this.state === Zombie.STATES.ATTACKING ? "#f39c12" : "#7fb3d5";
        
        ctx.save();
        ctx.scale(this.scaleX, this.scaleY);

        if (this.state === Zombie.STATES.PEEKING) {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-this.width / 2, -10, this.width, 10);
            ctx.fillStyle = "white";
            ctx.fillRect(-8, -8, 4, 4);
            ctx.fillRect(4, -8, 4, 4);
        } else {
            ctx.fillStyle = bodyColor;
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            
            ctx.fillStyle = "rgba(0,0,0,0.15)";
            ctx.fillRect(-this.width/2, -this.height/2, 6, this.height);
            
            ctx.fillStyle = "#5dade2";
            ctx.fillRect(-this.width / 2, 0, this.width, this.height / 2);

            ctx.fillStyle = "white";
            const eyeY = -this.height / 2 + 8;
            ctx.fillRect(-10, eyeY, 7, 7);
            ctx.fillRect(4, eyeY, 7, 7);
            ctx.fillStyle = "black";
            ctx.fillRect(-8, eyeY + 2, 3, 3);
            ctx.fillRect(6, eyeY + 2, 3, 3);

            ctx.fillStyle = "#212f3d";
            ctx.fillRect(-6, 4, 12, 3);
        }
        ctx.restore();
    }
}