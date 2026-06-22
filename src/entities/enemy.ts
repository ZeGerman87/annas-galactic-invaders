import type { Enemy } from '../core/types'
import { LOGICAL_W } from '../core/viewport'

// Per-level formation layout (which grid cells hold an enemy) and enemy-type mix,
// so each level looks different instead of the same layered rows.
type CellFn = (r: number, c: number, rows: number, cols: number) => boolean
type TypeFn = (r: number, c: number, rows: number, cols: number) => number

const WAVE_SHAPES: CellFn[] = [
  () => true,                                                            // full block
  (r, c) => (r + c) % 2 === 0,                                           // checkerboard
  (_r, c) => c % 2 === 0,                                                // columns
  (r, c, rows, cols) => r === 0 || r === rows - 1 || c === 0 || c === cols - 1, // hollow box
  (r, c, _rows, cols) => Math.abs(c - (cols - 1) / 2) <= r + 0.5,        // triangle (point up)
  (r, c, rows, cols) => Math.abs(c - (cols - 1) / 2) + Math.abs(r - (rows - 1) / 2) <= cols / 2, // diamond
]

const WAVE_TYPES: TypeFn[] = [
  (r) => r,                                                              // layered by row
  (_r, c) => c,                                                          // by column
  (r, c) => r + c,                                                       // diagonal mix
  (r, _c, rows) => Math.round((r / Math.max(1, rows - 1)) * 3),          // gradient by row
]

export function buildWave(level: number, rows: number, cols: number): Enemy[] {
  const shape = WAVE_SHAPES[(level - 1) % WAVE_SHAPES.length]
  const typeOf = WAVE_TYPES[(level - 1) % WAVE_TYPES.length]
  const cw = 32, ch = 28, gx = 12, gy = 14
  const totalW = cols * cw + (cols - 1) * gx
  const startX = (LOGICAL_W - totalW) / 2 + cw / 2
  const startY = 70

  const make = (cell: CellFn): Enemy[] => {
    const e: Enemy[] = []
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (!cell(r, c, rows, cols)) continue
        e.push({
          x: startX + c * (cw + gx),
          y: startY + r * (ch + gy),
          w: cw, h: ch,
          type: Math.max(0, Math.min(3, typeOf(r, c, rows, cols))),
          col: c, row: r, alive: true,
        })
      }
    }
    return e
  }

  let e = make(shape)
  if (e.length < 3) e = make(() => true) // guard: never spawn an (almost) empty wave
  return e
}
