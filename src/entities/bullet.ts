import type { Bullet } from '../core/types'

export function spawnBullet(b: Bullet[], x: number, y: number, vy: number, from: Bullet['from'], w = 14, h = 16) {
  b.push({ x, y, w, h, vx: 0, vy, from, dead: false })
}

export function updateBullets(b: Bullet[], dt: number, logicalH: number): Bullet[] {
  for (const o of b) {
    o.x += o.vx * dt
    o.y += o.vy * dt
    if (o.y < -20 || o.y > logicalH + 20) o.dead = true
  }
  return b.filter((o) => !o.dead)
}

export function activePlayerBullets(b: Bullet[]): number {
  return b.filter((o) => o.from === 'player' && !o.dead).length
}
