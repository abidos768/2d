<!-- Created: Added asset drop instructions for toppings spritesheet. -->

Place your toppings spritesheet here as `toppings.png`.

Defaults expected by the game:
- Grid: 3 rows × 2 columns (any total size)
- Frame size: 384×384 per cell (adjust in `src/scenes/PreloadScene.ts` if different)
- Frame order:
  0 pineapple
  1 trash
  2 pizza
  3 mushrooms
  4 tomato
  5 boots

If you change frame size, update:
`this.load.spritesheet('toppings', 'assets/toppings.png', { frameWidth: 384, frameHeight: 384 })`

