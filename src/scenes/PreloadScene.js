// Updated: Added spritesheet loader (public/assets/toppings.png), frame mapping, and fallback placeholder textures.
import Phaser from 'phaser';
// Frame mapping for a 3x2 grid (rows x cols):
// 0: pineapple | 1: trash | 2: pizza | 3: mushrooms | 4: tomato | 5: boots
export const TOPPING_FRAMES = {
    pineapple: 0,
    trash: 1,
    pizza: 2,
    mushrooms: 3,
    tomato: 4,
    boots: 5,
};
export class PreloadScene extends Phaser.Scene {
    constructor() {
        super('Preload');
    }
    preload() {
        this.createRectangleTexture('player-plate', 100, 26, 0xffffff, 0x333333);
        // Attempt to load the real toppings spritesheet from public/assets.
        // Expected layout: 3 rows x 2 cols, frames 384x384 each.
        this.load.spritesheet('toppings', 'assets/toppings.png', { frameWidth: 384, frameHeight: 384 });
        // Fallback placeholder textures (used if spritesheet is missing):
        this.createCircleTexture('topping-tomato', 16, 0xd23b3b);
        this.createCircleTexture('topping-pizza', 16, 0xf6b84f);
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
