import { describe, it, expect } from 'vitest'
import { buildLevels, BOSS_LEVELS, bossConfig } from '../src/game/levels'

describe('levels', () => {
  const L = buildLevels()
  it('has exactly 20 levels indexed 1..20', () => {
    expect(L.length).toBe(20)
    expect(L.map((l) => l.index)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1))
  })
  it('marks boss levels and numbers bosses 1..5', () => {
    expect(L.filter((l) => l.isBoss).map((l) => l.index)).toEqual(BOSS_LEVELS)
    expect(L.filter((l) => l.isBoss).map((l) => l.bossId)).toEqual([1, 2, 3, 4, 5])
  })
  it('non-boss difficulty is non-decreasing in speed', () => {
    const speeds = L.filter((l) => !l.isBoss).map((l) => l.baseSpeed)
    for (let i = 1; i < speeds.length; i++) expect(speeds[i]).toBeGreaterThanOrEqual(speeds[i - 1])
  })
  it('caps grid size and references valid enemy types', () => {
    for (const l of L) if (!l.isBoss) {
      expect(l.cols).toBeLessThanOrEqual(9)
      expect(l.rows).toBeLessThanOrEqual(5)
      expect(l.rowTypes.every((t) => t >= 0 && t <= 3)).toBe(true)
    }
  })
  it('boss config scales hp with id', () => {
    expect(bossConfig(5).hp).toBeGreaterThan(bossConfig(1).hp)
    expect(bossConfig(3).sprite).toBe('boss-03')
  })
})
