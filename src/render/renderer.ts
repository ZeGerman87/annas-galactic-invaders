import type { Sprite } from '../core/types'

export class Renderer {
  constructor(public ctx: CanvasRenderingContext2D, public images: Map<string, CanvasImageSource>) {}

  clear(w: number, h: number) {
    this.ctx.fillStyle = '#0f0f32'
    this.ctx.fillRect(0, 0, w, h)
  }

  image(name: string) { return this.images.get(name) }

  drawSprite(name: string, s: Sprite, rot = 0) {
    const img = this.images.get(name)
    if (!img) return
    const { ctx } = this
    ctx.save()
    ctx.translate(s.x, s.y)
    if (rot) ctx.rotate(rot)
    ctx.drawImage(img, -s.w / 2, -s.h / 2, s.w, s.h)
    ctx.restore()
  }

  drawBackground(name: string, w: number, h: number) {
    const img = this.images.get(name)
    if (!img) return
    this.ctx.drawImage(img, 0, 0, w, h)
  }
}
