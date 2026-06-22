import { describe, it, expect } from 'vitest'
import { buildShields, damageShields } from '../src/systems/shields'
import type { Bullet } from '../src/core/types'

const shot = (x: number, y: number, from: Bullet['from']): Bullet =>
  ({ x, y, w: 8, h: 16, vx: 0, vy: 0, from, dead: false })

describe('shields', () => {
  it('builds bunkers of cells', () => {
    const c = buildShields(640, 1)
    expect(c.length).toBeGreaterThan(12)
    expect(c.every((x) => x.alive)).toBe(true)
  })
  it('enemy shots erode cells; player shots pass through', () => {
    const cells = buildShields(640, 1)
    const target = cells[0]
    const enemy = [shot(target.x, target.y, 'enemy')]
    damageShields(enemy, cells)
    expect(enemy[0].dead).toBe(true)
    expect(target.alive).toBe(false)

    const survivor = cells.find((c) => c.alive)!
    const player = [shot(survivor.x, survivor.y, 'player')]
    damageShields(player, cells)
    expect(player[0].dead).toBe(false)   // not consumed
    expect(survivor.alive).toBe(true)    // not eroded
  })
  it('different levels produce different shapes', () => {
    expect(buildShields(640, 1).length).not.toBe(buildShields(640, 2).length)
  })
})
