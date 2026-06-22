import type { Enemy } from '../core/types'

// Moves the whole live formation horizontally; on edge contact, drops every
// live enemy by dropY and reverses direction. Horizontal speed scales up to 3x
// as enemies are destroyed (classic Space-Invaders acceleration).
export function stepFormation(
  enemies: Enemy[], dir: number, dt: number,
  bounds: { left: number; right: number }, baseSpeed: number, dropY: number, total: number,
): { dir: number; dropped: boolean } {
  const alive = enemies.filter((e) => e.alive)
  if (!alive.length) return { dir, dropped: false }
  const speed = baseSpeed * (1 + ((total - alive.length) / total) * 2)
  const dx = dir * speed * dt
  let minX = Infinity, maxX = -Infinity
  for (const e of alive) {
    minX = Math.min(minX, e.x - e.w / 2)
    maxX = Math.max(maxX, e.x + e.w / 2)
  }
  if (minX + dx < bounds.left || maxX + dx > bounds.right) {
    for (const e of alive) e.y += dropY
    return { dir: -dir, dropped: true }
  }
  for (const e of alive) e.x += dx
  return { dir, dropped: false }
}
