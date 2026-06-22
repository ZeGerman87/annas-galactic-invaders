import type { Enemy } from '../core/types'
import { LOGICAL_W } from '../core/viewport'

export function buildWave(rows: number, cols: number, rowTypes: number[]): Enemy[] {
  const e: Enemy[] = []
  const cw = 32, ch = 28, gx = 12, gy = 14
  const totalW = cols * cw + (cols - 1) * gx
  const startX = (LOGICAL_W - totalW) / 2 + cw / 2
  const startY = 70
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      e.push({
        x: startX + c * (cw + gx),
        y: startY + r * (ch + gy),
        w: cw, h: ch,
        type: rowTypes[r] ?? 0,
        col: c, row: r, alive: true,
      })
    }
  }
  return e
}
