import type { Bullet, Sprite } from '../core/types'
import { LOGICAL_W } from '../core/viewport'
import { aabb } from './collision'

export interface ShieldCell extends Sprite { hp: number; alive: boolean }

// A different bunker shape per level for visual variety (cycles).
const SHAPES: string[][] = [
  ['XXXXX', 'XXXXX', 'XX.XX'],         // block with a doorway
  ['..X..', '.XXX.', 'XXXXX'],         // pyramid
  ['XXXXX', 'X...X', 'X...X'],         // arch / cup
  ['.XXX.', 'XX.XX', 'X...X'],         // peaked legs
  ['X.X.X', 'XXXXX', 'X.X.X'],         // lattice
  ['..X..', '.XXX.', 'XXXXX', '.X.X.'], // tree
]

export function buildShields(logicalH: number, level = 1): ShieldCell[] {
  const shape = SHAPES[(level - 1) % SHAPES.length]
  const rows = shape.length
  const cols = shape[0].length
  const cell = 9
  const bunkers = 3
  const y0 = logicalH - 150
  const cells: ShieldCell[] = []
  for (let b = 0; b < bunkers; b++) {
    const bx = (LOGICAL_W / (bunkers + 1)) * (b + 1) - (cols * cell) / 2
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c] !== 'X') continue
        cells.push({ x: bx + c * cell + cell / 2, y: y0 + r * cell, w: cell, h: cell, hp: 1, alive: true })
      }
    }
  }
  return cells
}

export function damageShields(bullets: Bullet[], cells: ShieldCell[]): void {
  for (const b of bullets) {
    if (b.dead || b.from === 'player') continue // player shots pass through shields
    for (const c of cells) {
      if (!c.alive) continue
      if (aabb(b, c)) { c.hp -= 1; if (c.hp <= 0) c.alive = false; b.dead = true; break }
    }
  }
}
