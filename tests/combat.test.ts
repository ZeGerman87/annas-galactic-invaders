import { describe, it, expect } from 'vitest'
import { resolvePlayerHits, resolveEnemyHits } from '../src/systems/combat'
import type { Bullet, Enemy } from '../src/core/types'

const enemy = (x: number, y: number): Enemy => ({ x, y, w: 30, h: 28, type: 1, col: 0, row: 0, alive: true })
const bullet = (x: number, y: number, from: Bullet['from']): Bullet => ({ x, y, w: 8, h: 20, vx: 0, vy: 0, from, dead: false })

describe('combat', () => {
  it('player bullet kills overlapping enemy and scores by type', () => {
    const e = [enemy(100, 100)]; const b = [bullet(100, 100, 'player')]
    const r = resolvePlayerHits(b, e)
    expect(e[0].alive).toBe(false)
    expect(b[0].dead).toBe(true)
    expect(r.kills).toBe(1)
    expect(r.points).toBe(20)
  })
  it('enemy bullet hits vulnerable player', () => {
    const p = { sprite: { x: 50, y: 50, w: 30, h: 34 }, fireTimer: 0, speed: 0, invuln: 0 }
    const b = [bullet(50, 50, 'enemy')]
    expect(resolveEnemyHits(b, p as never)).toBe(true)
    expect(b[0].dead).toBe(true)
  })
  it('invulnerable player is not hit', () => {
    const p = { sprite: { x: 50, y: 50, w: 30, h: 34 }, fireTimer: 0, speed: 0, invuln: 1 }
    const b = [bullet(50, 50, 'enemy')]
    expect(resolveEnemyHits(b, p as never)).toBe(false)
  })
})
