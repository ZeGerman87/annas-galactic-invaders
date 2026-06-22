import type { Bullet, Sprite } from '../core/types'
import { LOGICAL_W } from '../core/viewport'
import { aabb } from './collision'

export interface ShieldCell extends Sprite { hp: number; alive: boolean }

export function buildShields(logicalH: number): ShieldCell[] {
  const cells: ShieldCell[] = []
  const cols = 5, rows = 3, cell = 9, bunkers = 3
  const y0 = logicalH - 150
  for (let b = 0; b < bunkers; b++) {
    const bx = (LOGICAL_W / (bunkers + 1)) * (b + 1) - (cols * cell) / 2
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        cells.push({ x: bx + c * cell + cell / 2, y: y0 + r * cell, w: cell, h: cell, hp: 1, alive: true })
      }
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
