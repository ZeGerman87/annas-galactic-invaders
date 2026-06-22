export enum Scene { Title, LevelCard, Play, Win, GameOver, Paused }

export type SceneEvent =
  | 'start' | 'levelReady' | 'cleared' | 'lastCleared' | 'died' | 'pause' | 'resume' | 'restart'

export function nextScene(cur: Scene, evt: SceneEvent): Scene {
  switch (cur) {
    case Scene.Title: return evt === 'start' ? Scene.LevelCard : cur
    case Scene.LevelCard: return evt === 'levelReady' ? Scene.Play : cur
    case Scene.Play:
      if (evt === 'cleared') return Scene.LevelCard
      if (evt === 'lastCleared') return Scene.Win
      if (evt === 'died') return Scene.GameOver
      if (evt === 'pause') return Scene.Paused
      return cur
    case Scene.Paused: return evt === 'resume' ? Scene.Play : cur
    case Scene.Win:
    case Scene.GameOver: return evt === 'restart' ? Scene.Title : cur
    default: return cur
  }
}
