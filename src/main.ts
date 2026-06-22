import { computeViewport } from './core/viewport'
import { createLoop } from './core/loop'
import { Pointer } from './core/input'
import { loadSprites } from './core/assets'
import { Renderer } from './render/renderer'
import { Game } from './game/game'

const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!
let vp = computeViewport(innerWidth, innerHeight)
const pointer = new Pointer()
pointer.attach(canvas)

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 3)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  vp = computeViewport(innerWidth, innerHeight)
  pointer.setScale(vp.scale)
  ctx.setTransform(dpr * vp.scale, 0, 0, dpr * vp.scale, 0, 0)
}
addEventListener('resize', resize)

function startLevel(): number {
  const n = Number(new URLSearchParams(location.search).get('level'))
  return Number.isInteger(n) && n >= 1 && n <= 20 ? n : 1
}

loadSprites().then((images) => {
  resize()
  const r = new Renderer(ctx, images)
  const game = new Game(r, vp.logicalH, startLevel())
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect()
    const lx = (e.clientX - rect.left) / vp.scale
    const ly = (e.clientY - rect.top) / vp.scale
    if (game.onTap(lx, ly)) pointer.targetX = null // tap hit the mute button — don't move the ship
  })
  createLoop((dt) => game.update(dt, pointer.targetX), () => game.draw(ctx)).start()
})
