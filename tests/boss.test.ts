import { describe, it, expect } from 'vitest'
import { makeBoss, bossPhase, damageBoss, bossDefeated } from '../src/entities/boss'
import { bossConfig } from '../src/game/levels'
import type { Bullet } from '../src/core/types'

describe('boss', () => {
  it('phase escalates as hp drops', () => {
    expect(bossPhase(100, 100)).toBe(0)
    expect(bossPhase(50, 100)).toBe(1)
    expect(bossPhase(20, 100)).toBe(2)
  })
  it('player bullets damage boss and can defeat it', () => {
    const b = makeBoss(bossConfig(1), 640)
    b.hp = 3
    const bullets: Bullet[] = [
      { x: b.sprite.x, y: b.sprite.y, w: 8, h: 20, vx: 0, vy: -1, from: 'player', dead: false },
    ]
    const dmg = damageBoss(bullets, b)
    expect(dmg).toBe(1)
    expect(bullets[0].dead).toBe(true)
    expect(b.hp).toBe(2)
    b.hp = 0
    expect(bossDefeated(b)).toBe(true)
  })
})
