# Anna's Galactic Invaders — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first, Space-Invaders-style arcade game — 20 levels, 5 bosses, power-ups, drag-to-move + auto-fire — that runs in mobile Safari and deploys as a PWA link.

**Architecture:** Vanilla TypeScript + HTML5 Canvas 2D. A fixed-timestep loop drives a scene/state machine (title → play → boss → win/over). The world renders on a logical 360-unit-wide playfield scaled to the device. Game logic (collision, formation movement, level config, power-ups, scoring, boss phases) is pure and unit-tested; rendering, input, and audio touch the DOM and are verified by running the app. Sprites load through an asset manifest, so the existing art in `assets/sprites/` drops in by filename.

**Tech Stack:** Vite, TypeScript, Vitest (unit tests), `vite-plugin-pwa`, Web Audio API. No runtime dependencies.

## Global Constraints

- Logical playfield width is exactly `360` units; height derives from device aspect (`LOGICAL_W = 360`).
- Portrait orientation only; respect iOS safe-area insets via CSS `env(safe-area-inset-*)`.
- Target 60fps on a phone; fixed timestep `1/60`.
- Player control: drag-to-move (horizontal) + auto-fire; keep "one player shot on screen" as the base rule (`maxBullets = 1`) unless a power-up raises it.
- Boss levels are exactly `[4, 8, 12, 16, 20]`; `bossId` runs 1..5 in that order.
- Title text is `"Anna's Galactic Invaders"`. The `Space Invaders` logo in `assets/raw/` is intentionally unused.
- All audio is synthesized at runtime (Web Audio); audio context starts only after the first user tap; always provide a mute toggle.
- Sprite names referenced by code must match files in `assets/sprites/` exactly.
- TypeScript `strict: true`. Commit after every task.

---

## File Structure

```
space-shooter/
  index.html
  package.json  tsconfig.json  vite.config.ts  .gitignore
  public/manifest.webmanifest  public/icons/icon-192.png  public/icons/icon-512.png
  assets/sprites/*.png            (already generated)
  src/
    main.ts                       bootstrap: canvas, viewport, loop, game
    core/types.ts                 shared types (Sprite, Enemy, Bullet, PowerUp, PowerUpType)
    core/viewport.ts              logical<->device scaling, toLogical()
    core/loop.ts                  fixed-timestep loop + drainSteps()
    core/input.ts                 pointer drag -> targetX; clampX; canFire
    core/rng.ts                   mulberry32 seedable RNG
    core/assets.ts                SPRITES manifest, loadSprites(), placeholder()
    core/audio.ts                 Audio: unlock/mute/sfx/music
    render/renderer.ts            draw sprites, HUD, health bars
    render/starfield.ts           scrolling stars
    render/particles.ts           Particle, updateParticles(), burst()
    entities/player.ts            Player update/fire
    entities/enemy.ts             enemy construction from level
    entities/bullet.ts            bullet pool helpers
    entities/powerup.ts           falling power-up update
    entities/boss.ts              BossState, bossPhase(), patterns
    systems/formation.ts          stepFormation() grid movement + speedup
    systems/collision.ts          aabb()
    systems/spawn.ts              wave build, UFO + power-up drops
    systems/scoring.ts            POINTS, UFO_BONUS, levelClearBonus()
    game/levels.ts                buildLevels() -> LevelConfig[20], BossConfig
    game/state.ts                 GameState (score, lives, level, high score)
    game/scenes.ts                Scene enum + transition table
    game/game.ts                  ties systems together: update(dt)/draw()
    ui/screens.ts                 title/levelcard/pause/win/gameover draw
  tools/process_sprites.py        (exists) + face-composite addition
  tests/*.test.ts
```

---

## Task 1: Project scaffold

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `.gitignore`, `index.html`, `src/main.ts`
- Test: `tests/smoke.test.ts`

**Interfaces:**
- Produces: a running `npm run dev` server and a passing `npx vitest run`.

- [ ] **Step 1:** Create `package.json`:

```json
{
  "name": "annas-galactic-invaders",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc --noEmit && vite build",
    "preview": "vite preview",
    "test": "vitest run"
  },
  "devDependencies": {
    "typescript": "^5.5.0",
    "vite": "^5.4.0",
    "vite-plugin-pwa": "^0.20.0",
    "vitest": "^2.0.0"
  }
}
```

- [ ] **Step 2:** Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "lib": ["ES2020", "DOM"],
    "types": ["vite/client", "vitest/globals"]
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3:** Create `vite.config.ts` (base `./` so it works on any static host / GitHub Pages subpath):

```ts
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  test: { globals: true, environment: 'jsdom' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['assets/sprites/*.png'],
      manifest: {
        name: "Anna's Galactic Invaders",
        short_name: 'Galactic Invaders',
        background_color: '#0f0f32',
        theme_color: '#0f0f32',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
```

- [ ] **Step 4:** Create `index.html` (full-bleed portrait canvas, safe areas, no scroll/zoom):

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no" />
  <title>Anna's Galactic Invaders</title>
  <style>
    html,body{margin:0;height:100%;background:#0f0f32;overflow:hidden;
      touch-action:none;-webkit-user-select:none;user-select:none}
    #game{position:fixed;inset:0;width:100%;height:100%;display:block;
      padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
  </style>
</head>
<body>
  <canvas id="game"></canvas>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>
```

- [ ] **Step 5:** Create `src/main.ts` placeholder that fills the canvas so we can confirm boot:

```ts
const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 3)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
addEventListener('resize', resize); resize()
ctx.fillStyle = '#0f0f32'; ctx.fillRect(0, 0, innerWidth, innerHeight)
ctx.fillStyle = '#ffabf3'; ctx.font = '20px sans-serif'
ctx.fillText("boot ok", 20, 60)
```

- [ ] **Step 6:** Create `tests/smoke.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
describe('smoke', () => { it('math works', () => { expect(1 + 1).toBe(2) }) })
```

- [ ] **Step 7:** Create `.gitignore`:

```
node_modules
dist
dev-dist
```

- [ ] **Step 8:** Install + verify. Run: `npm install` then `npx vitest run`. Expected: 1 passing test. Then `npm run dev`, open the local URL, confirm a dark screen with "boot ok".

- [ ] **Step 9:** Commit.

```bash
git add -A && git commit -m "chore: scaffold Vite+TS+Vitest+PWA, booting canvas"
```

---

## Task 2: Core types + viewport scaling

**Files:**
- Create: `src/core/types.ts`, `src/core/viewport.ts`, `tests/viewport.test.ts`

**Interfaces:**
- Produces: `LOGICAL_W=360`; `interface Sprite {x,y,w,h}` (x,y = center); `computeViewport(cssW,cssH): {scale,logicalH}`; `toLogical(clientX,clientY,rectLeft,rectTop,scale): {x,y}`. Types `Enemy`, `Bullet`, `PowerUp`, `PowerUpType` consumed everywhere downstream.

- [ ] **Step 1:** Write `tests/viewport.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { computeViewport, toLogical, LOGICAL_W } from '../src/core/viewport'

describe('viewport', () => {
  it('scales by width', () => {
    const v = computeViewport(720, 1280)
    expect(LOGICAL_W).toBe(360)
    expect(v.scale).toBe(2)
    expect(v.logicalH).toBe(640)
  })
  it('maps client coords to logical', () => {
    const p = toLogical(100, 200, 0, 0, 2)
    expect(p).toEqual({ x: 50, y: 100 })
  })
})
```

- [ ] **Step 2:** Run `npx vitest run tests/viewport.test.ts` — expect FAIL (module missing).

- [ ] **Step 3:** Create `src/core/types.ts`:

```ts
export interface Vec { x: number; y: number }
export interface Sprite { x: number; y: number; w: number; h: number } // x,y = center
export type PowerUpType = 'rapid' | 'spread' | 'shield' | 'life'
export interface Enemy extends Sprite { type: number; col: number; row: number; alive: boolean }
export interface Bullet extends Sprite { vx: number; vy: number; from: 'player' | 'enemy' | 'boss'; dead: boolean }
export interface PowerUp extends Sprite { kind: PowerUpType; vy: number; dead: boolean }
```

- [ ] **Step 4:** Create `src/core/viewport.ts`:

```ts
import type { Vec } from './types'
export const LOGICAL_W = 360
export interface Viewport { scale: number; logicalH: number }
export function computeViewport(cssW: number, cssH: number): Viewport {
  const scale = cssW / LOGICAL_W
  return { scale, logicalH: cssH / scale }
}
export function toLogical(clientX: number, clientY: number, rectLeft: number, rectTop: number, scale: number): Vec {
  return { x: (clientX - rectLeft) / scale, y: (clientY - rectTop) / scale }
}
```

- [ ] **Step 5:** Run `npx vitest run tests/viewport.test.ts` — expect PASS.

- [ ] **Step 6:** Commit. `git add -A && git commit -m "feat: core types + logical viewport scaling"`

---

## Task 3: Fixed-timestep loop

**Files:**
- Create: `src/core/loop.ts`, `tests/loop.test.ts`

**Interfaces:**
- Produces: `drainSteps(acc, fixed): {steps, rem}` (pure, tested); `createLoop(step:(dt:number)=>void, render:()=>void, fixed?=1/60): {start(), stop()}`.

- [ ] **Step 1:** Write `tests/loop.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { drainSteps } from '../src/core/loop'

