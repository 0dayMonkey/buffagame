export class Background {
    constructor(canvasWidth, canvasHeight) {
        this.width = canvasWidth;
        this.height = canvasHeight;
        
        // Palette "Zombie Catchers" (Swampy/Toxic)
        this.colors = {
            skyTop: "#1a2626",
            skyBottom: "#4a5e4d",
            fog: "rgba(180, 200, 150, 0.1)",
            layer1: "#1e2b25", // Loin (Silhouettes)
            layer2: "#2d3e35", // Milieu
            layer3: "#3e5245"  // Proche
        };

        this.layers = [
            { speed: 0.0, render: this.drawSky.bind(this) },
            { speed: 0.1, render: (ctx, x) => this.drawSilhouetteLayer(ctx, x, this.colors.layer1, 0.6, 200, 15) },
            { speed: 0.3, render: (ctx, x) => this.drawSwampLayer(ctx, x, this.colors.layer2, 0.8, 120, 10) },
            { speed: 0.6, render: (ctx, x) => this.drawForeLayer(ctx, x, this.colors.layer3, 1.0, 50, 8) },
            { speed: 0.0, render: this.drawFog.bind(this) }
        ];

        // Génération procédurale des éléments
        this.elements = {
            layer1: this.generateSpookyTrees(40, 400),
            layer2: this.generateSwampVegetation(60, 250),
            layer3: this.generateDetailedProps(30, 600)
        };
    }

    generateSpookyTrees(count, spacing) {
        const trees = [];
        for (let i = 0; i < 100; i++) {
            trees.push({
                x: i * spacing + Math.random() * (spacing / 2),
                height: 300 + Math.random() * 400,
                lean: (Math.random() - 0.5) * 100,
                branches: Math.floor(Math.random() * 4) + 2,
                type: Math.floor(Math.random() * 5)
            });
        }
        return trees;
    }

    generateSwampVegetation(count, spacing) {
        const bushes = [];
        for (let i = 0; i < 150; i++) {
            bushes.push({
                x: i * spacing + Math.random() * spacing,
                scale: 0.5 + Math.random() * 1.5,
                type: Math.floor(Math.random() * 8) 
            });
        }
        return bushes;
    }

    generateDetailedProps(count, spacing) {
        const props = [];
        for (let i = 0; i < 80; i++) {
            props.push({
                x: i * spacing + Math.random() * spacing,
                type: Math.floor(Math.random() * 8), // 8 styles comme demandé
                scale: 0.8 + Math.random() * 0.4
            });
        }
        return props;
    }

    update(cameraX) {
        this.cameraX = cameraX;
    }

    draw(ctx) {
        this.layers.forEach(layer => {
            ctx.save();
            const parallaxX = -(this.cameraX * layer.speed) % 5000; 
            
            // Rendu infini (boucle)
            ctx.translate(parallaxX, 0);
            layer.render(ctx, this.cameraX * layer.speed);
            ctx.translate(5000, 0); 
            layer.render(ctx, this.cameraX * layer.speed - 5000);
            
            ctx.restore();
        });
    }

    drawSky(ctx) {
        const gradient = ctx.createLinearGradient(0, 0, 0, this.height);
        gradient.addColorStop(0, this.colors.skyTop);
        gradient.addColorStop(1, this.colors.skyBottom);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 5000, this.height);
        
        // Lune / Soleil malade
        ctx.fillStyle = "rgba(200, 220, 180, 0.15)";
        ctx.beginPath();
        ctx.arc(300, 150, 80, 0, Math.PI * 2);
        ctx.fill();
    }

    drawFog(ctx) {
        const gradient = ctx.createLinearGradient(0, this.height - 300, 0, this.height);
        gradient.addColorStop(0, "rgba(44, 62, 80, 0)");
        gradient.addColorStop(1, this.colors.fog);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, this.height - 300, 5000, 300);
    }

    // Couche 1 : Arbres tordus en silhouette (Loin)
    drawSilhouetteLayer(ctx, offsetX, color, scale, yOffset, variants) {
        ctx.fillStyle = color;
        this.elements.layer1.forEach(tree => {
            const x = tree.x;
            if (x > offsetX - 500 && x < offsetX + this.width + 500) {
                this._drawTwistedTree(ctx, x, this.height - yOffset, tree);
            }
        });
        // Sol de fond
        ctx.fillRect(0, this.height - yOffset + 20, 5000, 200);
    }

    // Couche 2 : Végétation marécageuse (Milieu)
    drawSwampLayer(ctx, offsetX, color, scale, yOffset, variants) {
        ctx.fillStyle = color;
        this.elements.layer2.forEach(bush => {
            const x = bush.x;
            if (x > offsetX - 500 && x < offsetX + this.width + 500) {
                this._drawOrganicBush(ctx, x, this.height - yOffset, bush.scale, bush.type);
            }
        });
    }

    // Couche 3 : Détails (Proche)
    drawForeLayer(ctx, offsetX, color, scale, yOffset, variants) {
        ctx.fillStyle = color;
        this.elements.layer3.forEach(prop => {
            const x = prop.x;
            if (x > offsetX - 500 && x < offsetX + this.width + 500) {
                this._drawSwampProp(ctx, x, this.height - yOffset, prop.scale, prop.type);
            }
        });
    }

    // --- PRIMITIVES DE DESSIN ORGANIQUE (Style Vectoriel Courbe) ---

    _drawTwistedTree(ctx, x, y, tree) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.beginPath();
        // Tronc courbé
        ctx.moveTo(-15, 0);
        ctx.quadraticCurveTo(tree.lean/2, -tree.height/2, tree.lean, -tree.height); // Coté gauche
        ctx.lineTo(tree.lean + 10, -tree.height); // Sommet
        ctx.quadraticCurveTo(tree.lean/2 + 10, -tree.height/2, 15, 0); // Coté droit
        ctx.fill();

        // Branches
        for(let i=0; i<tree.branches; i++) {
            const h = -tree.height * (0.3 + i * 0.2);
            const w = 40 + i * 20;
            const dir = i % 2 === 0 ? 1 : -1;
            
            ctx.beginPath();
            ctx.moveTo(0, h);
            ctx.quadraticCurveTo(dir * w * 0.5, h + 20, dir * w, h - 10);
            ctx.lineTo(dir * w, h - 15);
            ctx.quadraticCurveTo(dir * w * 0.5, h + 10, 0, h - 10);
            ctx.fill();
            
            // "Mousse" qui pend
            if (Math.random() > 0.5) {
                ctx.beginPath();
                ctx.moveTo(dir * w * 0.8, h - 5);
                ctx.quadraticCurveTo(dir * w * 0.8 + 5, h + 20, dir * w * 0.8, h + 40);
                ctx.quadraticCurveTo(dir * w * 0.8 - 5, h + 20, dir * w * 0.8, h - 5);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    _drawOrganicBush(ctx, x, y, scale, type) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        ctx.beginPath();
        // Style "Blob" organique
        switch(type % 4) {
            case 0: // Buisson rond
                ctx.arc(0, -20, 20, 0, Math.PI*2);
                ctx.arc(-15, -10, 15, 0, Math.PI*2);
                ctx.arc(15, -10, 15, 0, Math.PI*2);
                break;
            case 1: // Herbes hautes
                ctx.moveTo(-10, 0);
                ctx.quadraticCurveTo(-15, -30, -20, -50);
                ctx.lineTo(-15, -50);
                ctx.quadraticCurveTo(-10, -30, 0, 0);
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(5, -40, 10, -60);
                ctx.lineTo(15, -60);
                ctx.quadraticCurveTo(10, -40, 10, 0);
                break;
            case 2: // Champignon géant
                ctx.moveTo(-5, 0);
                ctx.lineTo(-5, -30);
                ctx.quadraticCurveTo(-20, -25, -20, -40);
                ctx.quadraticCurveTo(0, -55, 20, -40);
                ctx.quadraticCurveTo(20, -25, 5, -30);
                ctx.lineTo(5, 0);
                break;
            case 3: // Fougère stylisée
                for(let i=-2; i<=2; i++) {
                    ctx.moveTo(0, 0);
                    ctx.quadraticCurveTo(i*10, -20, i*15, -40);
                    ctx.quadraticCurveTo(i*10, -25, 0, 0);
                }
                break;
        }
        ctx.fill();
        ctx.restore();
    }

    _drawSwampProp(ctx, x, y, scale, type) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(scale, scale);
        
        // 8 Styles différents demandés
        switch(type) {
            case 0: // Vieille souche
                ctx.beginPath();
                ctx.moveTo(-15, 0);
                ctx.lineTo(-10, -20);
                ctx.lineTo(-15, -30); // Branche cassée G
                ctx.lineTo(-5, -25);
                ctx.lineTo(5, -25);
                ctx.lineTo(15, -35); // Branche cassée D
                ctx.lineTo(10, -20);
                ctx.lineTo(15, 0);
                ctx.fill();
                break;
            case 1: // Rocher moussu rond
                ctx.beginPath();
                ctx.moveTo(-20, 0);
                ctx.bezierCurveTo(-20, -30, 20, -30, 20, 0);
                ctx.fill();
                // Détail mousse
                ctx.fillStyle = "rgba(0,0,0,0.2)";
                ctx.beginPath();
                ctx.arc(-5, -15, 5, 0, Math.PI*2);
                ctx.fill();
                ctx.fillStyle = ctx.fillStyle; // Restore color
                break;
            case 2: // Plante carnivore (silhouette)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(10, -20, 0, -40);
                ctx.arc(0, -45, 10, 0.2, Math.PI - 0.2); // Tête
                ctx.fill();
                break;
            case 3: // Totem / Ruine
                ctx.fillRect(-10, -40, 20, 40);
                ctx.fillRect(-15, -35, 30, 5);
                ctx.fillRect(-12, -15, 24, 5);
                break;
            case 4: // Grand arbre mort
                ctx.beginPath();
                ctx.moveTo(-8, 0);
                ctx.lineTo(-5, -80);
                ctx.lineTo(-20, -100);
                ctx.lineTo(-15, -85);
                ctx.lineTo(0, -120);
                ctx.lineTo(15, -85);
                ctx.lineTo(20, -100);
                ctx.lineTo(5, -80);
                ctx.lineTo(8, 0);
                ctx.fill();
                break;
            case 5: // Lianes pendantes (illusion sol)
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.quadraticCurveTo(-10, -50, 0, -100);
                ctx.lineTo(5, -100);
                ctx.quadraticCurveTo(-5, -50, 5, 0);
                ctx.fill();
                break;
            case 6: // Buisson épineux
                ctx.beginPath();
                for(let i=0; i<5; i++) {
                    ctx.moveTo(0,0);
                    const ang = -Math.PI/2 + (i-2)*0.5;
                    ctx.lineTo(Math.cos(ang)*30, Math.sin(ang)*30);
                    ctx.lineTo(Math.cos(ang+0.2)*10, Math.sin(ang+0.2)*10);
                }
                ctx.fill();
                break;
            case 7: // Tas de cailloux
                ctx.beginPath();
                ctx.arc(-10, 0, 8, 0, Math.PI*2);
                ctx.arc(10, 0, 10, 0, Math.PI*2);
                ctx.arc(0, -10, 6, 0, Math.PI*2);
                ctx.fill();
                break;
        }
        ctx.restore();
    }
}