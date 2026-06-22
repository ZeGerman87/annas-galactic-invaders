export function drainSteps(acc: number, fixed: number): { steps: number; rem: number } {
  let steps = 0
  while (acc >= fixed) { steps++; acc -= fixed }
  return { steps, rem: acc }
}

export function createLoop(step: (dt: number) => void, render: () => void, fixed = 1 / 60) {
  let last = 0, acc = 0, raf = 0
  function frame(tMs: number) {
    const now = tMs / 1000
    if (last) acc += Math.min(0.25, now - last)
    last = now
    const d = drainSteps(acc, fixed)
    for (let i = 0; i < d.steps; i++) step(fixed)
    acc = d.rem
    render()
    raf = requestAnimationFrame(frame)
  }
  return {
    start() { last = 0; raf = requestAnimationFrame(frame) },
    stop() { cancelAnimationFrame(raf) },
  }
}
