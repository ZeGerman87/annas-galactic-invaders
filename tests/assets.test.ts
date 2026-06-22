import { describe, it, expect } from 'vitest'
import { REQUIRED } from '../src/core/assets'

describe('asset manifest', () => {
  it('lists every required sprite name', () => {
    const need = [
      'player-ship', 'ufo', 'background', 'shot-player', 'shot-enemy', 'shot-boss',
      'enemy-01', 'enemy-02', 'enemy-03', 'enemy-04',
      'boss-01', 'boss-02', 'boss-03', 'boss-04', 'boss-05',
      'powerup-rapid', 'powerup-spread', 'powerup-shield', 'powerup-life',
      'shield-block', 'logo',
    ]
    need.forEach((n) => expect(REQUIRED).toContain(n))
    expect(REQUIRED.length).toBe(need.length)
  })
})
