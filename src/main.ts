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
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  vp = computeViewport(innerWidth, innerHeight)
  pointer.setScale(vp.scale)
  // Draw in logical units (360-wide playfield), crisp on retina.
  ctx.setTransform(dpr * vp.scale, 0, 0, dpr * vp.scale, 0, 0)
}
addEventListener('resize', resize)

function aspect(img: CanvasImageSource): number {
  const w = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width
  const h = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height
  return w ? h / w : 1
}

loadSprites().then((images) => {
  resize()
  const r = new Renderer(ctx, images)
  const rng = mulberry32(1234)
  const stars = new Starfield(vp.logicalH, rng)
  const player = makePlayer(vp.logicalH)
  const pImg = images.get('player-ship')
  if (pImg) player.sprite.h = player.sprite.w * aspect(pImg)
  const bullets: Bullet[] = []

  createLoop(
    (dt) => {
      stars.update(dt)
      updatePlayer(player, pointer.targetX, dt)
      firePlayer(player, bullets, 1, 0.35)
      const kept = updateBullets(bullets, dt, vp.logicalH)
      bullets.length = 0
      bullets.push(...kept)
    },
    () => {
      r.clear(360, vp.logicalH)
      r.drawBackground('background', 360, vp.logicalH)
      stars.draw(ctx)
      for (const b of bullets) r.drawSprite('shot-player', b)
      r.drawSprite('player-ship', player.sprite)
    },
  ).start()
})
