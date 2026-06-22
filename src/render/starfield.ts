import { LOGICAL_W } from '../core/viewport'

interface Star { x: number; y: number; s: number; v: number }

export class Starfield {
  stars: Star[] = []
  constructor(private h: number, rng: () => number, n = 60) {
    for (let i = 0; i < n; i++) {
      this.stars.push({ x: rng() * LOGICAL_W, y: rng() * h, s: rng() * 1.5 + 0.5, v: rng() * 30 + 10 })
    }
  }
  update(dt: number) {
    for (const s of this.stars) {
      s.y += s.v * dt
      if (s.y > this.h) { s.y = 0; s.x = Math.random() * LOGICAL_W }
    }
  }
  draw(ctx: CanvasRenderingContext2D) {
    ctx.fillStyle = '#ffffff'
    for (const s of this.stars) { ctx.globalAlpha = s.s / 2; ctx.fillRect(s.x, s.y, s.s, s.s) }
    ctx.globalAlpha = 1
  }
}
