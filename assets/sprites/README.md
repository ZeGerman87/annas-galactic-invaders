# Game-ready sprites

These `*.png` files are the final, transparent, correctly-named sprites the game loads.
They are **generated** from the original AI art in `../raw/` by `tools/process_sprites.py`
(which slices the grids and removes the baked-in checkerboard background to real alpha).

Regenerate anytime with:

```
python3 tools/process_sprites.py
```

## What's here

- `player-ship.png` — the personalized face-rocket (chosen player ship)
- `player-ship-choco.png` — the chocolate cruiser (alternate, not currently used)
- `enemy-01..04.png` — the four rival ships
- `boss-01..06.png` — six bosses (the campaign uses five; `boss-06` is a spare)
- `ufo.png` — bonus UFO
- `shot-player.png` (+ `-2..-4`) — chocolate-bar player ammo variants
- `shot-enemy.png` (+ `-2`, `-3`) — enemy projectiles
- `shot-boss.png` — boss projectile
- `powerup-rapid/spread/shield/life.png` — the four power-ups
- `background.png` — nebula backdrop (opaque, no alpha needed)

The title is rendered in-engine as "Anna's Galactic Invaders" (the `Space Invaders` logo
in `../raw/` is intentionally unused).
