import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GameState } from '../src/game/state'
import { levelClearBonus } from '../src/systems/scoring'

beforeEach(() => {
  const store: Record<string, string> = {}
  vi.stubGlobal('localStorage', {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = v },
  })
})

describe('GameState', () => {
  it('loses lives down to game over', () => {
    const g = new GameState()
    expect(g.lives).toBe(3)
    expect(g.loseLife()).toBe(false)
    expect(g.loseLife()).toBe(false)
    expect(g.loseLife()).toBe(true)
  })
  it('grants an extra life crossing the threshold', () => {
    const g = new GameState(); g.addScore(4999); const before = g.lives
    g.addScore(2)
    expect(g.lives).toBe(before + 1)
  })
  it('commits a new high score', () => {
    const g = new GameState(); g.addScore(1200); g.commitHigh()
    const g2 = new GameState(); g2.loadHigh()
    expect(g2.high).toBe(1200)
  })
  it('level clear bonus grows with level', () => {
    expect(levelClearBonus(1)).toBeLessThan(levelClearBonus(10))
  })
})
