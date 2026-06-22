import { describe, it, expect } from 'vitest'
import { aabb } from '../src/systems/collision'

const box = (x: number, y: number, w = 10, h = 10) => ({ x, y, w, h })

describe('aabb', () => {
  it('overlaps when close', () => { expect(aabb(box(0, 0), box(5, 0))).toBe(true) })
  it('misses when far', () => { expect(aabb(box(0, 0), box(20, 0))).toBe(false) })
  it('edge touching is not overlap', () => { expect(aabb(box(0, 0), box(10, 0))).toBe(false) })
})
