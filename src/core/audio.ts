type Sfx = 'shoot' | 'hit' | 'explode' | 'power' | 'boss'

// Synthesized retro audio via Web Audio. No-op until unlock() (iOS requires a
// user gesture). Class is named AudioEngine to avoid shadowing the DOM Audio global.
export class AudioEngine {
  private ctx?: AudioContext
  private muted = false
  private unlocked = false
  private musicTimer?: ReturnType<typeof setInterval>

  unlock() {
    if (!this.ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      this.ctx = new Ctor()
    }
    this.unlocked = true
  }

  setMuted(m: boolean) { this.muted = m }
  toggleMuted() { this.muted = !this.muted; if (this.muted) this.music('none'); return this.muted }

  private blip(freq: number, dur: number, type: OscillatorType, gain = 0.2) {
    if (!this.ctx) return
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.type = type
    o.frequency.value = freq
    g.gain.setValueAtTime(gain, this.ctx.currentTime)
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur)
    o.connect(g).connect(this.ctx.destination)
    o.start()
    o.stop(this.ctx.currentTime + dur)
  }

  sfx(name: Sfx) {
    if (!this.unlocked || this.muted || !this.ctx) return
    if (name === 'shoot') this.blip(660, 0.08, 'square', 0.1)
    else if (name === 'hit') this.blip(220, 0.1, 'sawtooth', 0.14)
    else if (name === 'explode') this.blip(90, 0.35, 'sawtooth', 0.22)
    else if (name === 'power') { this.blip(520, 0.1, 'triangle', 0.18); this.blip(780, 0.12, 'triangle', 0.16) }
    else if (name === 'boss') this.blip(70, 0.5, 'square', 0.28)
  }

  music(track: 'normal' | 'boss' | 'none') {
    if (this.musicTimer) { clearInterval(this.musicTimer); this.musicTimer = undefined }
    if (track === 'none' || !this.unlocked || !this.ctx) return
    const notes = track === 'boss' ? [98, 116, 98, 78] : [131, 165, 196, 165]
    let i = 0
    this.musicTimer = setInterval(() => {
      if (this.muted || !this.ctx) return
      this.blip(notes[i % notes.length], 0.18, 'triangle', 0.05)
      i++
    }, 330)
  }
}
