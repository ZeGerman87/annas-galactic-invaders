import { describe, it, expect } from 'vitest'
import { clampX, canFire } from '../src/core/input'

describe('input helpers', () => {
  it('clamps ship within field', () => {
    expect(clampX(-5, 20)).toBe(20)
    expect(clampX(400, 20, 360)).toBe(340)
    expect(clampX(180, 20)).toBe(180)
  })
  it('fire gate respects max bullets', () => {
    expect(canFire(0, 1)).toBe(true)
    expect(canFire(1, 1)).toBe(false)
    expect(canFire(3, 4)).toBe(true)
  })
})
