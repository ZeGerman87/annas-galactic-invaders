import { describe, it, expect } from 'vitest'
import { drainSteps } from '../src/core/loop'

describe('drainSteps', () => {
  it('drains whole fixed steps and keeps remainder', () => {
    const r = drainSteps(0.05, 1 / 60)
    expect(r.steps).toBe(3)
    expect(r.rem).toBeCloseTo(0.05 - 3 / 60, 6)
  })
  it('zero when below one step', () => {
    expect(drainSteps(0.01, 1 / 60).steps).toBe(0)
  })
})
