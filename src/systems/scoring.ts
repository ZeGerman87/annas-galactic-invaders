export const POINTS: Record<number, number> = { 0: 10, 1: 20, 2: 30, 3: 40 }
export const UFO_BONUS = 150
export const EXTRA_LIFE_AT = 5000
export function levelClearBonus(level: number): number { return 100 + level * 10 }