describe('drainSteps', () => {
  it('drains whole fixed steps and keeps remainder', () => {
    const r = drainSteps(0.05, 1 / 60)
    expect(r.steps).toBe(3)
    expect(r.rem).toBeCloseTo(0.05 - 3 / 60, 6)
  })
  it('zero when below one step', () => {
    expect(drainSteps(0.01, 1 / 60).steps).toBe(0)
  })
})
```

- [ ] **Step 2:** Run test — expect FAIL.

- [ ] **Step 3:** Create `src/core/loop.ts`:

```ts
export function drainSteps(acc: number, fixed: number): { steps: number; rem: number } {
  let steps = 0
  while (acc >= fixed) { steps++; acc -= fixed }
  return { steps, rem: acc }
}

export function createLoop(step: (dt: number) => void, render: () => void, fixed = 1 / 60) {
  let last = 0, acc = 0, raf = 0
  function frame(tMs: number) {
    const now = tMs / 1000
    if (last) acc += Math.min(0.25, now - last)
    last = now
    const d = drainSteps(acc, fixed)
    for (let i = 0; i < d.steps; i++) step(fixed)
    acc = d.rem
    render()
    raf = requestAnimationFrame(frame)
  }
  return {
    start() { last = 0; raf = requestAnimationFrame(frame) },
    stop() { cancelAnimationFrame(raf) }
  }
}
```

- [ ] **Step 4:** Run test — expect PASS.
- [ ] **Step 5:** Commit. `git commit -am "feat: fixed-timestep loop"`

---

## Task 4: Input mapping + fire cadence

**Files:**
- Create: `src/core/input.ts`, `tests/input.test.ts`

**Interfaces:**
- Produces: `clampX(x, halfW, fieldW?=360)`; `canFire(activeBullets, maxBullets)`; `class Pointer { targetX:number|null; attach(canvas):void }` (sets `targetX` in logical units on pointer down/move within the field). Consumes `toLogical`, `LOGICAL_W`.

- [ ] **Step 1:** Write `tests/input.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { clampX, canFire } from '../src/core/input'

