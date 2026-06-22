import { describe, it, expect } from 'vitest'
import { buildShields, damageShields } from '../src/systems/shields'
import type { Bullet } from '../src/core/types'

describe('shields', () => {
  it('builds three bunkers of cells', () => {
    const c = buildShields(640)
    expect(c.length).toBeGreaterThan(12)
    expect(c.every((x) => x.alive)).toBe(true)
  })
  it('a bullet erodes a cell and dies', () => {
    const c = buildShields(640)
    const target = c[0]
    const b: Bullet[] = [{ x: target.x, y: target.y, w: 8, h: 16, vx: 0, vy: 0, from: 'player', dead: false }]
    damageShields(b, c)
    expect(b[0].dead).toBe(true)
    expect(target.alive).toBe(false)
  })
})
