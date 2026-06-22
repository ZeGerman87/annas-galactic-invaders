import { LOGICAL_W } from '../core/viewport'

const PINK = '#ffabf3', CYAN = '#00fbfb', INK = '#e1dfff'

function center(ctx: CanvasRenderingContext2D, text: string, y: number, size: number, color: string) {
  ctx.fillStyle = color
  ctx.textAlign = 'center'
  ctx.font = `${size}px "Space Grotesk", system-ui, sans-serif`
  ctx.fillText(text, LOGICAL_W / 2, y)
  ctx.textAlign = 'left'
}

function dim(ctx: CanvasRenderingContext2D, h: number, a = 0.6) {
  ctx.fillStyle = `rgba(11,11,46,${a})`
  ctx.fillRect(0, 0, LOGICAL_W, h)
}

export function drawTitle(ctx: CanvasRenderingContext2D, h: number, high: number) {
  dim(ctx, h, 0.45)
  center(ctx, "ANNA'S", h * 0.3, 40, PINK)
  center(ctx, 'GALACTIC INVADERS', h * 0.37, 21, CYAN)
  center(ctx, 'tap to start', h * 0.6, 17, INK)
  center(ctx, `high ${high}`, h * 0.68, 14, INK)
}

export function drawLevelCard(ctx: CanvasRenderingContext2D, h: number, label: string) {
  center(ctx, label, h * 0.46, 32, label.startsWith('BOSS') ? PINK : CYAN)
}

export function drawPaused(ctx: CanvasRenderingContext2D, h: number) {
  dim(ctx, h)
  center(ctx, 'PAUSED', h * 0.44, 30, INK)
  center(ctx, 'tap to resume', h * 0.54, 16, CYAN)
}

export function drawWin(ctx: CanvasRenderingContext2D, h: number, score: number, high: number) {
  dim(ctx, h, 0.7)
  center(ctx, 'YOU WIN!', h * 0.36, 36, PINK)
  center(ctx, `score ${score}`, h * 0.47, 18, INK)
  center(ctx, `high ${high}`, h * 0.53, 14, INK)
  center(ctx, 'tap to play again', h * 0.66, 16, CYAN)
}

export function drawGameOver(ctx: CanvasRenderingContext2D, h: number, score: number, high: number) {
  dim(ctx, h, 0.7)
  center(ctx, 'GAME OVER', h * 0.36, 32, CYAN)
  center(ctx, `score ${score}`, h * 0.47, 18, INK)
  center(ctx, `high ${high}`, h * 0.53, 14, INK)
  center(ctx, 'tap to retry', h * 0.66, 16, PINK)
}
