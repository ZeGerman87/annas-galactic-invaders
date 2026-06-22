import type { PowerUpType } from '../core/types'

type Effect = Exclude<PowerUpType, 'life'> // 'rapid' | 'spread' | 'shield'
type Fire = 'rapid' | 'spread'

// Two independent slots:
//  - fire: the shooting power-up (rapid/spread) — a new one replaces the old.
//  - shield: a one-hit bubble, independent of the fire slot.
// Both persist until a real (unshielded) hit. Extra life is instant.
export class PowerState {
  private fire: Fire | null = null
  private shield = false

  apply(kind: PowerUpType, onLife: () => void) {
    if (kind === 'life') { onLife(); return }
    if (kind === 'shield') { this.shield = true; return } // doesn't disturb the fire slot
    this.fire = kind // rapid/spread replaces only the current fire power-up
  }

  active(kind: Effect) { return kind === 'shield' ? this.shield : this.fire === kind }
  maxBullets() { return this.fire === 'rapid' ? 4 : this.fire === 'spread' ? 3 : 1 }
  fireInterval(base: number) { return this.fire === 'rapid' ? base / 3 : base }
  hasShield() { return this.shield }
  popShield() { this.shield = false }  // the bubble absorbed a hit
  clearFire() { this.fire = null }     // a real (unshielded) hit strips the shooting power-up
}

export function rollPowerUp(rng: () => number): PowerUpType {
  // weighted toward the shooting power-ups; shield is rarer (it's strong and has the bubble)
  const r = rng()
  return r < 0.38 ? 'rapid' : r < 0.72 ? 'spread' : r < 0.9 ? 'shield' : 'life'
}

export function shouldDrop(rng: () => number, chance: number): boolean {
  return rng() < chance
}
