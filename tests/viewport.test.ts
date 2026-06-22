import { describe, it, expect } from 'vitest'
import { computeViewport, toLogical, LOGICAL_W } from '../src/core/viewport'

describe('viewport', () => {
  it('scales by width relative to the logical playfield', () => {
    const v = computeViewport(LOGICAL_W * 2, 1280)
    expect(v.scale).toBe(2)
    expect(v.logicalH).toBe(640)
  })
  it('maps client coords to logical', () => {
    expect(toLogical(100, 200, 0, 0, 2)).toEqual({ x: 50, y: 100 })
  })
})
