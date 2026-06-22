export interface LevelConfig {
  index: number; isBoss: boolean; rows: number; cols: number; rowTypes: number[]
  baseSpeed: number; dropY: number; fireRate: number; ufoChance: number; bossId?: number
}
export interface BossConfig { id: number; sprite: string; hp: number; minionType: number; fireRate: number }

export const BOSS_LEVELS = [4, 8, 12, 16, 20]

export function buildLevels(): LevelConfig[] {
  const out: LevelConfig[] = []
  for (let i = 1; i <= 20; i++) {
    const tier = Math.floor((i - 1) / 4) // 0..4
    if (BOSS_LEVELS.includes(i)) {
      out.push({
        index: i, isBoss: true, rows: 0, cols: 0, rowTypes: [],
        baseSpeed: 0, dropY: 0, fireRate: 0, ufoChance: 0.05,
        bossId: BOSS_LEVELS.indexOf(i) + 1,
      })
      continue
    }
    const rows = Math.min(3 + Math.floor(i / 6), 5)
    const cols = Math.min(5 + Math.floor(i / 4), 9)
    const rowTypes = Array.from({ length: rows }, (_, r) => Math.min(r + (tier > 1 ? 1 : 0), 3))
    out.push({
      index: i, isBoss: false, rows, cols, rowTypes,
      baseSpeed: 14 + i * 1.6, dropY: 10 + tier * 2,
      fireRate: 0.6 + i * 0.09, ufoChance: 0.04 + tier * 0.008,
    })
  }
  return out
}

export function bossConfig(bossId: number): BossConfig {
  return {
    id: bossId,
    sprite: `boss-0${bossId}`,
    hp: 40 + bossId * 25,
    minionType: Math.min(bossId, 3),
    fireRate: 1.2 + bossId * 0.4,
  }
}
