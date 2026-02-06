export class ParticleSystem {
    constructor() {
        this.particles = [];
    }

    emit(x, y, type, count = 1) {
        for (let i = 0; i < count; i++) {
            this.particles.push(this.createParticle(x, y, type));
        }
    }

    createParticle(x, y, type) {
        const p = {
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 1.0,
            decay: 0.02,
            size: Math.random() * 3 + 2,
            color: '#fff',
            gravity: 0,
            type: type
        };

        if (type === 'JETPACK') {
            p.vx = (Math.random() - 0.5) * 1.5;
            p.vy = Math.random() * 2 + 1; 
            p.color = Math.random() > 0.5 ? '#f39c12' : '#e74c3c'; 
            p.decay = 0.05;
            p.size = 4;
        } else if (type === 'SLIME') {
            p.vy = Math.random() * -2 - 1;
            p.gravity = 0.2;
            p.color = '#2ecc71';
            p.decay = 0.015;
            p.size = Math.random() * 4 + 2;
        } else if (type === 'DUST') {
            p.vy = (Math.random() - 0.5) * 0.5;
            p.color = '#95a5a6';
            p.decay = 0.03;
            p.size = Math.random() * 5 + 3;
        } else if (type === 'SPARK') {
            p.vx = (Math.random() - 0.5) * 5;
            p.vy = (Math.random() - 0.5) * 5;
            p.color = '#f1c40f';
            p.decay = 0.06;
            p.size = 2;
        }

        return p;
    }

    update() {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += p.gravity;
            p.life -= p.decay;

            if (p.type === 'DUST' || p.type === 'JETPACK') {
                p.size *= 0.95;
            }

            if (p.life <= 0) {
                this.particles.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        for (const p of this.particles) {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();
    }
}