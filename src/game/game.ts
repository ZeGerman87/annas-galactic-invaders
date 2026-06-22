import { Starfield } from '../render/starfield'
import { mulberry32 } from '../core/rng'
import { LOGICAL_W } from '../core/viewport'
import { makePlayer, updatePlayer } from '../entities/player'
import { spawnBullet, updateBullets, activePlayerBullets } from '../entities/bullet'
import { buildWave } from '../entities/enemy'
import { stepFormation } from '../systems/formation'
import { resolvePlayerHits, resolveEnemyHits, enemyFire } from '../systems/combat'
import { buildShields, damageShields } from '../systems/shields'
import { GameState } from './state'
import { levelClearBonus, UFO_BONUS } from '../systems/scoring'
import { buildLevels, bossConfig } from './levels'
import { PowerState, rollPowerUp, shouldDrop } from '../systems/powerups'
import { spawnPowerUp, updatePowerUps, POWERUP_SPRITE } from '../entities/powerup'
import { makeBoss, updateBoss, damageBoss, bossDefeated } from '../entities/boss'
import { aabb } from '../systems/collision'
import { burst, updateParticles, drawParticles, Shake } from '../render/particles'
import { AudioEngine } from '../core/audio'
import { Scene } from './scenes'
import { drawTitle, drawLevelCard, drawPaused, drawWin, drawGameOver } from '../ui/screens'
import type { Renderer } from '../render/renderer'
import type { Player } from '../entities/player'
import type { ShieldCell } from '../systems/shields'
import type { LevelConfig, BossConfig } from './levels'
import type { Boss } from '../entities/boss'
import type { Particle } from '../render/particles'
import type { Bullet, Enemy, PowerUp } from '../core/types'

interface Ufo { x: number; y: number; w: number; h: number; vx: number }

const DROP_CHANCE = 0.16
const CARD_TIME = 1.2

export class Game {
  private rng = mulberry32((Date.now() >>> 0) || 1)
  private stars: Starfield
  private gs = new GameState()
  private power = new PowerState()
  private audio = new AudioEngine()
  private shake = new Shake()
  private particles: Particle[] = []
  private muted = false
  private audioStarted = false
  private scene: Scene
  private cardTimer = 0
  private player: Player
  private bullets: Bullet[] = []
  private drops: PowerUp[] = []
  private enemies: Enemy[] = []
  private boss: Boss | null = null
  private bossCfg: BossConfig | null = null
  private shields: ShieldCell[] = []
  private levels = buildLevels()
  private cfg!: LevelConfig
  private dir = 1
  private total = 0
  private ufo: Ufo | null = null
  private flash = 0
  private killsSinceDrop = 0
  private bounds = { left: 8, right: LOGICAL_W - 8 }

  constructor(private r: Renderer, private logicalH: number, startLevel = 1) {
    this.stars = new Starfield(logicalH, this.rng)
    this.player = makePlayer(logicalH)
    const img = r.image('player-ship')
    if (img) this.player.sprite.h = this.player.sprite.w * this.aspect(img)
    this.gs.loadHigh()
    this.loadLevel(startLevel)
    this.scene = startLevel > 1 ? Scene.Play : Scene.Title // ?level=N jumps straight into play (debug)
  }

  private aspect(img: CanvasImageSource): number {
    const w = (img as HTMLImageElement).naturalWidth || (img as HTMLCanvasElement).width
    const h = (img as HTMLImageElement).naturalHeight || (img as HTMLCanvasElement).height
    return w ? h / w : 1
  }

  private musicTrack(): 'normal' | 'boss' { return this.cfg.isBoss ? 'boss' : 'normal' }
  private levelLabel(): string { return this.cfg.isBoss ? `BOSS ${this.cfg.bossId}` : `LEVEL ${this.gs.level}` }

  private loadLevel(n: number) {
    this.gs.level = n
    this.cfg = this.levels[n - 1]
    this.bullets = []; this.drops = []; this.ufo = null; this.dir = 1
    this.shields = buildShields(this.logicalH)
    this.player.sprite.x = LOGICAL_W / 2
    this.killsSinceDrop = 0
    if (this.cfg.isBoss) {
      this.bossCfg = bossConfig(this.cfg.bossId!)
      this.boss = makeBoss(this.bossCfg, this.logicalH)
      this.enemies = []; this.total = 0
    } else {
      this.boss = null; this.bossCfg = null
      this.enemies = buildWave(this.cfg.rows, this.cfg.cols, this.cfg.rowTypes)
      this.total = this.enemies.length
    }
    if (this.audioStarted && !this.muted) this.audio.music(this.musicTrack())
  }

