import type { Sprite } from '../core/types'

export function aabb(a: Sprite, b: Sprite): boolean {
  return Math.abs(a.x - b.x) * 2 < a.w + b.w && Math.abs(a.y - b.y) * 2 < a.h + b.h
}
