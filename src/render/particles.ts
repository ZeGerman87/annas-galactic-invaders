export interface Particle { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number }

export function burst(x: number, y: number, n: number, rng: () => number, color: string): Particle[] {
  const ps: Particle[] = []
  for (let i = 0; i < n; i++) {
    const a = rng() * Math.PI * 2
    const sp = 40 + rng() * 160
    const life = 0.3 + rng() * 0.5
    ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life, max: life, color, size: 1 + rng() * 2.5 })
  }
  return ps
}

export function updateParticles(ps: Particle[], dt: number): Particle[] {
  for (const p of ps) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 60 * dt; p.life -= dt }
  return ps.filter((p) => p.life > 0)
}

export function drawParticles(ctx: CanvasRenderingContext2D, ps: Particle[]) {
  for (const p of ps) {
    ctx.globalAlpha = Math.max(0, p.life / p.max)
    ctx.fillStyle = p.color
    ctx.fillRect(p.x, p.y, p.size, p.size)
  }
  ctx.globalAlpha = 1
}

export class Shake {
  private mag = 0
  add(m: number) { this.mag = Math.max(this.mag, m) }
  update(dt: number) { this.mag = Math.max(0, this.mag - dt * 30) }
  offset(): { x: number; y: number } { return { x: (Math.random() - 0.5) * this.mag, y: (Math.random() - 0.5) * this.mag } }
}
