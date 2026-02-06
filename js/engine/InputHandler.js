export class InputHandler {
    constructor(canvas) {
        this.keys = [];
        this.mouse = { x: 0, y: 0, pressed: false, click: false };

        window.addEventListener('keydown', e => {
            const validKeys = [
                'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
                'KeyW', 'KeyA', 'KeyS', 'KeyD',
                'Space', 'KeyE', 'KeyF', 'KeyP', 'KeyU',
                'Digit1', 'Digit2', 'Digit3', 'Digit4', 
                'Digit5', 'Digit6', 'Digit7', 'Digit8'
            ];
            
            if (validKeys.includes(e.code) && this.keys.indexOf(e.code) === -1) {
                this.keys.push(e.code);
            }
        });

        window.addEventListener('keyup', e => {
            const index = this.keys.indexOf(e.code);
            if (index > -1) this.keys.splice(index, 1);
        });

        canvas.addEventListener('mousemove', e => {
            const rect = canvas.getBoundingClientRect();
            const scaleX = canvas.width / rect.width;
            const scaleY = canvas.height / rect.height;
            this.mouse.x = (e.clientX - rect.left) * scaleX;
            this.mouse.y = (e.clientY - rect.top) * scaleY;
        });

        canvas.addEventListener('mousedown', () => { 
            this.mouse.pressed = true; 
            this.mouse.click = true; 
        });
        
        window.addEventListener('mouseup', () => { this.mouse.pressed = false; });
    }

    isPressed(keyCode) {
        return this.keys.indexOf(keyCode) !== -1;
    }

    getClick() {
        if (this.mouse.click) {
            this.mouse.click = false;
            return true;
        }
        return false;
    }
}