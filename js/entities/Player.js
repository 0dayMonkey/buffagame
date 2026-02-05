import { Character } from './Character.js';
import { Projectile } from './Projectile.js';
import { Brain } from './Brain.js';

export class Player extends Character {
    constructor(x, y) {
        super(x, y, 40, 65);
        this.armAngle = 0;
        this.jetpackThrust = -0.9; 
        this.charge = 0;
        this.maxCharge = 30;
        this.isCharging = false;
        this.fuel = 100;
        this.maxFuel = 100;
        this.money = 0;
        this.canDropBrain = true;
    }

    update(dt, input, canvas, game, terrain) {
        if (input.isPressed('KeyA') || input.isPressed('ArrowLeft')) this.vx -= this.speed;
        if (input.isPressed('KeyD') || input.isPressed('ArrowRight')) this.vx += this.speed;
        
        if ((input.isPressed('Space') || input.isPressed('KeyW')) && this.fuel > 0) {
            this.vy += this.jetpackThrust;
            this.fuel -= 0.7;
        } else if (this.isGrounded && this.fuel < this.maxFuel) {
            this.fuel += 0.5;
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
            if (this.charge < this.maxCharge) this.charge += 0.6;
        } else if (this.isCharging) {
            this.fire(game);
            this.isCharging = false;
            this.charge = 0;
        }

        if (this.x < game.cameraX + 10) {
            this.x = game.cameraX + 10;
            this.vx = 10;
        }

        super.update(dt);
        this.applyPhysics(terrain);

        if (!this.isGrounded) {
            const targetAngle = this.vx * 0.04;
            this.angle += (targetAngle - this.angle) * 0.1;
        }
    }

    fire(game) {
        if (game.projectiles.length > 0) return;
        const p = new Projectile(this.x, this.y - 10, this.armAngle, this.charge + 15);
        game.projectiles.push(p);
    }

    _render(ctx) {
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

        ctx.save();
        ctx.translate(0, -10);
        ctx.rotate(this.armAngle - this.angle);
        ctx.fillStyle = "#e67e22";
        ctx.fillRect(0, -5, 45, 10);
        ctx.restore();
    }
}