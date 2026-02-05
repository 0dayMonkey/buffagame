export class Noise {
    constructor(seed = Math.random()) {
        this.p = new Uint8Array(512);
        this.perm = new Uint8Array(512);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        for (let i = 0; i < 256; i++) {
            const r = Math.floor(Math.random() * (256 - i)) + i;
            [this.p[i], this.p[r]] = [this.p[r], this.p[i]];
        }
        for (let i = 0; i < 512; i++) this.perm[i] = this.p[i & 255];
    }

    dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }

    noise(x, y) {
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        x -= Math.floor(x);
        y -= Math.floor(y);
        const u = this.fade(x);
        const v = this.fade(y);
        const A = this.perm[X] + Y, AA = this.perm[A], AB = this.perm[A + 1];
        const B = this.perm[X + 1] + Y, BA = this.perm[B], BB = this.perm[B + 1];

        const grad = (hash, x, y) => {
            const h = hash & 15;
            const u = h < 8 ? x : y;
            const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;
            return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
        };

        return this.lerp(v, this.lerp(u, grad(this.perm[AA], x, y), grad(this.perm[BA], x - 1, y)),
            this.lerp(u, grad(this.perm[AB], x, y - 1), grad(this.perm[BB], x - 1, y - 1)));
    }

    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
}