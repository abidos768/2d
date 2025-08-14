# Pixel Pizza Panic — Product Requirements Document (PRD)

- **Version**: 1.0 (Draft)
- **Date**: 2025-08-10
- **Owner**: Team (Product + Tech)
- **Platforms**: Web (desktop browsers) first; Desktop export later
- **Engine**: Phaser 3.60+ (recommended)

## 1) Overview
- **Game Type**: 2D casual arcade, single-screen, session-based
- **Core Loop**: Move → Catch correct toppings → Complete orders → Difficulty increases → Chase high score before time/lives run out
- **Player Fantasy**: Speedy pizzaiolo completing chaotic orders under pressure
- **Success Criteria**: 60 FPS responsive controls, 5–10 minute replayable sessions, simple but juicy feedback

## 2) Goals & KPIs
- **Primary Goals**: fast-to-learn gameplay, snappy feel, readable UI, low friction
- **Session Length**: 3–6 minutes target; >60% players complete at least 2 orders per session
- **Performance**: 60 FPS on mid-tier laptops, <2s first interactive on repeat loads

## 3) Core Gameplay
- Player moves horizontally at the bottom of the screen
- Toppings fall from the top at random x positions
- Current pizza order lists 3–5 toppings (any order)
- Catching a required topping progresses the order
- Catching a wrong topping applies a penalty (time or life)
- Game ends when timer hits 0 (Timer Mode) or lives reach 0 (Lives Mode)

## 4) Systems Design

### 4.1 Player Controls
- **Input**: Arrow Left/Right or A/D; optional mobile later
- **Movement**: constant-velocity horizontal movement
  - Base speed: 350 px/s (tunable)
  - Clamp to screen bounds; no vertical movement
- **Feel**: immediate response, no acceleration; easing on stop optional

### 4.2 Falling Objects (Toppings)
- **Spawn cadence**: every 1.2s initially; random jitter ±0.2s
- **Horizontal spawn**: uniform across playfield with padding (≥ 32 px from edges)
- **Vertical speed**: base 200 px/s with ±15% variance; increases with difficulty
- **Despawn**: when off-screen bottom
- **Types**:
  - **Good**: tomato, cheese, pepperoni, mushrooms
  - **Bad**: boots, trash, pineapple (pineapple enabled only in "evil mode")

### 4.3 Orders System
- **Order size**: 3–5 unique toppings drawn from Good list (no duplicates in the same order)
- **Progress rule**: catch any order item in any sequence; duplicates do not add progress
- **Completion**: on collecting all required items, award bonus and generate a new order
- **UI**: icons + labels; highlight collected items

### 4.4 Score, Timer, Lives
- **Score**: +10 per correct topping that is part of the active order
- **Bonus**: +50 on order completion (tunable)
- **Penalty** (choose mode at start; default Timer Mode):
  - Timer Mode: −5 seconds per wrong catch; start at 60s
  - Lives Mode: −1 life per wrong catch; start with 3 lives
- **High Score**: persist best score via localStorage

### 4.5 Difficulty Progression
- **After each completed order**:
  - Fall speed ×1.12 (capped at 600 px/s)
  - Spawn interval −0.1s (floor 0.45s)
- **Optional chaos** (toggleable):
  - After 3 orders: 5s reverse controls chance (10%)
  - After 5 orders: some toppings bounce (elastic on floor once)
  - After 7 orders: 10% chance to spawn two toppings at once

### 4.6 Audio/Visual Feedback
- **SFX**: catch-correct (pleasant), catch-wrong (raspy/buzzer), order-complete (fanfare)
- **VFX**: brief screen shake on penalty; confetti/sparkle on completion
- **Art**: simple pixel art (32×32 for toppings), 48–64px width player+plate

## 5) UI/UX
- **Layout** (reference 800×600 canvas, scalable):
  - Player: bottom center, y ≈ 560
  - Current Order panel: top-left (x≈20,y≈20)
  - Score: top-right
  - Timer/Lives: top-center
- **Readability**: icons with labels; collected items dimmed/checked
- **Accessibility**: color + shape cues for good/bad; flash intensity adjustable
- **Pause**: Esc toggles pause; show controls overlay

