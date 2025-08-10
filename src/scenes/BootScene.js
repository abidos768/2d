// Created: Boot scene to set up basic settings then transition to Preload.
import Phaser from 'phaser';
export class BootScene extends Phaser.Scene {
    constructor() {
        super('Boot');
    }
    create() {
        this.cameras.main.setBackgroundColor('#111111');
        this.scene.start('Preload');
    }
}
