import { computeViewport } from './core/viewport'
import { createLoop } from './core/loop'
import { Pointer } from './core/input'
import { loadSprites } from './core/assets'
import { mulberry32 } from './core/rng'
import { Renderer } from './render/renderer'
import { Starfield } from './render/starfield'
import { makePlayer, updatePlayer, firePlayer } from './entities/player'
import { updateBullets } from './entities/bullet'
import { buildWave } from './entities/enemy'
import { stepFormation } from './systems/formation'
import { resolvePlayerHits, resolveEnemyHits, enemyFire } from './systems/combat'
import { buildShields, damageShields } from './systems/shields'
import { levelClearBonus } from './systems/scoring'
import { GameState } from './game/state'
import type { Bullet, Enemy } from './core/types'

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
  const gs = new GameState()
  gs.loadHigh()

  const player = makePlayer(vp.logicalH)
  const pImg = images.get('player-ship')
  if (pImg) player.sprite.h = player.sprite.w * aspect(pImg)

  const bullets: Bullet[] = []
  let enemies: Enemy[] = buildWave(3, 6, [0, 1, 2])
  let total = enemies.length
  let dir = 1
  let shields = buildShields(vp.logicalH)
  const bounds = { left: 8, right: 352 }

  const enemyDrawH = (type: number) => {
    const img = r.image(`enemy-0${type + 1}`)
    return 30 * (img ? aspect(img) : 1)
  }

  const newWave = () => {
    enemies = buildWave(3, 6, [0, 1, 2]); total = enemies.length; dir = 1
    shields = buildShields(vp.logicalH)
  }

  createLoop(
    (dt) => {
      stars.update(dt)
      updatePlayer(player, pointer.targetX, dt)
      firePlayer(player, bullets, 1, 0.35)

      dir = stepFormation(enemies, dir, dt, bounds, 16, 12, total).dir
      enemyFire(enemies, bullets, rng, 0.9, dt)

      const kept = updateBullets(bullets, dt, vp.logicalH)
      bullets.length = 0
      bullets.push(...kept)

      damageShields(bullets, shields)
      const hit = resolvePlayerHits(bullets, enemies)
      if (hit.points) gs.addScore(hit.points)

      if (resolveEnemyHits(bullets, player)) {
        player.invuln = 1.5
        if (gs.loseLife()) {
          // Temporary soft-reset (proper game-over screen arrives in Task 16).
          gs.commitHigh(); gs.score = 0; gs.lives = 3; newWave()
        }
      }

      if (!enemies.some((e) => e.alive)) { gs.addScore(levelClearBonus(gs.level)); newWave() }
    },
    () => {
      r.clear(360, vp.logicalH)
      r.drawBackground('background', 360, vp.logicalH)
      stars.draw(ctx)

      for (const e of enemies) {
        if (!e.alive) continue
        r.drawSprite(`enemy-0${e.type + 1}`, { x: e.x, y: e.y, w: 30, h: enemyDrawH(e.type) })
      }

      ctx.fillStyle = '#5bbf36'
      for (const c of shields) {
        if (c.alive) ctx.fillRect(c.x - c.w / 2, c.y - c.h / 2, c.w, c.h)
      }

      for (const b of bullets) r.drawSprite(b.from === 'player' ? 'shot-player' : 'shot-enemy', b)

      if (player.invuln <= 0 || Math.floor(player.invuln * 10) % 2 === 0) {
        r.drawSprite('player-ship', player.sprite)
      }

      ctx.fillStyle = '#e1dfff'
      ctx.font = '14px ui-monospace, monospace'
      ctx.textAlign = 'left'
      ctx.fillText(`SCORE ${gs.score}`, 10, 26)
      ctx.textAlign = 'right'
      ctx.fillText(`♥ ${gs.lives}`, 352, 26)
      ctx.textAlign = 'left'
    },
  ).start()
})
