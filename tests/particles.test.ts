import { describe, it, expect } from 'vitest'
import { burst, updateParticles } from '../src/render/particles'
import { mulberry32 } from '../src/core/rng'

describe('particles', () => {
  it('burst makes n particles, update expires them', () => {
    const ps = burst(10, 10, 12, mulberry32(3), '#fff')
    expect(ps.length).toBe(12)
    let cur = ps
    for (let i = 0; i < 200; i++) cur = updateParticles(cur, 0.05)
    expect(cur.length).toBe(0)
  })
})
