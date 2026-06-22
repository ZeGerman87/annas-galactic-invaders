import { EXTRA_LIFE_AT } from '../systems/scoring'

const HIGH_KEY = 'agi.high'

export class GameState {
  score = 0
  lives = 3
  level = 1
  high = 0
  private nextLife = EXTRA_LIFE_AT

  addScore(n: number) {
    this.score += n
    while (this.score >= this.nextLife) { this.lives++; this.nextLife += EXTRA_LIFE_AT }
  }

  loseLife(): boolean {
    this.lives--
    return this.lives <= 0
  }

  loadHigh() {
    this.high = Number(localStorage.getItem(HIGH_KEY) || 0)
  }

  commitHigh() {
    this.loadHigh()
    if (this.score > this.high) {
      this.high = this.score
      localStorage.setItem(HIGH_KEY, String(this.score))
    }
  }
}
