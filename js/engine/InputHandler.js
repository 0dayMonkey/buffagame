export class InputHandler {
    constructor(canvas) {
        this.keys = [];
        this.mouse = { x: 0, y: 0, pressed: false };

        window.addEventListener('keydown', e => {
            if ((e.code === 'ArrowUp' || 
                 e.code === 'ArrowDown' || 
                 e.code === 'ArrowLeft' || 
                 e.code === 'ArrowRight' || 
                 e.code === 'KeyW' || 
                 e.code === 'KeyA' || 
                 e.code === 'KeyS' || 
                 e.code === 'KeyD' || 
                 e.code === 'Space' || 
                 e.code === 'KeyE' || 
                 e.code === 'KeyF') // AJOUT DE LA TOUCHE F
                 && this.keys.indexOf(e.code) === -1) {
                this.keys.push(e.code);
            }
        });

        window.addEventListener('keyup', e => {
            const index = this.keys.indexOf(e.code);
            if (index > -1) this.keys.splice(index, 1);
        });

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });

        canvas.addEventListener('mousedown', () => { this.mouse.pressed = true; });
        window.addEventListener('mouseup', () => { this.mouse.pressed = false; });
    }

    isPressed(keyCode) {
        return this.keys.indexOf(keyCode) !== -1;
    }
}