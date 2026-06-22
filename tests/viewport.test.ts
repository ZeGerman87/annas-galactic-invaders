import { describe, it, expect } from 'vitest'
import { computeViewport, toLogical, LOGICAL_W } from '../src/core/viewport'

describe('viewport', () => {
  it('scales by width', () => {
    const v = computeViewport(720, 1280)
    expect(LOGICAL_W).toBe(360)
    expect(v.scale).toBe(2)
    expect(v.logicalH).toBe(640)
  })
  it('maps client coords to logical', () => {
    const p = toLogical(100, 200, 0, 0, 2)
    expect(p).toEqual({ x: 50, y: 100 })
  })
})
