import { Game } from './engine/Game.js';

window.addEventListener('load', () => {
    const game = new Game('gameCanvas');
    game.start();
});