  // --- input / scene control (called from main) ---
  onTap(lx: number, ly: number): boolean {
    this.startAudio()
    const m = this.muteRect()
    if (lx >= m.x && lx <= m.x + m.w && ly >= m.y && ly <= m.y + m.h) { this.toggleMute(); return true }
    switch (this.scene) {
      case Scene.Title: this.startGame(); return true
      case Scene.Win:
      case Scene.GameOver: this.scene = Scene.Title; return true
      case Scene.Paused: this.scene = Scene.Play; if (!this.muted) this.audio.music(this.musicTrack()); return true
      case Scene.Play: {
        const p = this.pauseRect()
        if (lx >= p.x && lx <= p.x + p.w && ly >= p.y && ly <= p.y + p.h) { this.scene = Scene.Paused; this.audio.music('none'); return true }
        return false
      }
      default: return false
    }
  }

  private startAudio() {
    if (this.audioStarted) return
    this.audioStarted = true
    this.audio.unlock()
    if (!this.muted) this.audio.music(this.musicTrack())
  }
  private toggleMute() {
    this.muted = this.audio.toggleMuted()
    if (!this.muted && this.scene === Scene.Play) this.audio.music(this.musicTrack())
  }
  private muteRect() { return { x: LOGICAL_W - 30, y: 30, w: 24, h: 18 } }
  private pauseRect() { return { x: 8, y: 30, w: 22, h: 18 } }

  private startGame() {
    this.gs.score = 0; this.gs.lives = 3
    this.power = new PowerState()
    this.loadLevel(1)
    this.scene = Scene.LevelCard; this.cardTimer = CARD_TIME
  }
  private die() { this.gs.commitHigh(); this.audio.music('none'); this.scene = Scene.GameOver }
  private clearLevel() {
    this.gs.addScore(levelClearBonus(this.gs.level))
    if (this.gs.level >= 20) { this.gs.commitHigh(); this.audio.music('none'); this.scene = Scene.Win; return }
    this.loadLevel(this.gs.level + 1)
    this.scene = Scene.LevelCard; this.cardTimer = CARD_TIME
  }

  private fire() {
    const p = this.player
    if (p.fireTimer > 0 || activePlayerBullets(this.bullets) >= this.power.maxBullets()) return
    const px = p.sprite.x, py = p.sprite.y - p.sprite.h / 2
    const lanes = this.power.active('spread') ? [-130, 0, 130] : [0]
    for (const vx of lanes) {
      spawnBullet(this.bullets, px, py, -480, 'player', 15, 17)
      this.bullets[this.bullets.length - 1].vx = vx
    }
    p.fireTimer = this.power.fireInterval(0.35)
    this.audio.sfx('shoot')
  }

  private maybeUfo(dt: number) {
    if (this.ufo) {
      this.ufo.x += this.ufo.vx * dt
      if (this.ufo.x < -50 || this.ufo.x > LOGICAL_W + 50) this.ufo = null
    } else if (this.rng() < this.cfg.ufoChance * dt) {
      const fromLeft = this.rng() < 0.5
      this.ufo = { x: fromLeft ? -30 : LOGICAL_W + 30, y: 46, w: 40, h: 20, vx: fromLeft ? 60 : -60 }
    }
  }

