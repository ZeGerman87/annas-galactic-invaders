import type { Bullet, Sprite } from '../core/types'
import { clampX, canFire } from '../core/input'
import { LOGICAL_W } from '../core/viewport'
import { spawnBullet, activePlayerBullets } from './bullet'

export interface Player { sprite: Sprite; fireTimer: number; speed: number; invuln: number }

export function makePlayer(logicalH: number): Player {
  return { sprite: { x: LOGICAL_W / 2, y: logicalH - 80, w: 30, h: 54 }, fireTimer: 0, speed: 600, invuln: 0 }
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
  spawnBullet(bullets, p.sprite.x, p.sprite.y - p.sprite.h / 2, -480, 'player', 15, 17)
  p.fireTimer = interval
}
