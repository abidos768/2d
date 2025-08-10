// Created: Preload scene generating simple textures for player and toppings.
import Phaser from 'phaser';
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload');
    }
    preload() {
        this.createRectangleTexture('player-plate', 100, 26, 0xffffff, 0x333333);
        this.createCircleTexture('topping-tomato', 16, 0xd23b3b);
        this.createCircleTexture('topping-cheese', 16, 0xf7e34e);
        this.createCircleTexture('topping-pepperoni', 16, 0x8e2f2f);
        this.createCircleTexture('topping-mushrooms', 16, 0xb0a38f);
        this.createCircleTexture('topping-boots', 16, 0x333333);
        this.createCircleTexture('topping-trash', 16, 0x666666);
        this.createCircleTexture('topping-pineapple', 16, 0xe3c225);
    }
    create() {
        this.scene.start('Game');
    }
    createCircleTexture(key, radius, fillColor) {
        const size = radius * 2;
        const g = this.add.graphics({});
        g.fillStyle(fillColor, 1);
        g.fillCircle(radius, radius, radius);
        g.generateTexture(key, size, size);
        g.destroy();
    }
    createRectangleTexture(key, width, height, fillColor, outlineColor) {
        const g = this.add.graphics({});
        g.fillStyle(fillColor, 1);
        g.fillRoundedRect(0, 0, width, height, 8);
        g.lineStyle(2, outlineColor, 1);
        g.strokeRoundedRect(0, 0, width, height, 8);
        g.generateTexture(key, width, height);
        g.destroy();
    }
}