  update(dt: number, targetX: number | null) {
    this.stars.update(dt)
    this.shake.update(dt)
    this.particles = updateParticles(this.particles, dt)
    if (this.flash > 0) this.flash -= dt

    if (this.scene === Scene.LevelCard) {
      this.cardTimer -= dt
      if (this.cardTimer <= 0) { this.scene = Scene.Play; if (this.audioStarted && !this.muted) this.audio.music(this.musicTrack()) }
      return
    }
    if (this.scene !== Scene.Play) return

    this.power.update(dt)
    if (this.power.hasShield()) this.player.invuln = Math.max(this.player.invuln, 0.1)
    updatePlayer(this.player, targetX, dt)
    this.fire()

    if (this.boss) {
      updateBoss(this.boss, this.bossCfg!, dt, this.bounds, this.rng, this.bullets)
    } else {
      this.dir = stepFormation(this.enemies, this.dir, dt, this.bounds, this.cfg.baseSpeed, this.cfg.dropY, this.total).dir
      enemyFire(this.enemies, this.bullets, this.rng, this.cfg.fireRate, dt)
    }
    this.maybeUfo(dt)

    const kept = updateBullets(this.bullets, dt, this.logicalH)
    this.bullets.length = 0; this.bullets.push(...kept)
    this.drops = updatePowerUps(this.drops, dt, this.logicalH)

    damageShields(this.bullets, this.shields)

    const hit = resolvePlayerHits(this.bullets, this.enemies)
    if (hit.points) this.gs.addScore(hit.points)
    if (hit.kills) this.audio.sfx('explode')
    for (const pos of hit.killedAt) {
      this.particles.push(...burst(pos.x, pos.y, 9, this.rng, '#ffd24a'))
      this.killsSinceDrop++
      // random drop, plus a guaranteed drop at least every 7 kills so power-ups always appear
      if (shouldDrop(this.rng, DROP_CHANCE) || this.killsSinceDrop >= 7) {
        spawnPowerUp(this.drops, pos.x, pos.y, rollPowerUp(this.rng))
        this.killsSinceDrop = 0
      }
    }

    if (this.boss) {
      if (damageBoss(this.bullets, this.boss)) { this.flash = 0.05; this.audio.sfx('hit') }
      if (bossDefeated(this.boss)) {
        this.particles.push(...burst(this.boss.sprite.x, this.boss.sprite.y, 40, this.rng, '#ff6b9d'))
        this.shake.add(16); this.audio.sfx('explode'); this.audio.sfx('boss')
        this.boss = null
        this.clearLevel()
        return
      }
    }

    if (this.ufo) {
      for (const b of this.bullets) {
        if (b.from === 'player' && !b.dead && aabb(b, this.ufo)) {
          b.dead = true; this.gs.addScore(UFO_BONUS)
          this.particles.push(...burst(this.ufo.x, this.ufo.y, 14, this.rng, '#ffe39b'))
          this.audio.sfx('power')
          if (shouldDrop(this.rng, 0.5)) spawnPowerUp(this.drops, this.ufo.x, this.ufo.y, rollPowerUp(this.rng))
          this.ufo = null
          break
        }
      }
    }

    if (resolveEnemyHits(this.bullets, this.player)) {
      this.player.invuln = 1.5; this.flash = 0.12
      this.shake.add(10); this.audio.sfx('hit')
      this.particles.push(...burst(this.player.sprite.x, this.player.sprite.y, 16, this.rng, '#45e0ff'))
      this.power = new PowerState() // getting hit strips collected power-ups
      if (this.gs.loseLife()) { this.die(); return }
    }

    this.drops = this.drops.filter((p) => {
      if (aabb(p, this.player.sprite)) {
        this.power.apply(p.kind, () => { this.gs.lives++ })
        this.audio.sfx('power')
        this.particles.push(...burst(p.x, p.y, 10, this.rng, '#79ff5b'))
        return false
      }
      return true
    })

    if (!this.boss && this.enemies.length && !this.enemies.some((e) => e.alive)) this.clearLevel()
  }

  draw(ctx: CanvasRenderingContext2D) {
    const r = this.r
    r.clear(LOGICAL_W, this.logicalH)
    r.drawBackground('background', LOGICAL_W, this.logicalH)
    this.stars.draw(ctx)

    const showWorld = this.scene === Scene.Play || this.scene === Scene.LevelCard || this.scene === Scene.Paused
    if (showWorld) { this.drawWorld(ctx); this.drawHud(ctx) }

    if (this.scene === Scene.Title) drawTitle(ctx, r, this.logicalH, this.gs.high)
    else if (this.scene === Scene.LevelCard) drawLevelCard(ctx, this.logicalH, this.levelLabel())
    else if (this.scene === Scene.Paused) drawPaused(ctx, this.logicalH)
    else if (this.scene === Scene.Win) drawWin(ctx, this.logicalH, this.gs.score, this.gs.high)
    else if (this.scene === Scene.GameOver) drawGameOver(ctx, this.logicalH, this.gs.score, this.gs.high)
  }

