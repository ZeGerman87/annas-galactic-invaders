import type { Bullet, Enemy } from '../core/types'
import type { Player } from '../entities/player'
import { aabb } from './collision'
import { spawnBullet } from '../entities/bullet'
import { POINTS } from './scoring'

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
    const alive = enemies.filter((e) => e.alive)
    if (!alive.length) return
    const shooter = alive[Math.floor(rng() * alive.length)]
    spawnBullet(bullets, shooter.x, shooter.y + shooter.h / 2, 220, 'enemy', 12, 16)
  }
}
