import type { PowerUpType } from '../core/types'

type Timed = Exclude<PowerUpType, 'life'>
export const DURATIONS: Record<Timed, number> = { rapid: 8, spread: 8, shield: 6 }

export class PowerState {
  private timers: Record<Timed, number> = { rapid: 0, spread: 0, shield: 0 }

  apply(kind: PowerUpType, onLife: () => void) {
    if (kind === 'life') { onLife(); return }
    this.timers[kind] = DURATIONS[kind]
  }
  update(dt: number) {
    (Object.keys(this.timers) as Timed[]).forEach((k) => { this.timers[k] = Math.max(0, this.timers[k] - dt) })
  }
  active(kind: Timed) { return this.timers[kind] > 0 }
  maxBullets() { return this.active('rapid') ? 4 : this.active('spread') ? 3 : 1 }
  fireInterval(base: number) { return this.active('rapid') ? base / 3 : base }
  hasShield() { return this.active('shield') }
}

export function rollPowerUp(rng: () => number): PowerUpType {
  const r = rng()
  return r < 0.34 ? 'rapid' : r < 0.64 ? 'spread' : r < 0.9 ? 'shield' : 'life'
}

export function shouldDrop(rng: () => number, chance: number): boolean {
  return rng() < chance
}
