import { describe, it, expect } from 'vitest'
import { PowerState, rollPowerUp, shouldDrop, DURATIONS } from '../src/systems/powerups'
import { mulberry32 } from '../src/core/rng'

describe('powerups', () => {
  it('rapid raises max bullets and shortens interval', () => {
    const p = new PowerState(); p.apply('rapid', () => {})
    expect(p.maxBullets()).toBe(4)
    expect(p.fireInterval(0.3)).toBeCloseTo(0.1, 5)
  })
  it('spread raises max bullets to 3 without rapid', () => {
    const p = new PowerState(); p.apply('spread', () => {})
    expect(p.maxBullets()).toBe(3)
  })
  it('effects expire after their duration', () => {
    const p = new PowerState(); p.apply('shield', () => {})
    expect(p.active('shield')).toBe(true)
    p.update(DURATIONS.shield + 0.1)
    expect(p.active('shield')).toBe(false)
  })
  it('life calls onLife and is not a timer', () => {
    const p = new PowerState(); let lives = 3
    p.apply('life', () => { lives++ })
    expect(lives).toBe(4)
  })
  it('rng-seeded rolls are valid and drop gate works', () => {
    const r = mulberry32(7)
    const kinds = [rollPowerUp(r), rollPowerUp(r), rollPowerUp(r)]
    expect(kinds.every((k) => ['rapid', 'spread', 'shield', 'life'].includes(k))).toBe(true)
    expect(shouldDrop(() => 0.01, 0.1)).toBe(true)
    expect(shouldDrop(() => 0.9, 0.1)).toBe(false)
  })
})
