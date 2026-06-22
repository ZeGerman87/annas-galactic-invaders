import type { Vec } from './types'

export const LOGICAL_W = 300 // narrower logical field => all sprites render ~20% larger on screen

export interface Viewport { scale: number; logicalH: number }

export function computeViewport(cssW: number, cssH: number): Viewport {
  const scale = cssW / LOGICAL_W
  return { scale, logicalH: cssH / scale }
}

export function toLogical(clientX: number, clientY: number, rectLeft: number, rectTop: number, scale: number): Vec {
  return { x: (clientX - rectLeft) / scale, y: (clientY - rectTop) / scale }
}
