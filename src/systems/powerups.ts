import type { PowerUpType } from '../core/types'

type Timed = Exclude<PowerUpType, 'life'>

// Power-ups persist until the player takes a hit (PowerState is recreated then).
// No time expiry — they carry across levels and boss fights.
export class PowerState {
  private on = new Set<Timed>()

  apply(kind: PowerUpType, onLife: () => void) {
    if (kind === 'life') { onLife(); return }
    this.on.clear() // one active power-up at a time — a new pickup replaces the old
    this.on.add(kind)
  }
  active(kind: Timed) { return this.on.has(kind) }
  maxBullets() { return this.on.has('rapid') ? 4 : this.on.has('spread') ? 3 : 1 }
  fireInterval(base: number) { return this.on.has('rapid') ? base / 3 : base }
  hasShield() { return this.on.has('shield') }
}

export function rollPowerUp(rng: () => number): PowerUpType {
  const r = rng()
  return r < 0.34 ? 'rapid' : r < 0.64 ? 'spread' : r < 0.9 ? 'shield' : 'life'
}

export function shouldDrop(rng: () => number, chance: number): boolean {
  return rng() < chance
}
