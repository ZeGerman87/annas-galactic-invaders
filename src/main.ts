const canvas = document.getElementById('game') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

function resize() {
  const dpr = Math.min(devicePixelRatio || 1, 3)
  canvas.width = innerWidth * dpr
  canvas.height = innerHeight * dpr
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
}
addEventListener('resize', resize)
resize()

ctx.fillStyle = '#0f0f32'
ctx.fillRect(0, 0, innerWidth, innerHeight)
ctx.fillStyle = '#ffabf3'
ctx.font = '20px sans-serif'
ctx.fillText('boot ok', 20, 60)
