import { Character } from './Character.js';
import { Projectile } from './Projectile.js';
import { Brain } from './Brain.js';

export class Player extends Character {
    constructor(x, y) {
        super(x, y, 32, 52);
        this.armAngle = 0;
        this.jetpackThrust = -0.58; 
        this.jumpForce = -9;
        this.wasJumpPressed = false;
        this.charge = 0;
        this.maxCharge = 30;
        this.isCharging = false;
        this.fuel = 100;
        this.maxFuel = 100;
        this.money = 0;
        this.canDropBrain = true;
        this.lives = 3;
        this.invincibility = 0;
    }

    update(dt, input, canvas, game, terrain) {
        if (this.invincibility > 0) this.invincibility--;

        const moveLeft = input.isPressed('KeyA') || input.isPressed('ArrowLeft');
        const moveRight = input.isPressed('KeyD') || input.isPressed('ArrowRight');

        if (moveLeft) this.vx -= this.speed;
        if (moveRight) this.vx += this.speed;
        
        const isJumpInput = input.isPressed('Space') || input.isPressed('KeyW');

        if (isJumpInput) {
            if (this.isGrounded && !this.wasJumpPressed) {
                this.vy = this.jumpForce;
                this.isGrounded = false;
                this.scaleX = 0.7;
                this.scaleY = 1.4;
            } else if (!this.isGrounded && this.fuel > 0) {
                this.vy += this.jetpackThrust;
                this.fuel -= 0.6;
                if (moveLeft) this.vx -= 0.25;
                if (moveRight) this.vx += 0.25;
            }
            this.wasJumpPressed = true;
        } else {
            this.wasJumpPressed = false;
            if (this.isGrounded && this.fuel < this.maxFuel) {
                this.fuel += 0.4;
            }
        }

        if (input.isPressed('KeyE') && this.canDropBrain && this.isGrounded) {
            game.brains.push(new Brain(this.x, this.y));
            this.canDropBrain = false;
            setTimeout(() => this.canDropBrain = true, 2000);
        }

        const worldMouseX = input.mouse.x + game.cameraX;
        const worldMouseY = input.mouse.y; 
        this.armAngle = Math.atan2(worldMouseY - this.y, worldMouseX - this.x);

        if (input.mouse.pressed) {
            this.isCharging = true;
            if (this.charge < this.maxCharge) this.charge += 0.5;
        } else if (this.isCharging) {
            this.fire(game);
            this.isCharging = false;
            this.charge = 0;
        }

        if (this.x < game.cameraX + 10) {
            this.x = game.cameraX + 10;
            this.vx = 8;
        }

        super.update(dt);
        this.applyPhysics(terrain);

        if (!this.isGrounded) {
            const targetAngle = this.vx * 0.03;
            this.angle += (targetAngle - this.angle) * 0.05;
        }
    }

    fire(game) {
        if (game.projectiles.length > 0) return;
        const p = new Projectile(this.x, this.y - 10, this.armAngle, this.charge + 12);
        game.projectiles.push(p);
    }

    _render(ctx) {
        if (this.invincibility % 10 > 5) return;
        ctx.save();
        ctx.scale(this.scaleX, this.scaleY);
        ctx.fillStyle = "#2ecc71";
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);

        if (this.fuel < this.maxFuel) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
            ctx.fillRect(-this.width / 2, -this.height / 2 - 25, this.width, 6);
            ctx.fillStyle = this.fuel > 20 ? "#3498db" : "#e74c3c";
            ctx.fillRect(-this.width / 2, -this.height / 2 - 25, (this.fuel / this.maxFuel) * this.width, 6);
        }

        if (this.isCharging) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
            ctx.fillRect(-this.width / 2, -this.height / 2 - 15, this.width, 6);
            ctx.fillStyle = "#f1c40f";
            ctx.fillRect(-this.width / 2, -this.height / 2 - 15, (this.charge / this.maxCharge) * this.width, 6);
        }
        ctx.restore();

        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(this.armAngle - this.angle);
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(0, -5, 38, 8);
        ctx.restore();
    }
}