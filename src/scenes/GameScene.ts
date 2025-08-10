// Created: Mobile-first game scene (portrait), basic loop: move, spawn, catch, score, timer.
import Phaser from 'phaser'
import type { ToppingName } from './PreloadScene'

type GoodTopping = 'tomato' | 'cheese' | 'pepperoni' | 'mushrooms'
type BadTopping = 'boots' | 'trash' | 'pineapple'

const GOOD_TOPPINGS: GoodTopping[] = ['tomato', 'cheese', 'pepperoni', 'mushrooms']
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
  private orderText!: Phaser.GameObjects.Text

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
    this.orderText = this.add.text(16, 12, '', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff', wordWrap: { width: width * 0.6 } })

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
    const key = `topping-${name}`

    const x = Phaser.Math.Between(32, width - 32)
    const y = -32
    const sprite = this.toppings.create(x, y, key) as ToppingSprite
    sprite.toppingName = name
    sprite.isGood = spawnGood
    sprite.setVelocityY(this.fallSpeed * Phaser.Math.FloatBetween(0.9, 1.15))
    sprite.setCircle(16)
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
    this.spawnEvent?.remove(false)
    this.timerEvent?.remove(false)
    this.toppings.clear(true, true)
    const { width, height } = this.scale
    this.add.text(width * 0.5, height * 0.5, `Game Over\nScore: ${this.score}`, { fontFamily: 'monospace', fontSize: '28px', color: '#ffffff', align: 'center' }).setOrigin(0.5)
  }

  private generateNewOrder(): void {
    this.collectedSet.clear()
    const orderSize = Phaser.Math.Between(3, 5)
    this.requiredOrder = Phaser.Utils.Array.Shuffle([...GOOD_TOPPINGS]).slice(0, orderSize)
    this.refreshOrderText()
  }

  private refreshOrderText(): void {
    const items = this.requiredOrder.map((n) => (this.collectedSet.has(n) ? `[x] ${n}` : `[ ] ${n}`))
    this.orderText.setText(`Order:\n${items.join('\n')}`)
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