describe('input helpers', () => {
  it('clamps ship within field', () => {
    expect(clampX(-5, 20)).toBe(20)
    expect(clampX(400, 20, 360)).toBe(340)
    expect(clampX(180, 20)).toBe(180)
  })
  it('fire gate respects max bullets', () => {
    expect(canFire(0, 1)).toBe(true)
    expect(canFire(1, 1)).toBe(false)
    expect(canFire(3, 4)).toBe(true)
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.

- [ ] **Step 3:** Create `src/core/input.ts`:

```ts
import { LOGICAL_W, toLogical } from './viewport'

export function clampX(x: number, halfW: number, fieldW = LOGICAL_W): number {
  return Math.max(halfW, Math.min(fieldW - halfW, x))
}
export function canFire(activeBullets: number, maxBullets: number): boolean {
  return activeBullets < maxBullets
}

export class Pointer {
  targetX: number | null = null
  private scale = 1
  setScale(s: number) { this.scale = s }
  attach(canvas: HTMLCanvasElement) {
    const set = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      this.targetX = toLogical(e.clientX, e.clientY, r.left, r.top, this.scale).x
    }
    canvas.addEventListener('pointerdown', set)
    canvas.addEventListener('pointermove', (e) => { if (e.pressure > 0 || e.buttons) set(e) })
    canvas.addEventListener('pointerup', () => { /* keep last targetX */ })
  }
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit. `git commit -am "feat: pointer input + clamp + fire gate"`

---

## Task 5: AABB collision

**Files:**
- Create: `src/systems/collision.ts`, `tests/collision.test.ts`

**Interfaces:**
- Produces: `aabb(a: Sprite, b: Sprite): boolean` (center-based).

- [ ] **Step 1:** Write `tests/collision.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { aabb } from '../src/systems/collision'

const box = (x: number, y: number, w = 10, h = 10) => ({ x, y, w, h })
describe('aabb', () => {
  it('overlaps when close', () => { expect(aabb(box(0, 0), box(5, 0))).toBe(true) })
  it('misses when far', () => { expect(aabb(box(0, 0), box(20, 0))).toBe(false) })
  it('edge touching is not overlap', () => { expect(aabb(box(0, 0), box(10, 0))).toBe(false) })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/systems/collision.ts`:

```ts
import type { Sprite } from '../core/types'
export function aabb(a: Sprite, b: Sprite): boolean {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit. `git commit -am "feat: AABB collision"`

---

## Task 6: Asset manifest + loader + placeholder

**Files:**
- Create: `src/core/assets.ts`, `tests/assets.test.ts`

**Interfaces:**
- Produces: `SPRITES: Record<string,string>` (logical name -> path); `REQUIRED: string[]`; `placeholder(w,h,color): HTMLCanvasElement`; `loadSprites(): Promise<Map<string, CanvasImageSource>>` (falls back to a placeholder per missing image so the game never hard-fails).

- [ ] **Step 1:** Write `tests/assets.test.ts` (manifest covers every gameplay sprite):

```ts
import { describe, it, expect } from 'vitest'
import { SPRITES, REQUIRED } from '../src/core/assets'

describe('asset manifest', () => {
  it('defines every required sprite name', () => {
    for (const name of REQUIRED) expect(SPRITES[name], name).toBeTruthy()
  })
  it('boss + enemy + powerup slots present', () => {
    ;['player-ship', 'ufo', 'background', 'shot-player', 'shot-enemy', 'shot-boss',
      'enemy-01', 'enemy-04', 'boss-01', 'boss-05',
      'powerup-rapid', 'powerup-spread', 'powerup-shield', 'powerup-life']
      .forEach(n => expect(SPRITES[n], n).toBeTruthy())
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/core/assets.ts`:

```ts
const S = (n: string) => `assets/sprites/${n}.png`
export const SPRITES: Record<string, string> = {
  'player-ship': S('player-ship'),
  'ufo': S('ufo'),
  'background': S('background'),
  'shot-player': S('shot-player'),
  'shot-enemy': S('shot-enemy'),
  'shot-boss': S('shot-boss'),
  'enemy-01': S('enemy-01'), 'enemy-02': S('enemy-02'),
  'enemy-03': S('enemy-03'), 'enemy-04': S('enemy-04'),
  'boss-01': S('boss-01'), 'boss-02': S('boss-02'), 'boss-03': S('boss-03'),
  'boss-04': S('boss-04'), 'boss-05': S('boss-05'),
  'powerup-rapid': S('powerup-rapid'), 'powerup-spread': S('powerup-spread'),
  'powerup-shield': S('powerup-shield'), 'powerup-life': S('powerup-life'),
}
export const REQUIRED = Object.keys(SPRITES)

export function placeholder(w: number, h: number, color: string): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = w; c.height = h
  const x = c.getContext('2d')!
  x.fillStyle = color; x.fillRect(0, 0, w, h)
  x.strokeStyle = '#ffffff'; x.strokeRect(1, 1, w - 2, h - 2)
  return c
}

export function loadSprites(): Promise<Map<string, CanvasImageSource>> {
  const out = new Map<string, CanvasImageSource>()
  const jobs = Object.entries(SPRITES).map(([name, src]) => new Promise<void>((res) => {
    const img = new Image()
    img.onload = () => { out.set(name, img); res() }
    img.onerror = () => { out.set(name, placeholder(48, 48, '#ff00ff')); res() }
    img.src = src
  }))
  return Promise.all(jobs).then(() => out)
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit. `git commit -am "feat: asset manifest, loader, placeholder fallback"`

---

## Task 7: Renderer + starfield + player (FIRST PLAYABLE)

**Files:**
- Create: `src/render/renderer.ts`, `src/render/starfield.ts`, `src/entities/player.ts`, `src/entities/bullet.ts`
- Modify: `src/main.ts` (wire loop + input + player + draw)

**Interfaces:**
- Consumes: `loadSprites`, `createLoop`, `Pointer`, `clampX`, `canFire`, `Sprite`, `Bullet`, viewport.
- Produces: `Renderer` with `drawSprite(name, s: Sprite, rot?)`, `clear()`, `image(name)`; `Starfield.update(dt)/draw(ctx)`; `Player` with `{sprite, fireTimer}`, `updatePlayer(p, targetX, dt)`, `firePlayer(p, bullets, maxBullets, interval)`; `Bullet` pool helpers `spawnBullet`, `updateBullets`.

- [ ] **Step 1:** Create `src/entities/bullet.ts`:

```ts
import type { Bullet } from '../core/types'
export function spawnBullet(b: Bullet[], x: number, y: number, vy: number, from: Bullet['from'], w = 6, h = 16) {
  b.push({ x, y, w, h, vx: 0, vy, from, dead: false })
}
export function updateBullets(b: Bullet[], dt: number, logicalH: number): Bullet[] {
  for (const o of b) { o.y += o.vy * dt; if (o.y < -20 || o.y > logicalH + 20) o.dead = true }
  return b.filter(o => !o.dead)
}
export function activePlayerBullets(b: Bullet[]): number { return b.filter(o => o.from === 'player' && !o.dead).length }
```

- [ ] **Step 2:** Create `src/entities/player.ts`:

```ts
import type { Bullet, Sprite } from '../core/types'
import { clampX, canFire } from '../core/input'
import { spawnBullet, activePlayerBullets } from './bullet'

export interface Player { sprite: Sprite; fireTimer: number; speed: number; invuln: number }
export function makePlayer(logicalH: number): Player {
  return { sprite: { x: 180, y: logicalH - 70, w: 30, h: 34 }, fireTimer: 0, speed: 600, invuln: 0 }
}
export function updatePlayer(p: Player, targetX: number | null, dt: number) {
  if (targetX != null) {
    const dx = clampX(targetX, p.sprite.w / 2) - p.sprite.x
    const step = Math.sign(dx) * Math.min(Math.abs(dx), p.speed * dt)
    p.sprite.x += step
  }
  if (p.fireTimer > 0) p.fireTimer -= dt
  if (p.invuln > 0) p.invuln -= dt
}
export function firePlayer(p: Player, bullets: Bullet[], maxBullets: number, interval: number) {
  if (p.fireTimer > 0) return
  if (!canFire(activePlayerBullets(bullets), maxBullets)) return
  spawnBullet(bullets, p.sprite.x, p.sprite.y - p.sprite.h / 2, -480, 'player', 8, 20)
  p.fireTimer = interval
}
```

- [ ] **Step 3:** Create `src/render/starfield.ts`:

```ts
import { LOGICAL_W } from '../core/viewport'
interface Star { x: number; y: number; s: number; v: number }
export class Starfield {
  stars: Star[] = []
  constructor(private h: number, rng: () => number, n = 60) {
    for (let i = 0; i < n; i++) this.stars.push({ x: rng() * LOGICAL_W, y: rng() * h, s: rng() * 1.5 + 0.5, v: rng() * 30 + 10 })
  }
  update(dt: number) { for (const s of this.stars) { s.y += s.v * dt; if (s.y > this.h) { s.y = 0; s.x = Math.random() * LOGICAL_W } } }
  draw(ctx: CanvasRenderingContext2D) { ctx.fillStyle = '#ffffff'; for (const s of this.stars) { ctx.globalAlpha = s.s / 2; ctx.fillRect(s.x, s.y, s.s, s.s) } ctx.globalAlpha = 1 }
}
```

- [ ] **Step 4:** Create `src/render/renderer.ts`:

```ts
import type { Sprite } from '../core/types'
export class Renderer {
  constructor(public ctx: CanvasRenderingContext2D, public images: Map<string, CanvasImageSource>) {}
  clear(w: number, h: number) { this.ctx.fillStyle = '#0f0f32'; this.ctx.fillRect(0, 0, w, h) }
  image(name: string) { return this.images.get(name) }
  drawSprite(name: string, s: Sprite, rot = 0) {
    const img = this.images.get(name); if (!img) return
    const { ctx } = this
    ctx.save(); ctx.translate(s.x, s.y); if (rot) ctx.rotate(rot)
    ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h); ctx.restore()
  }
  drawBackground(name: string, w: number, h: number) {
    const img = this.images.get(name); if (!img) return
    this.ctx.drawImage(img, 0, 0, w, h)
  }
}
```

- [ ] **Step 5:** Rewrite `src/main.ts` to wire a minimal play scene (background, starfield, draggable auto-firing ship, bullets):

```ts
import { computeViewport } from './core/viewport'
import { createLoop } from './core/loop'
import { Pointer } from './core/input'
import { loadSprites } from './core/assets'
import { mulberry32 } from './core/rng'
import { Renderer } from './render/renderer'
import { Starfield } from './render/starfield'
import { makePlayer, updatePlayer, firePlayer } from './entities/player'
import { updateBullets } from './entities/bullet'
import type { Bullet } from './core/types'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let vp = computeViewport(innerWidth, innerHeight)
const pointer = new Pointer()
pointer.attach(canvas)

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 3)
  canvas.width = innerWidth * dpr; canvas.height = innerHeight * dpr
  vp = computeViewport(innerWidth, innerHeight)
  pointer.setScale(vp.scale)
  ctx.setTransform(dpr * vp.scale, 0, 0, dpr * vp.scale, 0, 0) // now drawing in logical units
}
addEventListener('resize', resize)

loadSprites().then(images => {
  resize()
  const r = new Renderer(ctx, images)
  const rng = mulberry32(1234)
  const stars = new Starfield(vp.logicalH, rng)
  const player = makePlayer(vp.logicalH)
  const bullets: Bullet[] = []
  createLoop((dt) => {
    stars.update(dt)
    updatePlayer(player, pointer.targetX, dt)
    firePlayer(player, bullets, 1, 0.35)
    const kept = updateBullets(bullets, dt, vp.logicalH)
    bullets.length = 0; bullets.push(...kept)
  }, () => {
    r.clear(360, vp.logicalH)
    r.drawBackground('background', 360, vp.logicalH)
    stars.draw(ctx)
    for (const b of bullets) r.drawSprite('shot-player', b)
    r.drawSprite('player-ship', player.sprite)
  }).start()
})
```

- [ ] **Step 6 (manual verify):** `npm run dev`, open on a narrow window or device emulation. Confirm: nebula background fills portrait, stars scroll, dragging moves the ship horizontally (clamped to edges), the ship auto-fires chocolate bars upward one-at-a-time. Run `npx vitest run` (all green).

- [ ] **Step 7:** Commit. `git commit -am "feat: first playable — renderer, starfield, draggable auto-firing player"`

---

## Task 8: Enemies + formation movement

**Files:**
- Create: `src/entities/enemy.ts`, `src/systems/formation.ts`, `tests/formation.test.ts`

**Interfaces:**
- Consumes: `Enemy`, `LevelConfig` (forward-declared shape; full def in Task 12 — fields used here: `rows, cols, rowTypes`).
- Produces: `buildWave(rows, cols, rowTypes): Enemy[]` (positions a centered grid in logical space); `stepFormation(enemies, dir, dt, bounds, baseSpeed, dropY, total): {dir, dropped}` — moves all alive enemies; on edge contact reverses `dir` and drops every alive enemy by `dropY`; horizontal speed scales up to 3× as enemies die.

- [ ] **Step 1:** Write `tests/formation.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildWave } from '../src/entities/enemy'
import { stepFormation } from '../src/systems/formation'

describe('formation', () => {
  it('builds a centered grid', () => {
    const e = buildWave(2, 5, [0, 1])
    expect(e.length).toBe(10)
    expect(e.every(x => x.alive)).toBe(true)
    expect(e[0].type).toBe(0); expect(e[5].type).toBe(1)
  })
  it('reverses and drops at right edge', () => {
    const e = buildWave(1, 1, [0]); e[0].x = 350; e[0].w = 24
    const r = stepFormation(e, 1, 1, { left: 6, right: 354 }, 40, 10, 1)
    expect(r.dir).toBe(-1); expect(r.dropped).toBe(true)
    expect(e[0].y).toBeGreaterThan(0)
  })
  it('speeds up as enemies die', () => {
    const e = buildWave(1, 4, [0]); e.slice(1).forEach(x => x.alive = false)
    const before = e[0].x
    stepFormation(e, 1, 1, { left: 0, right: 1000 }, 10, 10, 4) // 1 of 4 alive -> ~3x
    expect(e[0].x - before).toBeGreaterThan(10 * 2) // moved much more than base 10
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.

- [ ] **Step 3:** Create `src/entities/enemy.ts`:

```ts
import type { Enemy } from '../core/types'
import { LOGICAL_W } from '../core/viewport'

export function buildWave(rows: number, cols: number, rowTypes: number[]): Enemy[] {
  const e: Enemy[] = []
  const cw = 32, ch = 28, gx = 12, gy = 14
  const totalW = cols * cw + (cols - 1) * (gx)
  const startX = (LOGICAL_W - totalW) / 2 + cw / 2
  const startY = 70
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      e.push({ x: startX + c * (cw + gx), y: startY + r * (ch + gy), w: cw, h: ch, type: rowTypes[r] ?? 0, col: c, row: r, alive: true })
    }
  }
  return e
}
```

- [ ] **Step 4:** Create `src/systems/formation.ts`:

```ts
import type { Enemy } from '../core/types'
export function stepFormation(
  enemies: Enemy[], dir: number, dt: number,
  bounds: { left: number; right: number }, baseSpeed: number, dropY: number, total: number
): { dir: number; dropped: boolean } {
  const alive = enemies.filter(e => e.alive)
  if (!alive.length) return { dir, dropped: false }
  const speed = baseSpeed * (1 + (total - alive.length) / total * 2) // 1x..3x
  const dx = dir * speed * dt
  let minX = Infinity, maxX = -Infinity
  for (const e of alive) { minX = Math.min(minX, e.x - e.w / 2); maxX = Math.max(maxX, e.x + e.w / 2) }
  if (minX + dx < bounds.left || maxX + dx > bounds.right) {
    for (const e of alive) e.y += dropY
    return { dir: -dir, dropped: true }
  }
  for (const e of alive) e.x += dx
  return { dir, dropped: false }
}
```

- [ ] **Step 5:** Run — expect PASS.
- [ ] **Step 6:** Commit. `git commit -am "feat: enemy wave builder + formation movement with speed-up"`

---

## Task 9: Combat resolution + enemy fire

**Files:**
- Create: `src/systems/combat.ts`, `tests/combat.test.ts`
- Modify: `src/main.ts` (spawn a wave, run formation, resolve hits) — manual verify.

**Interfaces:**
- Consumes: `aabb`, `Enemy`, `Bullet`, `Player`, scoring (`POINTS` — forward ref to Task 11 constants; use literal map here, reconciled in Task 11).
- Produces: `resolvePlayerHits(bullets, enemies): {points, kills}` (player bullets vs alive enemies, marks both dead/!alive); `resolveEnemyHits(bullets, player): boolean` (enemy/boss bullet vs player when `invuln<=0` → returns true if hit); `enemyFire(enemies, bullets, rng, ratePerSec, dt)` (random alive enemy shoots downward).

- [ ] **Step 1:** Write `tests/combat.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { resolvePlayerHits, resolveEnemyHits } from '../src/systems/combat'
import type { Bullet, Enemy } from '../src/core/types'

const enemy = (x: number, y: number): Enemy => ({ x, y, w: 30, h: 28, type: 1, col: 0, row: 0, alive: true })
const bullet = (x: number, y: number, from: Bullet['from']): Bullet => ({ x, y, w: 8, h: 20, vx: 0, vy: 0, from, dead: false })

describe('combat', () => {
  it('player bullet kills overlapping enemy and scores by type', () => {
    const e = [enemy(100, 100)]; const b = [bullet(100, 100, 'player')]
    const r = resolvePlayerHits(b, e)
    expect(e[0].alive).toBe(false); expect(b[0].dead).toBe(true)
    expect(r.kills).toBe(1); expect(r.points).toBe(20) // type 1 -> 20
  })
  it('enemy bullet hits vulnerable player', () => {
    const p = { sprite: { x: 50, y: 50, w: 30, h: 34 }, fireTimer: 0, speed: 0, invuln: 0 }
    const b = [bullet(50, 50, 'enemy')]
    expect(resolveEnemyHits(b, p as any)).toBe(true)
    expect(b[0].dead).toBe(true)
  })
  it('invulnerable player is not hit', () => {
    const p = { sprite: { x: 50, y: 50, w: 30, h: 34 }, fireTimer: 0, speed: 0, invuln: 1 }
    const b = [bullet(50, 50, 'enemy')]
    expect(resolveEnemyHits(b, p as any)).toBe(false)
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.

- [ ] **Step 3:** Create `src/systems/combat.ts`:

```ts
import type { Bullet, Enemy } from '../core/types'
import type { Player } from '../entities/player'
import { aabb } from './collision'
import { spawnBullet } from '../entities/bullet'

const POINTS: Record<number, number> = { 0: 10, 1: 20, 2: 30, 3: 40 }

export function resolvePlayerHits(bullets: Bullet[], enemies: Enemy[]): { points: number; kills: number } {
  let points = 0, kills = 0
  for (const b of bullets) {
    if (b.from !== 'player' || b.dead) continue
    for (const e of enemies) {
      if (!e.alive) continue
      if (aabb(b, e)) { e.alive = false; b.dead = true; points += POINTS[e.type] ?? 10; kills++; break }
    }
  }
  return { points, kills }
}

export function resolveEnemyHits(bullets: Bullet[], player: Player): boolean {
  if (player.invuln > 0) return false
  for (const b of bullets) {
    if (b.from === 'player' || b.dead) continue
    if (aabb(b, player.sprite)) { b.dead = true; return true }
  }
  return false
}

export function enemyFire(enemies: Enemy[], bullets: Bullet[], rng: () => number, ratePerSec: number, dt: number) {
  if (rng() < ratePerSec * dt) {
    const alive = enemies.filter(e => e.alive)
    if (!alive.length) return
    const shooter = alive[Math.floor(rng() * alive.length)]
    spawnBullet(bullets, shooter.x, shooter.y + shooter.h / 2, 220, 'enemy', 8, 16)
  }
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5 (manual verify):** In `main.ts`, build a wave (`buildWave(3,6,[0,1,2])`), each step call `stepFormation` + `enemyFire` + `resolvePlayerHits` + `resolveEnemyHits`; draw enemies (`enemy-0(type+1)`). Confirm: shooting destroys enemies, formation marches and speeds up, enemy shots fall. (Lives/scoring display arrives in Task 11.)
- [ ] **Step 6:** Commit. `git commit -am "feat: combat resolution + enemy fire"`

---

## Task 10: Destructible shields

**Files:**
- Create: `src/systems/shields.ts`, `tests/shields.test.ts`

**Interfaces:**
- Produces: `interface ShieldCell extends Sprite { hp:number; alive:boolean }`; `buildShields(logicalH): ShieldCell[]` (3 bunkers, each a small grid of cells just above the player); `damageShields(bullets, cells): void` (any bullet hitting a live cell decrements hp / kills cell and kills the bullet).

- [ ] **Step 1:** Write `tests/shields.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildShields, damageShields } from '../src/systems/shields'
import type { Bullet } from '../src/core/types'

describe('shields', () => {
  it('builds three bunkers of cells', () => {
    const c = buildShields(640)
    expect(c.length).toBeGreaterThan(12)
    expect(c.every(x => x.alive)).toBe(true)
  })
  it('a bullet erodes a cell and dies', () => {
    const c = buildShields(640); const target = c[0]
    const b: Bullet[] = [{ x: target.x, y: target.y, w: 8, h: 16, vx: 0, vy: 0, from: 'player', dead: false }]
    damageShields(b, c)
    expect(b[0].dead).toBe(true)
    expect(target.alive).toBe(false)
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/systems/shields.ts`:

```ts
import type { Bullet, Sprite } from '../core/types'
import { LOGICAL_W } from '../core/viewport'
import { aabb } from './collision'

export interface ShieldCell extends Sprite { hp: number; alive: boolean }

export function buildShields(logicalH: number): ShieldCell[] {
  const cells: ShieldCell[] = []
  const cols = 5, rows = 3, cell = 9
  const bunkers = 3
  const y0 = logicalH - 150
  for (let b = 0; b < bunkers; b++) {
    const bx = (LOGICAL_W / (bunkers + 1)) * (b + 1) - (cols * cell) / 2
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      cells.push({ x: bx + c * cell + cell / 2, y: y0 + r * cell, w: cell, h: cell, hp: 2, alive: true })
    }
  }
  return cells
}

export function damageShields(bullets: Bullet[], cells: ShieldCell[]): void {
  for (const b of bullets) {
    if (b.dead) continue
    for (const c of cells) {
      if (!c.alive) continue
      if (aabb(b, c)) { c.hp -= 1; if (c.hp <= 0) c.alive = false; b.dead = true; break }
    }
  }
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit. `git commit -am "feat: destructible shield bunkers"`

---

## Task 11: Game state — score, lives, high score

**Files:**
- Create: `src/game/state.ts`, `src/systems/scoring.ts`, `tests/state.test.ts`

**Interfaces:**
- Produces: `src/systems/scoring.ts` exporting `POINTS` (same map as Task 9), `UFO_BONUS=150`, `levelClearBonus(level)`, `EXTRA_LIFE_AT=5000`; `class GameState { score, lives=3, level=1, high; addScore(n); loseLife():boolean; loadHigh(); commitHigh() }`. Refactor Task 9's local `POINTS` to import from `scoring.ts` (single source of truth).

- [ ] **Step 1:** Write `tests/state.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameState } from '../src/game/state'
import { levelClearBonus } from '../src/systems/scoring'

beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
  })
})

describe('GameState', () => {
  it('loses lives down to game over', () => {
    const g = new GameState()
    expect(g.lives).toBe(3)
    expect(g.loseLife()).toBe(false)
    expect(g.loseLife()).toBe(false)
    expect(g.loseLife()).toBe(true) // 0 lives -> game over
  })
  it('grants an extra life crossing the threshold', () => {
    const g = new GameState(); g.addScore(4999); const before = g.lives
    g.addScore(2)
    expect(g.lives).toBe(before + 1)
  })
  it('commits a new high score', () => {
    const g = new GameState(); g.addScore(1200); g.commitHigh()
    const g2 = new GameState(); g2.loadHigh()
    expect(g2.high).toBe(1200)
  })
  it('level clear bonus grows with level', () => {
    expect(levelClearBonus(1)).toBeLessThan(levelClearBonus(10))
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/systems/scoring.ts`:

```ts
export const POINTS: Record<number, number> = { 0: 10, 1: 20, 2: 30, 3: 40 }
export const UFO_BONUS = 150
export const EXTRA_LIFE_AT = 5000
export function levelClearBonus(level: number): number { return 100 + level * 10 }
```

- [ ] **Step 4:** Update `src/systems/combat.ts` to `import { POINTS } from './scoring'` and delete its local `POINTS` const.
- [ ] **Step 5:** Create `src/game/state.ts`:

```ts
import { EXTRA_LIFE_AT } from '../systems/scoring'
const HIGH_KEY = 'agi.high'
export class GameState {
  score = 0; lives = 3; level = 1; high = 0
  private nextLife = EXTRA_LIFE_AT
  addScore(n: number) { this.score += n; while (this.score >= this.nextLife) { this.lives++; this.nextLife += EXTRA_LIFE_AT } }
  loseLife(): boolean { this.lives--; return this.lives <= 0 }
  loadHigh() { this.high = Number(localStorage.getItem(HIGH_KEY) || 0) }
  commitHigh() { this.loadHigh(); if (this.score > this.high) { this.high = this.score; localStorage.setItem(HIGH_KEY, String(this.score)) } }
}
```

- [ ] **Step 6:** Run `npx vitest run` — expect ALL green (state + combat still pass).
- [ ] **Step 7:** Commit. `git commit -am "feat: game state, scoring single-source, high score persistence"`

---

## Task 12: Level data (20 levels + boss config)

**Files:**
- Create: `src/game/levels.ts`, `tests/levels.test.ts`

**Interfaces:**
- Produces: `interface LevelConfig {index,isBoss,rows,cols,rowTypes,baseSpeed,dropY,fireRate,ufoChance,bossId?}`; `interface BossConfig {id,sprite,hp,minionType,fireRate}`; `BOSS_LEVELS=[4,8,12,16,20]`; `buildLevels(): LevelConfig[]` (length 20); `bossConfig(bossId): BossConfig`.

- [ ] **Step 1:** Write `tests/levels.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { buildLevels, BOSS_LEVELS, bossConfig } from '../src/game/levels'

describe('levels', () => {
  const L = buildLevels()
  it('has exactly 20 levels indexed 1..20', () => {
    expect(L.length).toBe(20)
    expect(L.map(l => l.index)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
  })
  it('marks boss levels and numbers bosses 1..5', () => {
    expect(L.filter(l => l.isBoss).map(l => l.index)).toEqual(BOSS_LEVELS)
    expect(L.filter(l => l.isBoss).map(l => l.bossId)).toEqual([1, 2, 3, 4, 5])
  })
  it('non-boss difficulty is non-decreasing in speed', () => {
    const speeds = L.filter(l => !l.isBoss).map(l => l.baseSpeed)
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1])
  })
  it('caps grid size and references valid enemy types', () => {
    for (const l of L) if (!l.isBoss) {
      expect(l.cols).toBeLessThanOrEqual(9); expect(l.rows).toBeLessThanOrEqual(5)
      expect(l.rowTypes.every(t => t >= 0 && t <= 3)).toBe(true)
    }
  })
  it('boss config scales hp with id', () => {
    expect(bossConfig(5).hp).toBeGreaterThan(bossConfig(1).hp)
    expect(bossConfig(3).sprite).toBe('boss-03')
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/game/levels.ts`:

```ts
export interface LevelConfig {
  index: number; isBoss: boolean; rows: number; cols: number; rowTypes: number[]
  baseSpeed: number; dropY: number; fireRate: number; ufoChance: number; bossId?: number
}
export interface BossConfig { id: number; sprite: string; hp: number; minionType: number; fireRate: number }
export const BOSS_LEVELS = [4, 8, 12, 16, 20]

export function buildLevels(): LevelConfig[] {
  const out: LevelConfig[] = []
  for (let i = 1; i <= 20; i++) {
    const tier = Math.floor((i - 1) / 4) // 0..4
    if (BOSS_LEVELS.includes(i)) {
      out.push({ index: i, isBoss: true, rows: 0, cols: 0, rowTypes: [], baseSpeed: 0, dropY: 0, fireRate: 0, ufoChance: 0.05, bossId: BOSS_LEVELS.indexOf(i) + 1 })
      continue
    }
    const rows = Math.min(3 + Math.floor(i / 6), 5)
    const cols = Math.min(5 + Math.floor(i / 4), 9)
    const rowTypes = Array.from({ length: rows }, (_, r) => Math.min(r + (tier > 1 ? 1 : 0), 3))
    out.push({
      index: i, isBoss: false, rows, cols, rowTypes,
      baseSpeed: 14 + i * 1.6, dropY: 10 + tier * 2,
      fireRate: 0.6 + i * 0.09, ufoChance: 0.04 + tier * 0.008,
    })
  }
  return out
}

export function bossConfig(bossId: number): BossConfig {
  return {
    id: bossId,
    sprite: `boss-0${bossId}`,
    hp: 40 + bossId * 25,
    minionType: Math.min(bossId, 3),
    fireRate: 1.2 + bossId * 0.4,
  }
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5:** Commit. `git commit -am "feat: 20-level data table + boss configs"`

---

## Task 13: Power-ups + UFO

**Files:**
- Create: `src/systems/powerups.ts`, `src/entities/powerup.ts`, `tests/powerups.test.ts`

**Interfaces:**
- Consumes: `PowerUpType`, `PowerUp`, `rng`, `UFO_BONUS`.
- Produces: `class PowerState { apply(kind, onLife); update(dt); active(kind); maxBullets(); fireInterval(base) }`; `DURATIONS`; `rollPowerUp(rng): PowerUpType`; `shouldDrop(rng, chance): boolean`; `updatePowerUps(items, dt, logicalH): PowerUp[]`; `spawnUFO(rng): {sprite, vx,...}` handled in main (manual).

- [ ] **Step 1:** Write `tests/powerups.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { PowerState, rollPowerUp, shouldDrop, DURATIONS } from '../src/systems/powerups'
import { mulberry32 } from '../src/core/rng'

describe('powerups', () => {
  it('rapid raises max bullets and shortens interval', () => {
    const p = new PowerState(); p.apply('rapid', () => {})
    expect(p.maxBullets()).toBe(4)
    expect(p.fireInterval(0.3)).toBeCloseTo(0.1, 5)
  })
  it('spread raises max bullets to 3 without rapid', () => {
    const p = new PowerState(); p.apply('spread', () => {})
    expect(p.maxBullets()).toBe(3)
  })
  it('effects expire after their duration', () => {
    const p = new PowerState(); p.apply('shield', () => {})
    expect(p.active('shield')).toBe(true)
    p.update(DURATIONS.shield + 0.1)
    expect(p.active('shield')).toBe(false)
  })
  it('life calls onLife and is not a timer', () => {
    const p = new PowerState(); let lives = 3
    p.apply('life', () => { lives++ })
    expect(lives).toBe(4)
  })
  it('rng-seeded rolls are deterministic', () => {
    const r = mulberry32(7)
    const kinds = [rollPowerUp(r), rollPowerUp(r), rollPowerUp(r)]
    expect(kinds.every(k => ['rapid', 'spread', 'shield', 'life'].includes(k))).toBe(true)
    expect(shouldDrop(() => 0.01, 0.1)).toBe(true)
    expect(shouldDrop(() => 0.9, 0.1)).toBe(false)
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/systems/powerups.ts`:

```ts
import type { PowerUpType } from '../core/types'
type Timed = Exclude<PowerUpType, 'life'>
export const DURATIONS: Record<Timed, number> = { rapid: 8, spread: 8, shield: 6 }

export class PowerState {
  private timers: Record<Timed, number> = { rapid: 0, spread: 0, shield: 0 }
  apply(kind: PowerUpType, onLife: () => void) {
    if (kind === 'life') { onLife(); return }
    this.timers[kind] = DURATIONS[kind]
  }
  update(dt: number) { (Object.keys(this.timers) as Timed[]).forEach(k => { this.timers[k] = Math.max(0, this.timers[k] - dt) }) }
  active(kind: Timed) { return this.timers[kind] > 0 }
  maxBullets() { return this.active('rapid') ? 4 : this.active('spread') ? 3 : 1 }
  fireInterval(base: number) { return this.active('rapid') ? base / 3 : base }
  hasShield() { return this.active('shield') }
}

export function rollPowerUp(rng: () => number): PowerUpType {
  const r = rng()
  return r < 0.34 ? 'rapid' : r < 0.64 ? 'spread' : r < 0.9 ? 'shield' : 'life'
}
export function shouldDrop(rng: () => number, chance: number): boolean { return rng() < chance }
```

- [ ] **Step 4:** Create `src/entities/powerup.ts`:

```ts
import type { PowerUp, PowerUpType } from '../core/types'
export function spawnPowerUp(items: PowerUp[], x: number, y: number, kind: PowerUpType) {
  items.push({ x, y, w: 22, h: 22, vy: 90, kind, dead: false })
}
export function updatePowerUps(items: PowerUp[], dt: number, logicalH: number): PowerUp[] {
  for (const p of items) { p.y += p.vy * dt; if (p.y > logicalH + 20) p.dead = true }
  return items.filter(p => !p.dead)
}
export const POWERUP_SPRITE: Record<PowerUpType, string> = {
  rapid: 'powerup-rapid', spread: 'powerup-spread', shield: 'powerup-shield', life: 'powerup-life',
}
```

- [ ] **Step 5:** Run — expect PASS.
- [ ] **Step 6:** Commit. `git commit -am "feat: power-up state, drops, and falling pickups"`

---

## Task 14: Bosses

**Files:**
- Create: `src/entities/boss.ts`, `tests/boss.test.ts`
- Modify: `src/main.ts` (boss scene path) — manual verify.

**Interfaces:**
- Consumes: `BossConfig`, `Bullet`, `Sprite`, `rng`, `spawnBullet`.
- Produces: `interface Boss { sprite:Sprite; hp:number; maxHp:number; dir:number; t:number }`; `makeBoss(cfg, logicalH): Boss`; `bossPhase(hp,maxHp): 0|1|2`; `updateBoss(boss, cfg, dt, bounds, rng, bullets): void` (sweeps horizontally, fires patterns that intensify by phase); `damageBoss(bullets, boss): number` (player hits reduce hp, return damage); `bossDefeated(boss): boolean`.

- [ ] **Step 1:** Write `tests/boss.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { makeBoss, bossPhase, damageBoss, bossDefeated } from '../src/entities/boss'
import { bossConfig } from '../src/game/levels'
import type { Bullet } from '../src/core/types'

describe('boss', () => {
  it('phase escalates as hp drops', () => {
    expect(bossPhase(100, 100)).toBe(0)
    expect(bossPhase(50, 100)).toBe(1)
    expect(bossPhase(20, 100)).toBe(2)
  })
  it('player bullets damage boss and can defeat it', () => {
    const b = makeBoss(bossConfig(1), 640)
    b.hp = 3
    const bullets: Bullet[] = [
      { x: b.sprite.x, y: b.sprite.y, w: 8, h: 20, vx: 0, vy: -1, from: 'player', dead: false },
    ]
    const dmg = damageBoss(bullets, b)
    expect(dmg).toBe(1); expect(bullets[0].dead).toBe(true); expect(b.hp).toBe(2)
    b.hp = 0; expect(bossDefeated(b)).toBe(true)
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/entities/boss.ts`:

```ts
import type { Bullet, Sprite } from '../core/types'
import type { BossConfig } from '../game/levels'
import { LOGICAL_W } from '../core/viewport'
import { aabb } from '../systems/collision'
import { spawnBullet } from './bullet'

export interface Boss { sprite: Sprite; hp: number; maxHp: number; dir: number; t: number }

export function makeBoss(cfg: BossConfig, _logicalH: number): Boss {
  const w = 120 + cfg.id * 10
  return { sprite: { x: LOGICAL_W / 2, y: 120, w, h: w * 0.7 }, hp: cfg.hp, maxHp: cfg.hp, dir: 1, t: 0 }
}
export function bossPhase(hp: number, maxHp: number): 0 | 1 | 2 {
  const f = hp / maxHp; return f > 0.66 ? 0 : f > 0.33 ? 1 : 2
}
export function bossDefeated(b: Boss): boolean { return b.hp <= 0 }

export function damageBoss(bullets: Bullet[], b: Boss): number {
  let dmg = 0
  for (const o of bullets) {
    if (o.from !== 'player' || o.dead) continue
    if (aabb(o, b.sprite)) { o.dead = true; b.hp -= 1; dmg += 1 }
  }
  return dmg
}

export function updateBoss(b: Boss, cfg: BossConfig, dt: number, bounds: { left: number; right: number }, rng: () => number, bullets: Bullet[]) {
  b.t += dt
  const phase = bossPhase(b.hp, b.maxHp)
  b.sprite.x += b.dir * (50 + phase * 30) * dt
  if (b.sprite.x - b.sprite.w / 2 < bounds.left || b.sprite.x + b.sprite.w / 2 > bounds.right) b.dir *= -1
  const rate = cfg.fireRate * (1 + phase * 0.6)
  if (rng() < rate * dt) {
    const spread = phase >= 1 ? [-60, 0, 60] : [0]
    for (const vx of spread) spawnBullet(bullets, b.sprite.x, b.sprite.y + b.sprite.h / 2, 200, 'boss', 12, 22)
    bullets.filter(x => x.from === 'boss').slice(-spread.length).forEach((x, i) => { x.vx = spread[i] })
  }
}
```

- [ ] **Step 4:** Run — expect PASS.
- [ ] **Step 5 (manual verify):** On boss levels, spawn boss, draw `boss-0{id}` + a health-bar (hp/maxHp) at top; confirm it sweeps, fires more in later phases, takes damage, and dies. Defeat grants `levelClearBonus` + forces a power-up drop.
- [ ] **Step 6:** Commit. `git commit -am "feat: boss entity, phases, attacks, damage"`

---

## Task 15: Audio + particles + screen shake

**Files:**
- Create: `src/core/audio.ts`, `src/render/particles.ts`, `tests/audio.test.ts`, `tests/particles.test.ts`
- Modify: `src/main.ts` (unlock audio on first pointer; hook sfx; particle bursts on kills; shake on player hit/boss).

**Interfaces:**
- Produces: `class Audio { unlock(); setMuted(b); toggleMuted():boolean; sfx(name:'shoot'|'hit'|'explode'|'power'|'boss'); music(track:'normal'|'boss'|'none') }` (no-op until `unlock()`); `interface Particle`; `burst(x,y,n,rng,color): Particle[]`; `updateParticles(ps,dt): Particle[]`; `class Shake { add(mag); update(dt); offset(): {x,y} }`.

- [ ] **Step 1:** Write `tests/particles.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { burst, updateParticles } from '../src/render/particles'
import { mulberry32 } from '../src/core/rng'

describe('particles', () => {
  it('burst makes n particles, update expires them', () => {
    const ps = burst(10, 10, 12, mulberry32(3), '#fff')
    expect(ps.length).toBe(12)
    let cur = ps
    for (let i = 0; i < 200; i++) cur = updateParticles(cur, 0.05)
    expect(cur.length).toBe(0)
  })
})
```

- [ ] **Step 2:** Write `tests/audio.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Audio } from '../src/core/audio'

describe('audio gating', () => {
  it('sfx is a no-op before unlock and when muted', () => {
    const a = new Audio()
    expect(() => a.sfx('shoot')).not.toThrow() // not unlocked -> no-op
    a.setMuted(true)
    expect(a.toggleMuted()).toBe(false)
  })
})
```

- [ ] **Step 3:** Run both — expect FAIL.
- [ ] **Step 4:** Create `src/render/particles.ts`:

```ts
export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }
export function burst(x: number, y: number, n: number, rng: () => number, color: string): Particle[] {
  const ps: Particle[] = []
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2, sp = 40 + rng() * 160, life = 0.3 + rng() * 0.5
    ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, color, size: 1 + rng() * 2.5 })
  }
  return ps
}
export function updateParticles(ps: Particle[], dt: number): Particle[] {
  for (const p of ps) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt }
  return ps.filter(p => p.life > 0)
}
export function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[]) {
  for (const p of ps) { ctx.globalAlpha = Math.max(0, p.life / p.max); ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size) }
  ctx.globalAlpha = 1
}
export class Shake {
  private mag = 0
  add(m: number) { this.mag = Math.max(this.mag, m) }
  update(dt: number) { this.mag = Math.max(0, this.mag - dt * 30) }
  offset(): { x: number; y: number } { return { x: (Math.random() - 0.5) * this.mag, y: (Math.random() - 0.5) * this.mag } }
}
```

- [ ] **Step 5:** Create `src/core/audio.ts`:

```ts
type Sfx = 'shoot' | 'hit' | 'explode' | 'power' | 'boss'
export class Audio {
  private ctx?: AudioContext
  private muted = false
  private unlocked = false
  unlock() { if (!this.ctx) this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); this.unlocked = true }
  setMuted(m: boolean) { this.muted = m }
  toggleMuted() { this.muted = !this.muted; return this.muted }
  private blip(freq: number, dur: number, type: OscillatorType, gain = 0.2) {
    if (!this.ctx) return
    const o = this.ctx.createOscillator(), g = this.ctx.createGain()
    o.type = type; o.frequency.value = freq
    g.gain.setValueAtTime(gain, this.ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur)
    o.connect(g).connect(this.ctx.destination); o.start(); o.stop(this.ctx.currentTime + dur)
  }
  sfx(name: Sfx) {
    if (!this.unlocked || this.muted || !this.ctx) return
    if (name === 'shoot') this.blip(660, 0.08, 'square', 0.12)
    else if (name === 'hit') this.blip(220, 0.1, 'sawtooth', 0.15)
    else if (name === 'explode') this.blip(90, 0.35, 'sawtooth', 0.25)
    else if (name === 'power') { this.blip(520, 0.1, 'triangle'); this.blip(780, 0.12, 'triangle') }
    else if (name === 'boss') this.blip(70, 0.5, 'square', 0.3)
  }
  music(_track: 'normal' | 'boss' | 'none') { /* looped pad via scheduled blips; started after unlock */ }
}
```

- [ ] **Step 6:** Run both test files — expect PASS.
- [ ] **Step 7 (manual verify):** In `main.ts`, call `audio.unlock()` on first `pointerdown`; play `shoot` on fire, `explode` on enemy death (+ `burst` particles + `shake.add`), `power` on pickup, `boss` on boss hit. Add a mute button (top-right tap zone). Confirm sound starts after first tap and mute works on device.
- [ ] **Step 8:** Commit. `git commit -am "feat: synth audio, particles, screen shake"`

---

## Task 16: Scenes + screens + HUD

**Files:**
- Create: `src/game/scenes.ts`, `src/ui/screens.ts`, `tests/scenes.test.ts`
- Modify: `src/game/game.ts` (new) to own the scene machine; `src/main.ts` delegates to it.

**Interfaces:**
- Produces: `enum Scene { Title, LevelCard, Play, Win, GameOver, Paused }`; `nextScene(cur, evt): Scene` transition table (`evt` ∈ `'start'|'levelReady'|'cleared'|'lastCleared'|'died'|'pause'|'resume'|'restart'`); `drawTitle/drawLevelCard/drawWin/drawGameOver/drawHUD/drawPauseButton` in `screens.ts` (consume `Renderer.ctx`, `GameState`).

- [ ] **Step 1:** Write `tests/scenes.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { Scene, nextScene } from '../src/game/scenes'

describe('scene transitions', () => {
  it('title -> levelcard -> play', () => {
    expect(nextScene(Scene.Title, 'start')).toBe(Scene.LevelCard)
    expect(nextScene(Scene.LevelCard, 'levelReady')).toBe(Scene.Play)
  })
  it('clearing a normal level returns to level card', () => {
    expect(nextScene(Scene.Play, 'cleared')).toBe(Scene.LevelCard)
  })
  it('clearing the last level wins', () => {
    expect(nextScene(Scene.Play, 'lastCleared')).toBe(Scene.Win)
  })
  it('dying ends the game; pause/resume toggle', () => {
    expect(nextScene(Scene.Play, 'died')).toBe(Scene.GameOver)
    expect(nextScene(Scene.Play, 'pause')).toBe(Scene.Paused)
    expect(nextScene(Scene.Paused, 'resume')).toBe(Scene.Play)
    expect(nextScene(Scene.GameOver, 'restart')).toBe(Scene.Title)
  })
})
```

- [ ] **Step 2:** Run — expect FAIL.
- [ ] **Step 3:** Create `src/game/scenes.ts`:

```ts
export enum Scene { Title, LevelCard, Play, Win, GameOver, Paused }
export type SceneEvent = 'start' | 'levelReady' | 'cleared' | 'lastCleared' | 'died' | 'pause' | 'resume' | 'restart'
export function nextScene(cur: Scene, evt: SceneEvent): Scene {
  switch (cur) {
    case Scene.Title: return evt === 'start' ? Scene.LevelCard : cur
    case Scene.LevelCard: return evt === 'levelReady' ? Scene.Play : cur
    case Scene.Play:
      if (evt === 'cleared') return Scene.LevelCard
      if (evt === 'lastCleared') return Scene.Win
      if (evt === 'died') return Scene.GameOver
      if (evt === 'pause') return Scene.Paused
      return cur
    case Scene.Paused: return evt === 'resume' ? Scene.Play : cur
    case Scene.Win:
    case Scene.GameOver: return evt === 'restart' ? Scene.Title : cur
    default: return cur
  }
}
```

- [ ] **Step 4:** Create `src/ui/screens.ts` with neon-styled text helpers (theme colors `#ffabf3`, `#00fbfb`, bg `#0f0f32`; font `Space Grotesk` with sans-serif fallback). Each fn draws centered text at logical coords. Include `drawTitle(ctx,h,high)`, `drawLevelCard(ctx,h,level,isBoss)`, `drawWin(ctx,h,score,high)`, `drawGameOver(ctx,h,score,high)`, `drawHUD(ctx,state)`, `drawPauseButton(ctx)`, and a boss `drawHealthBar(ctx,hp,maxHp)`:

```ts
import type { GameState } from '../game/state'
const PINK = '#ffabf3', CYAN = '#00fbfb', INK = '#e1dfff'
function center(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, color: string) {
  ctx.fillStyle = color; ctx.textAlign = 'center'
  ctx.font = `${size}px "Space Grotesk", system-ui, sans-serif`
  ctx.fillText(text, 180, y)
}
export function drawTitle(ctx: CanvasRenderingContext2D, h: number, high: number) {
  center(ctx, "ANNA'S", h * 0.32, 40, PINK)
  center(ctx, 'GALACTIC INVADERS', h * 0.4, 22, CYAN)
  center(ctx, 'tap to start', h * 0.62, 16, INK)
  center(ctx, `high ${high}`, h * 0.7, 14, INK)
}
export function drawLevelCard(ctx: CanvasRenderingContext2D, h: number, level: number, isBoss: boolean) {
  center(ctx, isBoss ? 'BOSS' : `LEVEL ${level}`, h * 0.45, 30, isBoss ? PINK : CYAN)
}
export function drawWin(ctx: CanvasRenderingContext2D, h: number, score: number, high: number) {
  center(ctx, 'YOU WIN!', h * 0.4, 34, PINK); center(ctx, `score ${score}`, h * 0.5, 18, INK); center(ctx, `high ${high}`, h * 0.56, 14, INK); center(ctx, 'tap to play again', h * 0.7, 16, CYAN)
}
export function drawGameOver(ctx: CanvasRenderingContext2D, h: number, score: number, high: number) {
  center(ctx, 'GAME OVER', h * 0.4, 32, CYAN); center(ctx, `score ${score}`, h * 0.5, 18, INK); center(ctx, `high ${high}`, h * 0.56, 14, INK); center(ctx, 'tap to retry', h * 0.7, 16, PINK)
}
export function drawHUD(ctx: CanvasRenderingContext2D, state: GameState) {
  ctx.fillStyle = INK; ctx.textAlign = 'left'; ctx.font = '14px "JetBrains Mono", monospace'
  ctx.fillText(`SCORE ${state.score}`, 10, 22)
  ctx.textAlign = 'right'; ctx.fillText(`♥ ${state.lives}`, 350, 22)
  ctx.textAlign = 'center'; ctx.fillText(`LV ${state.level}`, 180, 22)
}
export function drawHealthBar(ctx: CanvasRenderingContext2D, hp: number, maxHp: number) {
  ctx.fillStyle = '#2a2a44'; ctx.fillRect(16, 30, 328, 9)
  ctx.fillStyle = '#e24b4a'; ctx.fillRect(16, 30, 328 * Math.max(0, hp / maxHp), 9)
}
export function drawPauseButton(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = INK; ctx.fillRect(332, 8, 4, 14); ctx.fillRect(340, 8, 4, 14)
}
```

- [ ] **Step 5:** Run `npx vitest run` — expect ALL green.
- [ ] **Step 6 (manual verify):** Wire `game.ts` to drive scenes: Title (tap → level card → play), HUD during play, pause button toggles Paused, clearing advances (boss every 4th), level 20 → Win, 0 lives → Game Over, high score persists across reloads.
- [ ] **Step 7:** Commit. `git commit -am "feat: scene machine, screens, HUD, high-score flow"`

---

## Task 17: Full integration in game.ts

**Files:**
- Create: `src/game/game.ts`
- Modify: `src/main.ts` (delegate everything to `Game`)

**Interfaces:**
- Consumes: every module above.
- Produces: `class Game { constructor(renderer, audio, vp); onPointer(x); onTap(); update(dt); draw() }` — owns scene, state, current level setup (wave or boss), bullets, powerups, shields, particles, shake; runs the per-scene update/draw.

- [ ] **Step 1:** Implement `Game` integrating: load level from `buildLevels()[level-1]`; if `isBoss` spawn `makeBoss(bossConfig(bossId))` else `buildWave`; each Play step: input→player, formation/boss update, enemy/boss fire, player fire (using `PowerState.maxBullets/fireInterval`), bullet updates, combat resolution, shield damage, power-up drops (`shouldDrop` on kill using level `ufoChance`/drop chance), UFO spawn, particle/shake/audio hooks, win/clear/death events via `nextScene`.
- [ ] **Step 2:** Reduce `src/main.ts` to: build canvas/ctx, resize→viewport, `loadSprites()`, construct `Audio`, `Game`; forward `pointerdown` (unlock audio + onTap + set targetX) and `pointermove` to `game.onPointer`; run `createLoop(game.update, game.draw)`.
- [ ] **Step 3 (manual verify — full playthrough):** Play levels 1→4, confirm a boss appears at 4 with a health bar; verify power-ups (rapid/spread/shield/life) all visibly work; lose all lives → Game Over; reach Win via a debug shortcut (temporarily start at level 20) then remove the shortcut. Run `npx vitest run` (all green).
- [ ] **Step 4:** Commit. `git commit -am "feat: integrate full game loop across all scenes"`

---

## Task 18: Face composite tool (depends on anna-face.jpg)

**Files:**
- Modify: `tools/process_sprites.py` (add `composite_face()`); regenerate `assets/sprites/player-ship.png`

**Interfaces:**
- Produces: a `composite_face(face_path, rocket_name='player-ship')` that circle-crops the photo and pastes it into the rocket porthole, overwriting `player-ship.png`.

- [ ] **Step 1:** Only if `assets/raw/anna-face.jpg` exists. Add to `tools/process_sprites.py`:

```python
def composite_face(face_path, out_name="player-ship"):
    """Circle-crop a portrait into the rocket porthole. Porthole box is tuned
    to the processed player-ship.png (a tall rocket sprite)."""
    rocket = Image.open(os.path.join(OUT, out_name + ".png")).convert("RGBA")
    W, H = rocket.size
    # porthole: horizontally centered, in the upper third
    d = int(W * 0.42)
    cx, cy = W // 2, int(H * 0.27)
    face = Image.open(face_path).convert("RGBA")
    s = min(face.size)
    face = face.crop(((face.width - s) // 2, (face.height - s) // 2,
                      (face.width + s) // 2, (face.height + s) // 2)).resize((d, d), Image.LANCZOS)
    mask = Image.new("L", (d, d), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d, d), fill=255)
    rocket.paste(face, (cx - d // 2, cy - d // 2), mask)
    rocket.save(os.path.join(OUT, out_name + ".png"))
    print(f"  composited face -> {out_name}.png")
```

And at the end of `__main__`, after `run()`:

```python
    fp = os.path.join(RAW, "anna-face.jpg")
    if os.path.exists(fp):
        composite_face(fp)
```

- [ ] **Step 2:** Run `python3 tools/process_sprites.py`. Open `assets/sprites/player-ship.png`; if the face is misaligned, nudge `d`, `cx`, `cy` and re-run.
- [ ] **Step 3 (manual verify):** `npm run dev`; confirm the player ship shows the sharp face in the porthole.
- [ ] **Step 4:** Commit. `git commit -am "feat: composite high-res face into player ship"`

---

## Task 19: PWA icons + build + deploy

**Files:**
- Create: `public/icons/icon-192.png`, `public/icons/icon-512.png` (generate from `logo`/`background` via a small script or export from the title screen)
- Verify: production build + responsive behavior; deploy to a static host.

- [ ] **Step 1:** Generate two app icons (192, 512) — a script using the existing art (e.g., the player ship on the nebula) is fine. Place in `public/icons/`.
- [ ] **Step 2:** Run `npm run build`. Expected: type-check passes, `dist/` produced with a service worker and manifest.
- [ ] **Step 3:** Run `npm run preview`; open in a narrow viewport (or device): verify portrait fit, safe areas, 60fps feel, audio after tap, "Add to Home Screen" works (icon + fullscreen).
- [ ] **Step 4:** Deploy `dist/` to a static host (GitHub Pages: push repo, enable Pages on the built output, or use the `gh-pages` branch flow; alternatively Netlify/Cloudflare Pages drag-drop). Capture the URL.
- [ ] **Step 5:** Commit. `git commit -am "chore: PWA icons, production build, deploy"`

---

## Self-Review

**Spec coverage:** platform/portrait/PWA (T1, T19), drag+auto-fire + one-shot rule (T4, T7), 20 data-driven levels (T12), bosses at 4/8/12/16/20 (T12, T14), ~4 rival types + UFO (T8, T13), power-ups rapid/spread/shield/life (T13), 3 lives + extra-life + respawn invuln (T11, T9), destructible shields (T10), scoring + local high score (T11), synth audio normal/boss + mute + tap-unlock (T15), juice — starfield/particles/shake (T7, T15), title "Anna's Galactic Invaders" + level cards + win/over + pause (T16), face-rocket player (T18), asset manifest wiring (T6). Covered.

**Placeholder scan:** No "TODO"/"TBD"/"add error handling". Visual/audio/integration steps specify exact behavior + a run-the-app verification; that is intentional for DOM/feel work, not a code placeholder.

**Type consistency:** `Sprite{x,y,w,h}` center-based used throughout; `POINTS` single-sourced in `scoring.ts` (T11 refactors T9); `PowerUpType` shared; `LevelConfig`/`BossConfig` defined in T12 and consumed by T8/T13/T14; `nextScene` events match between `scenes.ts` and `game.ts`. Consistent.
