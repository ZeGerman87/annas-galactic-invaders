import { describe, it, expect } from 'vitest'
import { PowerState, rollPowerUp, shouldDrop } from '../src/systems/powerups'
import { mulberry32 } from '../src/core/rng'

describe('powerups', () => {
  it('rapid raises max bullets and shortens interval', () => {
    const p = new PowerState(); p.apply('rapid', () => {})
    expect(p.maxBullets()).toBe(4)
    expect(p.fireInterval(0.3)).toBeCloseTo(0.1, 5)
  })
  it('spread raises max bullets to 3', () => {
    const p = new PowerState(); p.apply('spread', () => {})
    expect(p.maxBullets()).toBe(3)
  })
  it('a new fire power-up replaces the previous one', () => {
    const p = new PowerState(); p.apply('rapid', () => {}); p.apply('spread', () => {})
    expect(p.active('rapid')).toBe(false)
    expect(p.active('spread')).toBe(true)
  })
  it('shield is independent of the fire power-up and absorbs one hit', () => {
    const p = new PowerState(); p.apply('rapid', () => {}); p.apply('shield', () => {})
    expect(p.maxBullets()).toBe(4)   // rapid kept
    expect(p.hasShield()).toBe(true)
    p.popShield()
    expect(p.hasShield()).toBe(false)
    expect(p.maxBullets()).toBe(4)   // still rapid after the shield pops
  })
  it('extra life is instant and does not touch the fire power-up', () => {
    const p = new PowerState(); p.apply('rapid', () => {})
    let lives = 3; p.apply('life', () => { lives++ })
    expect(lives).toBe(4)
    expect(p.maxBullets()).toBe(4)
  })
  it('a real hit clears the fire power-up', () => {
    const p = new PowerState(); p.apply('rapid', () => {}); p.clearFire()
    expect(p.maxBullets()).toBe(1)
  })
  it('rng rolls are valid and the drop gate works', () => {
    const r = mulberry32(7)
    expect(['rapid', 'spread', 'shield', 'life']).toContain(rollPowerUp(r))
    expect(shouldDrop(() => 0.01, 0.1)).toBe(true)
    expect(shouldDrop(() => 0.9, 0.1)).toBe(false)
  })
})
