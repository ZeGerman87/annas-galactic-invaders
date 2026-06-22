import { describe, it, expect } from 'vitest'
import { Scene, nextScene } from '../src/game/scenes'

describe('scene transitions', () => {
  it('title -> levelcard -> play', () => {
    expect(nextScene(Scene.Title, 'start')).toBe(Scene.LevelCard)
    expect(nextScene(Scene.LevelCard, 'levelReady')).toBe(Scene.Play)
  })
  it('clearing a normal level returns to level card', () => {
    expect(nextScene(Scene.Play, 'cleared')).toBe(Scene.LevelCard)
  })
  it('clearing the last level wins', () => {
    expect(nextScene(Scene.Play, 'lastCleared')).toBe(Scene.Win)
  })
  it('dying ends the game; pause/resume toggle; restart returns to title', () => {
    expect(nextScene(Scene.Play, 'died')).toBe(Scene.GameOver)
    expect(nextScene(Scene.Play, 'pause')).toBe(Scene.Paused)
    expect(nextScene(Scene.Paused, 'resume')).toBe(Scene.Play)
    expect(nextScene(Scene.GameOver, 'restart')).toBe(Scene.Title)
    expect(nextScene(Scene.Win, 'restart')).toBe(Scene.Title)
  })
})
