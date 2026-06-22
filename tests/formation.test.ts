import { describe, it, expect } from 'vitest'
import { buildWave } from '../src/entities/enemy'
import { stepFormation } from '../src/systems/formation'

describe('formation', () => {
  it('builds a centered grid', () => {
    const e = buildWave(2, 5, [0, 1])
    expect(e.length).toBe(10)
    expect(e.every((x) => x.alive)).toBe(true)
    expect(e[0].type).toBe(0)
    expect(e[5].type).toBe(1)
  })
  it('reverses and drops at right edge', () => {
    const e = buildWave(1, 1, [0]); e[0].x = 350; e[0].w = 24
    const r = stepFormation(e, 1, 1, { left: 6, right: 354 }, 40, 10, 1)
    expect(r.dir).toBe(-1)
    expect(r.dropped).toBe(true)
    expect(e[0].y).toBeGreaterThan(70)
  })
  it('speeds up as enemies die', () => {
    const e = buildWave(1, 4, [0]); e.slice(1).forEach((x) => { x.alive = false })
    const before = e[0].x
    stepFormation(e, 1, 1, { left: 0, right: 1000 }, 10, 10, 4) // 1 of 4 alive -> ~3x
    expect(e[0].x - before).toBeGreaterThan(10 * 2)
  })
})
