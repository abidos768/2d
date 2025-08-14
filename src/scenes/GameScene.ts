// Created: Mobile-first game scene (portrait), basic loop: move, spawn, catch, score, timer.
import Phaser from 'phaser'
import type { ToppingName } from './PreloadScene'
import { TOPPING_FRAMES } from './PreloadScene'

type GoodTopping = 'tomato' | 'pizza' | 'mushrooms'
type BadTopping = 'boots' | 'trash' | 'pineapple'

const GOOD_TOPPINGS: GoodTopping[] = ['tomato', 'pizza', 'mushrooms']
const BAD_TOPPINGS: BadTopping[] = ['boots', 'trash'] // pineapple optional/evil mode

interface ToppingSprite extends Phaser.Physics.Arcade.Image {
  toppingName: ToppingName
  isGood: boolean
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private toppings!: Phaser.Physics.Arcade.Group

  private score = 0
  private scoreText!: Phaser.GameObjects.Text

  private timeRemaining = 60 // seconds
  private timerText!: Phaser.GameObjects.Text
  private timerEvent?: Phaser.Time.TimerEvent

  private requiredOrder: GoodTopping[] = []
  private collectedSet = new Set<GoodTopping>()
  private orderText!: Phaser.GameObjects.Text & { orderSprites?: Phaser.GameObjects.GameObject[] }

  private fallSpeed = 200
  private spawnIntervalMs = 1200
  private spawnEvent?: Phaser.Time.TimerEvent

  private evilMode = false // set true to allow pineapple

  constructor() {
    super('Game')
  }

