// Created: Mobile-first game scene (portrait), basic loop: move, spawn, catch, score, timer.
import Phaser from 'phaser';
import { TOPPING_FRAMES } from './PreloadScene';
const GOOD_TOPPINGS = ['tomato', 'pizza', 'mushrooms'];
const BAD_TOPPINGS = ['boots', 'trash']; // pineapple optional/evil mode
export class GameScene extends Phaser.Scene {
    constructor() {
        super('Game');
        Object.defineProperty(this, "player", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "cursors", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "toppings", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "score", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 0
        });
        Object.defineProperty(this, "scoreText", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timeRemaining", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 60
        }); // seconds
        Object.defineProperty(this, "timerText", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "timerEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "requiredOrder", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: []
        });
        Object.defineProperty(this, "collectedSet", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: new Set()
        });
        Object.defineProperty(this, "orderText", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "fallSpeed", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 200
        });
        Object.defineProperty(this, "spawnIntervalMs", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: 1200
        });
        Object.defineProperty(this, "spawnEvent", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: void 0
        });
        Object.defineProperty(this, "evilMode", {
            enumerable: true,
            configurable: true,
            writable: true,
            value: false
        }); // set true to allow pineapple
    }
    create() {
        const { width, height } = this.scale;
        // Player plate
        this.player = this.physics.add.image(width * 0.5, height - 50, 'player-plate');
        this.player.setImmovable(true);
        this.player.setCollideWorldBounds(true);
        // Input
        this.cursors = this.input.keyboard.createCursorKeys();
        this.input.on('pointermove', (p) => {
            this.player.x = Phaser.Math.Clamp(p.worldX, this.player.width * 0.5, width - this.player.width * 0.5);
        });
        // UI
        this.scoreText = this.add.text(width - 16, 12, 'Score: 0', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(1, 0);
        this.timerText = this.add.text(width * 0.5, 12, '60s', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5, 0);
        this.orderText = this.add.text(16, 12, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' });
        this.orderText.orderSprites = [];
        // Groups
        this.toppings = this.physics.add.group({ runChildUpdate: false });
        // Overlap
        this.physics.add.overlap(this.player, this.toppings, (_player, obj) => this.onCatch(obj));
        // Order + timers
        this.generateNewOrder();
        this.startSpawning();
        this.startTimer();
    }
    update() {
        const speedX = 380;
        let vx = 0;
        if (this.cursors.left?.isDown || this.input.keyboard.addKey('A').isDown)
            vx = -speedX;
        if (this.cursors.right?.isDown || this.input.keyboard.addKey('D').isDown)
            vx = speedX;
        this.player.setVelocityX(vx);
    }
    onCatch(obj) {
        if (!obj.active)
            return;
        obj.disableBody(true, true);
        obj.destroy();
        if (obj.isGood && this.requiredOrder.includes(obj.toppingName)) {
            const name = obj.toppingName;
            if (!this.collectedSet.has(name)) {
                this.collectedSet.add(name);
                this.score += 10;
                this.scoreText.setText(`Score: ${this.score}`);
                this.refreshOrderText();
                if (this.collectedSet.size === this.requiredOrder.length) {
                    this.score += 50;
                    this.scoreText.setText(`Score: ${this.score}`);
                    this.difficultyUp();
                    this.generateNewOrder();
                }
            }
        }
        else {
            // Penalty: −5 seconds
            this.timeRemaining = Math.max(0, this.timeRemaining - 5);
            this.timerText.setText(`${this.timeRemaining}s`);
            this.cameras.main.shake(120, 0.005);
            if (this.timeRemaining <= 0) {
                this.gameOver();
            }
        }
    }
    startSpawning() {
        this.spawnEvent?.remove(false);
        this.spawnEvent = this.time.addEvent({ delay: this.spawnIntervalMs, loop: true, callback: () => this.spawnTopping() });
    }
    spawnTopping() {
        const { width } = this.scale;
        const spawnGood = Math.random() < (this.evilMode ? 0.7 : 0.8);
        const name = spawnGood ? Phaser.Utils.Array.GetRandom(GOOD_TOPPINGS) : Phaser.Utils.Array.GetRandom(this.getBadPool());
        const x = Phaser.Math.Between(32, width - 32);
        const y = -32;
        const hasSheet = this.textures.exists('toppings');
        const sprite = hasSheet
            ? this.toppings.create(x, y, 'toppings', TOPPING_FRAMES[name])
            : this.toppings.create(x, y, `topping-${name}`);
        sprite.toppingName = name;
        sprite.isGood = spawnGood;
        sprite.setVelocityY(this.fallSpeed * Phaser.Math.FloatBetween(0.9, 1.15));
        // Collider sized for 32px placeholder or scaled sheet frames
        if (hasSheet) {
            // Scale down large frames to ~48px visual size
            const targetSize = 48;
            const scale = targetSize / 384;
            sprite.setScale(scale);
            sprite.setCircle((targetSize / 2) * 0.85);
        }
        else {
            sprite.setCircle(16);
        }
        sprite.setImmovable(false);
        sprite.setCollideWorldBounds(false);
        // Clean up when off screen
        sprite.setData('cleanup', true);
        sprite.once('outofbounds', () => sprite.destroy());
    }
    startTimer() {
        this.timerEvent?.remove(false);
        this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
                this.timeRemaining -= 1;
                this.timerText.setText(`${this.timeRemaining}s`);
                if (this.timeRemaining <= 0)
                    this.gameOver();
            } });
    }
    gameOver() {
        // Stop all game mechanics
        this.spawnEvent?.remove(false);
        this.timerEvent?.remove(false);
        this.toppings.clear(true, true);
        const { width, height } = this.scale;
        // Add semi-transparent overlay
        const overlay = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0.7);
        // Add game over text
        const gameOverText = this.add.text(width * 0.5, height * 0.4, 'GAME OVER', {
            fontFamily: 'Arial',
            fontSize: '48px',
            color: '#ff3333',
            fontStyle: 'bold',
            stroke: '#ffffff',
            strokeThickness: 4
        }).setOrigin(0.5);
        // Add score display
        const scoreText = this.add.text(width * 0.5, height * 0.5, `Score: ${this.score}`, {
            fontFamily: 'Arial',
            fontSize: '32px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        // Add restart button
        const button = this.add.rectangle(width * 0.5, height * 0.65, 200, 50, 0x4CAF50)
            .setInteractive()
            .on('pointerover', () => button.setFillStyle(0x66BB6A))
            .on('pointerout', () => button.setFillStyle(0x4CAF50))
            .on('pointerdown', () => this.scene.restart());
        const buttonText = this.add.text(width * 0.5, height * 0.65, 'PLAY AGAIN', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        }).setOrigin(0.5);
        // Add keyboard restart
        this.input.keyboard?.once('keydown-ENTER', () => this.scene.restart());
        this.input.keyboard?.once('keydown-SPACE', () => this.scene.restart());
        // Store UI elements for cleanup
        const gameOverUI = [overlay, gameOverText, scoreText, button, buttonText];
        gameOverUI.forEach(item => item.setScrollFactor(0));
        // Add to orderText for cleanup
        const orderText = this.orderText;
        if (orderText.orderSprites) {
            orderText.orderSprites = [...orderText.orderSprites, ...gameOverUI];
        }
    }
    generateNewOrder() {
        this.collectedSet.clear();
        const orderSize = Phaser.Math.Between(3, 5);
        this.requiredOrder = Phaser.Utils.Array.Shuffle([...GOOD_TOPPINGS]).slice(0, orderSize);
        this.refreshOrderText();
    }
    refreshOrderText() {
        // Clear previous order display
        const orderText = this.orderText;
        if (orderText.orderSprites) {
            orderText.orderSprites.forEach((sprite) => sprite.destroy());
        }
        orderText.orderSprites = [];
        // Create background panel
        const panel = this.add.rectangle(120, 100, 200, 220, 0x000000, 0.7)
            .setStrokeStyle(2, 0xffffff, 1);
        orderText.orderSprites.push(panel);
        // Add order title with icon
        const title = this.add.text(30, 10, '🍕 ORDER', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#ffffff',
            fontStyle: 'bold'
        });
        orderText.orderSprites.push(title);
        // Create order items with sprites and text
        this.requiredOrder.forEach((n, index) => {
            const isCollected = this.collectedSet.has(n);
            const yPos = 50 + (index * 40);
            // Create background for each order item
            const itemBg = this.add.rectangle(120, yPos, 180, 30, isCollected ? 0x334422 : 0x222233, 0.9)
                .setStrokeStyle(1, isCollected ? 0x88ff88 : 0x6666ff, 1);
            orderText.orderSprites.push(itemBg);
            // Create sprite for the topping
            const hasSheet = this.textures.exists('toppings');
            const sprite = this.add.image(40, yPos, hasSheet ? 'toppings' : `topping-${n}`, hasSheet ? TOPPING_FRAMES[n] : undefined);
            const targetSize = 24;
            const scale = hasSheet ? targetSize / 384 : 0.7;
            sprite.setScale(scale);
            orderText.orderSprites.push(sprite);
            // Create text with checkmark
            const text = this.add.text(60, yPos - 10, `${isCollected ? '✓ ' : ''}${n.toUpperCase()}`, {
                fontFamily: 'Arial',
                fontSize: '16px',
                color: isCollected ? '#88ff88' : '#ffffff',
                fontStyle: isCollected ? 'bold' : 'normal'
            });
            orderText.orderSprites.push(text);
            // Add progress indicator
            if (isCollected) {
                const check = this.add.text(25, yPos - 8, '✓', {
                    fontFamily: 'Arial',
                    fontSize: '20px',
                    color: '#88ff88'
                });
                orderText.orderSprites.push(check);
            }
        });
    }
    difficultyUp() {
        this.fallSpeed = Math.min(600, Math.floor(this.fallSpeed * 1.12));
        this.spawnIntervalMs = Math.max(450, this.spawnIntervalMs - 100);
        this.startSpawning();
    }
    getBadPool() {
        return this.evilMode ? ['boots', 'trash', 'pineapple'] : BAD_TOPPINGS;
    }
}
