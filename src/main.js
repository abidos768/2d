// Created: Phaser bootstrap with mobile-friendly scale and scenes.
import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene';
import { PreloadScene } from './scenes/PreloadScene';
import { GameScene } from './scenes/GameScene';
const GAME_WIDTH = 540;
const GAME_HEIGHT = 960;
const config = {
    type: Phaser.AUTO,
    parent: 'game-root',
    backgroundColor: '#111111',
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { x: 0, y: 0 },
            debug: false,
        },
    },
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        expandParent: true,
    },
    scene: [BootScene, PreloadScene, GameScene],
};
// eslint-disable-next-line no-new
new Phaser.Game(config);