  private drawWorld(ctx: CanvasRenderingContext2D) {
    const r = this.r
    ctx.save()
    const o = this.shake.offset()
    ctx.translate(o.x, o.y)

    for (const e of this.enemies) {
      if (!e.alive) continue
      const name = `enemy-0${e.type + 1}`
      const img = r.image(name)
      r.drawSprite(name, { x: e.x, y: e.y, w: 30, h: 30 * (img ? this.aspect(img) : 1) })
    }

    if (this.boss) {
      const name = `boss-0${this.cfg.bossId}`
      const img = r.image(name)
      const asp = img ? this.aspect(img) : 0.7
      r.drawSprite(name, { x: this.boss.sprite.x, y: this.boss.sprite.y, w: this.boss.sprite.w, h: this.boss.sprite.w * asp })
    }

    for (const c of this.shields) if (c.alive) r.drawSprite('shield-block', c)

    if (this.ufo) {
      const img = r.image('ufo'); const asp = img ? this.aspect(img) : 0.5
      r.drawSprite('ufo', { x: this.ufo.x, y: this.ufo.y, w: this.ufo.w, h: this.ufo.w * asp })
    }

    for (const p of this.drops) r.drawSprite(POWERUP_SPRITE[p.kind], p)

    for (const b of this.bullets) {
      const name = b.from === 'player' ? 'shot-player' : b.from === 'boss' ? 'shot-boss' : 'shot-enemy'
      r.drawSprite(name, b)
    }

    if (this.player.invuln <= 0 || Math.floor(this.player.invuln * 10) % 2 === 0) {
      r.drawSprite('player-ship', this.player.sprite)
    }

    drawParticles(ctx, this.particles)
    ctx.restore()

    if (this.flash > 0) {
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.4, this.flash * 3)})`
      ctx.fillRect(0, 0, LOGICAL_W, this.logicalH)
    }
  }

  private drawHud(ctx: CanvasRenderingContext2D) {
    if (this.boss) {
      ctx.fillStyle = '#2a2a44'; ctx.fillRect(16, 44, LOGICAL_W - 32, 9)
      ctx.fillStyle = '#e24b4a'; ctx.fillRect(16, 44, (LOGICAL_W - 32) * Math.max(0, this.boss.hp / this.boss.maxHp), 9)
    }
    ctx.fillStyle = '#e1dfff'
    ctx.font = '14px ui-monospace, monospace'
    ctx.textAlign = 'left'; ctx.fillText(`SCORE ${this.gs.score}`, 10, 22)
    ctx.textAlign = 'center'; ctx.fillText(this.cfg.isBoss ? `BOSS ${this.cfg.bossId}` : `LV ${this.gs.level}`, LOGICAL_W / 2, 22)
    ctx.textAlign = 'right'; ctx.fillText(`♥ ${this.gs.lives}`, LOGICAL_W - 10, 22)
    ctx.textAlign = 'left'

    // pause button (only during play)
    if (this.scene === Scene.Play) {
      const p = this.pauseRect()
      ctx.fillStyle = '#e1dfff'
      ctx.fillRect(p.x + 4, p.y + 2, 4, 14)
      ctx.fillRect(p.x + 12, p.y + 2, 4, 14)
    }

    // mute button
    const m = this.muteRect()
    ctx.fillStyle = this.muted ? '#6b6b8a' : '#e1dfff'
    ctx.fillRect(m.x, m.y + 5, 4, 8)
    ctx.beginPath(); ctx.moveTo(m.x + 4, m.y + 9); ctx.lineTo(m.x + 11, m.y + 2); ctx.lineTo(m.x + 11, m.y + 16); ctx.closePath(); ctx.fill()
    if (this.muted) {
      ctx.strokeStyle = '#e24b4a'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.moveTo(m.x + 14, m.y + 4); ctx.lineTo(m.x + 21, m.y + 14); ctx.moveTo(m.x + 21, m.y + 4); ctx.lineTo(m.x + 14, m.y + 14); ctx.stroke()
    }
  }
}
