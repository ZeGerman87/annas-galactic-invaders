import type { PowerUp, PowerUpType } from '../core/types'

export function spawnPowerUp(items: PowerUp[], x: number, y: number, kind: PowerUpType) {
  items.push({ x, y, w: 22, h: 22, vy: 90, kind, dead: false })
}

export function updatePowerUps(items: PowerUp[], dt: number, logicalH: number): PowerUp[] {
  for (const p of items) { p.y += p.vy * dt; if (p.y > logicalH + 20) p.dead = true }
  return items.filter((p) => !p.dead)
}

export const POWERUP_SPRITE: Record<PowerUpType, string> = {
  rapid: 'powerup-rapid',
  spread: 'powerup-spread',
  shield: 'powerup-shield',
  life: 'powerup-life',
}
