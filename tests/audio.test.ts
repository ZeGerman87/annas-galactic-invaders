import { describe, it, expect } from 'vitest'
import { AudioEngine } from '../src/core/audio'

describe('audio gating', () => {
  it('sfx is a no-op before unlock and mute toggles', () => {
    const a = new AudioEngine()
    expect(() => a.sfx('shoot')).not.toThrow()
    a.setMuted(true)
    expect(a.toggleMuted()).toBe(false)
    expect(a.toggleMuted()).toBe(true)
  })
})