  create(): void {
    const { width, height } = this.scale

    // Player plate
    this.player = this.physics.add.image(width * 0.5, height - 50, 'player-plate')
    this.player.setImmovable(true)
    this.player.setCollideWorldBounds(true)

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      this.player.x = Phaser.Math.Clamp(p.worldX, this.player.width * 0.5, width - this.player.width * 0.5)
    })

    // UI
    this.scoreText = this.add.text(width - 16, 12, 'Score: 0', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(1, 0)
    this.timerText = this.add.text(width * 0.5, 12, '60s', { fontFamily: 'monospace', fontSize: '20px', color: '#ffffff' }).setOrigin(0.5, 0)
    this.orderText = this.add.text(16, 12, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }) as Phaser.GameObjects.Text & { orderSprites?: Phaser.GameObjects.GameObject[] };
    this.orderText.orderSprites = [];

    // Groups
    this.toppings = this.physics.add.group({ runChildUpdate: false })

    // Overlap
    this.physics.add.overlap(this.player, this.toppings, (_player, obj) => this.onCatch(obj as ToppingSprite))

    // Order + timers
    this.generateNewOrder()
    this.startSpawning()
    this.startTimer()
  }

  update(): void {
    const speedX = 380
    let vx = 0
    if (this.cursors.left?.isDown || this.input.keyboard!.addKey('A').isDown) vx = -speedX
    if (this.cursors.right?.isDown || this.input.keyboard!.addKey('D').isDown) vx = speedX
    this.player.setVelocityX(vx)
  }

  private onCatch(obj: ToppingSprite): void {
    if (!obj.active) return
    obj.disableBody(true, true)
    obj.destroy()

    if (obj.isGood && this.requiredOrder.includes(obj.toppingName as GoodTopping)) {
      const name = obj.toppingName as GoodTopping
      if (!this.collectedSet.has(name)) {
        this.collectedSet.add(name)
        this.score += 10
        this.scoreText.setText(`Score: ${this.score}`)
        this.refreshOrderText()
        if (this.collectedSet.size === this.requiredOrder.length) {
          this.score += 50
          this.scoreText.setText(`Score: ${this.score}`)
          this.difficultyUp()
          this.generateNewOrder()
        }
      }
    } else {
      // Penalty: −5 seconds
      this.timeRemaining = Math.max(0, this.timeRemaining - 5)
      this.timerText.setText(`${this.timeRemaining}s`)
      this.cameras.main.shake(120, 0.005)
      if (this.timeRemaining <= 0) {
        this.gameOver()
      }
    }
  }

  private startSpawning(): void {
    this.spawnEvent?.remove(false)
    this.spawnEvent = this.time.addEvent({ delay: this.spawnIntervalMs, loop: true, callback: () => this.spawnTopping() })
  }

  private spawnTopping(): void {
    const { width } = this.scale

    const spawnGood = Math.random() < (this.evilMode ? 0.7 : 0.8)
    const name = spawnGood ? Phaser.Utils.Array.GetRandom(GOOD_TOPPINGS) : Phaser.Utils.Array.GetRandom(this.getBadPool())

    const x = Phaser.Math.Between(32, width - 32)
    const y = -32
    const hasSheet = this.textures.exists('toppings')
    const sprite = hasSheet
      ? (this.toppings.create(x, y, 'toppings', TOPPING_FRAMES[name as ToppingName]) as ToppingSprite)
      : (this.toppings.create(x, y, `topping-${name}`) as ToppingSprite)
    sprite.toppingName = name
    sprite.isGood = spawnGood
    sprite.setVelocityY(this.fallSpeed * Phaser.Math.FloatBetween(0.9, 1.15))
    // Collider sized for 32px placeholder or scaled sheet frames
    if (hasSheet) {
      // Scale down large frames to ~48px visual size
      const targetSize = 48
      const scale = targetSize / 384
      sprite.setScale(scale)
      sprite.setCircle((targetSize / 2) * 0.85)
    } else {
      sprite.setCircle(16)
    }
    sprite.setImmovable(false)
    sprite.setCollideWorldBounds(false)
    // Clean up when off screen
    sprite.setData('cleanup', true)
    sprite.once('outofbounds', () => sprite.destroy())
  }

  private startTimer(): void {
    this.timerEvent?.remove(false)
    this.timerEvent = this.time.addEvent({ delay: 1000, loop: true, callback: () => {
      this.timeRemaining -= 1
      this.timerText.setText(`${this.timeRemaining}s`)
      if (this.timeRemaining <= 0) this.gameOver()
    } })
  }

  private gameOver(): void {
    // Stop all game mechanics
    this.spawnEvent?.remove(false)
    this.timerEvent?.remove(false)
    this.toppings.clear(true, true)
    
    const { width, height } = this.scale
    
    // Add semi-transparent overlay
    const overlay = this.add.rectangle(width * 0.5, height * 0.5, width, height, 0x000000, 0.7)
    
    // Add game over text
    const gameOverText = this.add.text(width * 0.5, height * 0.4, 'GAME OVER', {
      fontFamily: 'Arial',
      fontSize: '48px',
      color: '#ff3333',
      fontStyle: 'bold',
      stroke: '#ffffff',
      strokeThickness: 4
    }).setOrigin(0.5)
    
    // Add score display
    const scoreText = this.add.text(width * 0.5, height * 0.5, `Score: ${this.score}`, {
      fontFamily: 'Arial',
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Add restart button
    const button = this.add.rectangle(width * 0.5, height * 0.65, 200, 50, 0x4CAF50)
      .setInteractive()
      .on('pointerover', () => button.setFillStyle(0x66BB6A))
      .on('pointerout', () => button.setFillStyle(0x4CAF50))
      .on('pointerdown', () => this.scene.restart())
    
    const buttonText = this.add.text(width * 0.5, height * 0.65, 'PLAY AGAIN', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
    
    // Add keyboard restart
    this.input.keyboard?.once('keydown-ENTER', () => this.scene.restart())
    this.input.keyboard?.once('keydown-SPACE', () => this.scene.restart())
    
    // Store UI elements for cleanup
    const gameOverUI = [overlay, gameOverText, scoreText, button, buttonText]
    gameOverUI.forEach(item => item.setScrollFactor(0))
    
    // Add to orderText for cleanup
    const orderText = this.orderText as any
    if (orderText.orderSprites) {
      orderText.orderSprites = [...orderText.orderSprites, ...gameOverUI]
    }
  }

  private generateNewOrder(): void {
    this.collectedSet.clear()
    const orderSize = Phaser.Math.Between(3, 5)
    this.requiredOrder = Phaser.Utils.Array.Shuffle([...GOOD_TOPPINGS]).slice(0, orderSize)
    this.refreshOrderText()
  }

  private refreshOrderText(): void {
    // Clear previous order display
    const orderText = this.orderText as any;
    if (orderText.orderSprites) {
      orderText.orderSprites.forEach((sprite: Phaser.GameObjects.GameObject) => sprite.destroy());
    }
    orderText.orderSprites = [];

    // Create order title
    const title = this.add.text(16, 16, 'Order:', { 
      fontFamily: 'Arial', 
      fontSize: '20px', 
      color: '#ffffff',
      fontStyle: 'bold'
    });
    orderText.orderSprites.push(title);

    // Create order items with sprites and text
    this.requiredOrder.forEach((n, index) => {
      const isCollected = this.collectedSet.has(n);
      const yPos = 50 + (index * 30);
      
      // Create sprite for the topping
      const hasSheet = this.textures.exists('toppings');
      const sprite = this.add.image(30, yPos + 12, hasSheet ? 'toppings' : `topping-${n}`, hasSheet ? TOPPING_FRAMES[n] : undefined);
      const targetSize = 20;
      const scale = hasSheet ? targetSize / 384 : 0.6;
      sprite.setScale(scale);
      orderText.orderSprites.push(sprite);
      
      // Create text with checkmark
      const text = this.add.text(50, yPos, `${isCollected ? '✓ ' : ''}${n}`, { 
        fontFamily: 'Arial', 
        fontSize: '18px', 
        color: isCollected ? '#88ff88' : '#ffffff'
      });
      orderText.orderSprites.push(text);
    });
  }

  private difficultyUp(): void {
    this.fallSpeed = Math.min(600, Math.floor(this.fallSpeed * 1.12))
    this.spawnIntervalMs = Math.max(450, this.spawnIntervalMs - 100)
    this.startSpawning()
  }

  private getBadPool(): BadTopping[] {
    return this.evilMode ? (['boots', 'trash', 'pineapple'] as BadTopping[]) : BAD_TOPPINGS
  }
}


