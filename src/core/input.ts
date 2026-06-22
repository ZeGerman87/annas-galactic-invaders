import { LOGICAL_W, toLogical } from './viewport'

export function clampX(x: number, halfW: number, fieldW = LOGICAL_W): number {
  return Math.max(halfW, Math.min(fieldW - halfW, x))
}

export function canFire(activeBullets: number, maxBullets: number): boolean {
  return activeBullets < maxBullets
}

export class Pointer {
  targetX: number | null = null
  private scale = 1
  setScale(s: number) { this.scale = s }
  attach(canvas: HTMLCanvasElement) {
    const set = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect()
      this.targetX = toLogical(e.clientX, e.clientY, r.left, r.top, this.scale).x
    }
    canvas.addEventListener('pointerdown', set)
    canvas.addEventListener('pointermove', (e) => { if (e.pressure > 0 || e.buttons) set(e) })
  }
}
