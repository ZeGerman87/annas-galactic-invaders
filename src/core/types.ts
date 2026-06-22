export interface Vec { x: number; y: number }
export interface Sprite { x: number; y: number; w: number; h: number } // x,y = center
export type PowerUpType = 'rapid' | 'spread' | 'shield' | 'life'
export interface Enemy extends Sprite { type: number; col: number; row: number; alive: boolean }
export interface Bullet extends Sprite { vx: number; vy: number; from: 'player' | 'enemy' | 'boss'; dead: boolean }
export interface PowerUp extends Sprite { kind: PowerUpType; vy: number; dead: boolean }
