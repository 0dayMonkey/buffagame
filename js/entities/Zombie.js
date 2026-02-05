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
        super(x, y, 30, 45);
        this.state = Zombie.STATES.HIDDEN;
        this.active = true;
        this.safetyDistance = 350;
        this.stealthTimer = 0;
        this.eatingTimer = 0;
        this.offScreenTimer = 0;
        this.pullSpeed = 6;
        this.targetBrain = null;
        this.wobble = 0;
        this.hasEscaped = false;
    }

    update(dt, player, canvas, brains, game, terrain) {
        const distToPlayer = Math.sqrt((this.x - player.x)**2 + (this.y - player.y)**2);
        const groundY = terrain.getHeight(this.x);

        switch(this.state) {
            case Zombie.STATES.HIDDEN:
                this.y = groundY + 50;
                this.vy = 0;
                this.angle = 0;
                const nearBrain = brains.find(b => Math.abs(b.x - this.x) < 150);
                if (nearBrain && distToPlayer > this.safetyDistance) {
                    this.state = Zombie.STATES.PEEKING;
                    this.targetBrain = nearBrain;
                }
                break;

            case Zombie.STATES.PEEKING:
                this.y = groundY - 10;
                this.vy = 0;
                this.angle = terrain.getSlopeAngle(this.x);
                if (distToPlayer < this.safetyDistance) this.state = Zombie.STATES.HIDDEN;
                this.stealthTimer++;
                if (this.stealthTimer > 120) {
                    this.state = Zombie.STATES.EMERGING;
                    this.stealthTimer = 0;
                }
                break;

            case Zombie.STATES.EMERGING:
                this.y -= 1.5;
                this.vy = 0;
                this.wobble += 0.2;
                this.angle = terrain.getSlopeAngle(this.x) + Math.sin(this.wobble) * 0.1;
                
                if (this.y <= groundY - this.height / 2) {
                    this.state = Zombie.STATES.EATING;
                    this.eatingTimer = 0;
                }
                if (distToPlayer < this.safetyDistance - 50) this.state = Zombie.STATES.HIDDEN;
                break;

            case Zombie.STATES.EATING:
                if (this.targetBrain && this.targetBrain.active) {
                    if (Math.abs(this.x - this.targetBrain.x) > 10) {
                        const dir = Math.sign(this.targetBrain.x - this.x);
                        this.vx = dir * 1.2;
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
                if (distToPlayer < 200) this.state = Zombie.STATES.FLEEING;
                super.update(dt);
                this.applyPhysics(terrain);
                break;

            case Zombie.STATES.FLEEING:
                this.vx = Math.sign(this.x - player.x) * 5.5;
                super.update(dt);
                this.applyPhysics(terrain);
                
                if (this.x < game.cameraX - 100 || this.x > game.cameraX + canvas.width + 100) {
                    this.offScreenTimer++;
                    if (this.offScreenTimer > 60) {
                        this.hasEscaped = true;
                    }
                }
                break;

            case Zombie.STATES.CAPTURED:
                const angle = Math.atan2(player.y - this.y, player.x - this.x);
                this.vx = Math.cos(angle) * this.pullSpeed;
                this.vy = Math.sin(angle) * this.pullSpeed;
                this.x += this.vx;
                this.y += this.vy;
                this.angle += 0.3;
                break;
        }
    }

    _render(ctx) {
        if (this.state === Zombie.STATES.HIDDEN) return;
        
        ctx.fillStyle = this.state === Zombie.STATES.FLEEING ? "#e74c3c" : "#9b59b6";
        if (this.state === Zombie.STATES.PEEKING) {
            ctx.fillRect(-this.width / 2, -10, this.width, 10);
        } else {
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
            ctx.fillStyle = "#2ecc71";
            ctx.fillRect(-this.width / 2, -this.height / 2, this.width, 8);
        }
    }
}