## 6) Technical Requirements
- **Engine**: Phaser 3 (Arcade Physics)
- **Rendering**: Canvas/WebGL auto; aim WebGL
- **Physics**: Arcade overlap checks for player↔topping
- **Object Pooling**: reuse topping sprites to minimize GC
- **Timestep**: delta-time movement; frame-rate independent
- **Input**: Keyboard; add Gamepad remap later
- **Build**: Node 20+, Vite, TypeScript recommended
- **Performance targets**: 60 FPS, <3ms update, <6ms render on mid hardware
- **Asset budget**: individual textures ≤ 64 KB; total initial payload ≤ 2 MB
- **Persistence**: localStorage for best score and options

## 7) Content & Assets
- **Player sprite** (idle/move) 48–64px wide; plate visible
- **Toppings (good)**: tomato, cheese, pepperoni, mushrooms (32×32)
- **Toppings (bad)**: boots, trash, pineapple (32×32)
- **UI**: order panel, icons, score/timer digits, pause overlay
- **Audio**: 4–6 SFX; 1 short music loop (optional mute toggle)

## 8) Game Architecture (suggested)
- **Scenes**: Boot → Preload → Game → UI (overlay)
- **Entities**: Player, Topping, OrderManager, Spawner, HUD
- **Data**: `config.json` for tunables; `assets.json` for atlas/maps
- **Systems**:
  - SpawnSystem: schedules, random positions, pooling
  - OrderSystem: generates orders, tracks progress, UI sync
  - ScoreSystem: scoring, combo hooks (future)
  - DifficultySystem: ramps fall speed and spawn rate

## 9) Tuning Parameters (defaults)
- **Canvas**: 800×600 (scale to fit, preserve aspect)
- **Player speed**: 350 px/s
- **Spawn interval**: start 1.2s → min 0.45s (−0.1/order)
- **Fall speed**: start 200 px/s → cap 600 px/s (×1.12/order)
- **Score per correct**: +10; Order bonus: +50
- **Penalty**: −5s (Timer) or −1 life (Lives)
- **Timer start**: 60s; Lives: 3

## 10) Acceptance Criteria
- **Controls**: Input responsive within one frame; no input lag felt
- **Collision**: Catch registers once per topping; no multi-count bugs
- **Orders**: Always 3–5 unique items from Good set; progress only on listed items
- **Scoring**: +10 per valid catch; +50 on completion; totals visible immediately
- **Penalty**: wrong catch applies penalty and VFX/SFX within 100 ms
- **Difficulty**: fall speed and spawn interval adjust exactly per rules
- **UI**: order panel clearly reflects collected items; timer/lives and score visible
- **Performance**: sustained 60 FPS with ≤30 active toppings on screen
- **Persistence**: high score saved and restored across reloads

## 11) Analytics (optional, if enabled)
- **Events**: session_start, session_end, order_completed, wrong_catch, best_score_updated
- **Metrics**: average orders/session, wrong catch rate, avg session length

## 12) Accessibility
- Colorblind-friendly icons for good vs bad
- Flash reduction setting; master volume slider; mute toggle
- Key remap (phase 2)

## 13) Stretch Goals
- Multiple simultaneous orders (2 panels) with split scoring
- Power-ups: Slow Fall (5s), Double Points (10s), Magnet (3s)
- Leaderboard: local + hosted (Supabase) with anonymous IDs
- Chaos modes: rotating toppings, wind drift

## 14) Milestones
- **M1 (Day 1–2)**: Core loop (move, spawn, catch, score), static order
- **M2 (Day 3–4)**: Orders system, difficulty ramp, penalties, basic UI
- **M3 (Day 5)**: Audio/VFX polish, persistence, pause menu
- **M4 (Day 6–7)**: QA pass, tuning, export

## 15) Risks & Mitigations
- **Readability at speed**: favor high contrast, thick outlines; cap concurrent toppings
- **Input variability**: use Keyboard events + key repeat guard
- **Performance dips**: pooling, atlas textures, limit physics checks

## 16) Open Questions
- Should duplicates in an order ever appear? (current: no)
- Default mode: Timer or Lives? (current: Timer)
- Enable pineapple by default or reserve for evil mode? (current: evil mode only)

## 17) Definition of Done (Release)
- All acceptance criteria pass on Chrome/Edge latest
- No critical bugs (crash/data loss/softlock)
- Performance target met on mid hardware
- PRD updated with any final tuning values

## 18) Mobile/Android Considerations
- **Orientation**: Portrait lock (9:16 aspect ratio)
- **Touch Controls**: Pointer movement for plate control
- **Performance**: 60 FPS on mid-range Android devices
- **Capacitor Integration**: Web build wrapped as native Android app
- **Responsive Design**: Scales to fit various screen sizes
- **Safe Area**: Respects notches and system UI elements
