import { describe, it, expect } from 'vitest'
import { buildWave } from '../src/entities/enemy'
import { stepFormation } from '../src/systems/formation'

describe('formation', () => {
  it('level 1 is a full grid layered by row', () => {
    const e = buildWave(1, 2, 5)
    expect(e.length).toBe(10)
    expect(e.every((x) => x.alive)).toBe(true)
    expect(e[0].type).toBe(0)
    expect(e[5].type).toBe(1)
  })
  it('reverses and drops at the edge', () => {
    const e = buildWave(1, 1, 1); e[0].x = 350; e[0].w = 24
    const r = stepFormation(e, 1, 1, { left: 6, right: 354 }, 40, 10, 1)
    expect(r.dir).toBe(-1)
    expect(r.dropped).toBe(true)
    expect(e[0].y).toBeGreaterThan(70)
  })
  it('speeds up as enemies die', () => {
    const e = buildWave(1, 1, 4); e.slice(1).forEach((x) => { x.alive = false })
    const before = e[0].x
    stepFormation(e, 1, 1, { left: 0, right: 1000 }, 10, 10, 4) // 1 of 4 alive
    expect(e[0].x - before).toBeGreaterThan(10) // faster than the base speed
  })
  it('different levels produce different formation shapes', () => {
    expect(buildWave(1, 3, 5).length).not.toBe(buildWave(2, 3, 5).length)
  })
})
