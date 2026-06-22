import type { Bullet, Sprite } from '../core/types'
import type { BossConfig } from '../game/levels'
import { LOGICAL_W } from '../core/viewport'
import { aabb } from '../systems/collision'
import { spawnBullet } from './bullet'

export interface Boss { sprite: Sprite; hp: number; maxHp: number; dir: number; t: number }

export function makeBoss(cfg: BossConfig, _logicalH: number): Boss {
  const w = 120 + cfg.id * 10
  return { sprite: { x: LOGICAL_W / 2, y: 130, w, h: w * 0.7 }, hp: cfg.hp, maxHp: cfg.hp, dir: 1, t: 0 }
}

export function bossPhase(hp: number, maxHp: number): 0 | 1 | 2 {
  const f = hp / maxHp
  return f > 0.66 ? 0 : f > 0.33 ? 1 : 2
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

export function updateBoss(
  b: Boss, cfg: BossConfig, dt: number,
  bounds: { left: number; right: number }, rng: () => number, bullets: Bullet[],
) {
  b.t += dt
  const phase = bossPhase(b.hp, b.maxHp)
  b.sprite.x += b.dir * (50 + phase * 30) * dt
  if (b.sprite.x - b.sprite.w / 2 < bounds.left || b.sprite.x + b.sprite.w / 2 > bounds.right) b.dir *= -1
  const rate = cfg.fireRate * (1 + phase * 0.6)
  if (rng() < rate * dt) {
    const spread = phase >= 1 ? [-60, 0, 60] : [0]
    for (const vx of spread) {
      spawnBullet(bullets, b.sprite.x, b.sprite.y + b.sprite.h / 2, 200, 'boss', 14, 22)
      bullets[bullets.length - 1].vx = vx
    }
  }
}
