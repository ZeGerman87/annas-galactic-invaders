# Visual asset specification

Everything you need to generate (or commission) the art. All art is original and yours.

## How sizing works (read once)

The game renders on a logical playfield **360 units wide** (height adapts to the phone,
roughly 640–820 units). Every "on-screen size" below is in those logical units.

- **Deliver each file at 3× the on-screen size** (the "File size" column) so it stays crisp
  on Retina screens. The engine downscales as needed — you never deal with device pixel ratios.
- If your generator outputs a different size, that's fine **as long as** it's a transparent PNG,
  centered, and roughly the right aspect ratio — the engine scales to fit. The sizes below are ideal.

## Universal rules (apply to every sprite)

- **Format:** PNG with full alpha transparency (PNG-32 / RGBA, 8-bit per channel). No JPG, no WebP.
- **Transparent background.** No solid or white background. No drop shadow baked onto a background
  colour. A soft glow on transparency is fine.
- **No text baked into sprites** (the optional title logo is the only exception).
- **Fill the canvas.** Subject centered with only ~8% transparent margin on each side. Don't float a
  tiny ship in a big empty square — the drawn art *is* the hitbox (the engine insets it slightly for
  fairness), so big empty margins make collisions feel wrong.
- **Orientation (the engine does not rotate sprites):**
  - Player ship: nose points **up**. Left–right symmetric.
  - Rival ships & bosses: threat/nose points **down** (toward the player). Left–right symmetric.
  - UFO: horizontal saucer, symmetric.
  - Projectiles: drawn vertically (travel axis = vertical), centered.
  - Power-ups: upright icon, centered.
- **Contrast for a dark starfield background.** Use bright, saturated art. Avoid pure black or dark-navy
  fills (they vanish on the dark bg); if a shape is dark, give it a light rim/outline so it reads.

## Decide this FIRST: one style + one palette

The single biggest quality risk is a mismatched set. Before generating, commit to **one rendering style**
and **one palette**, and use the same descriptors for every asset.

- **Recommended style:** clean, bold, semi-flat vector with strong silhouettes, a bright limited palette,
  and a subtle rim-light/glow. Reads best at small sizes on a phone and is easiest to keep cohesive.
- Great alternatives (pick one and stay consistent): crisp **pixel art** (retro-authentic — keep one pixel
  grid across all assets), or **painted/3D sci-fi** (richer, but harder to keep readable + cohesive at small size).
- **Palette idea:** each rival type owns one hue so the player learns enemies by colour; player ship a
  friendly hue (cyan/white); projectiles colour-coded (player = cyan/white, enemy = warm/red, boss = magenta);
  power-ups colour-coded by effect (see below).

## Required assets (18)

| # | Asset | Filename | On-screen size | File size (3×) | Notes / art direction |
|---|-------|----------|----------------|----------------|-----------------------|
| 1 | Player ship | `player-ship.png` | 40×40 | **120×120** | Hero look, distinct silhouette, points up. Friendly hue (cyan/white). |
| 2 | Rival type 1 (grunt) | `enemy-01.png` | 32×32 | **96×96** | Simplest/weakest. Owns colour A. Points down. |
| 3 | Rival type 2 | `enemy-02.png` | 32×32 | **96×96** | Colour B. Slightly meaner silhouette. |
| 4 | Rival type 3 | `enemy-03.png` | 32×32 | **96×96** | Colour C. Faster-looking. |
| 5 | Rival type 4 (elite) | `enemy-04.png` | 32×32 | **96×96** | Colour D. Bulkiest/most armoured (intro'd at higher levels). |
| 6 | Bonus UFO | `ufo.png` | 48×24 | **144×72** | Wide saucer, clearly "special/bonus" — shiny gold reads well. |
| 7 | Boss 1 (lvl 4) | `boss-01.png` | 120×80 | **360×240** | Large, menacing, unique. Faces down. Clear core/weak-point read helps. |
| 8 | Boss 2 (lvl 8) | `boss-02.png` | 130×90 | **390×270** | Distinct from boss 1; tougher vibe. |
| 9 | Boss 3 (lvl 12) | `boss-03.png` | 140×100 | **420×300** | — |
| 10 | Boss 4 (lvl 16) | `boss-04.png` | 150×110 | **450×330** | — |
| 11 | Boss 5 — final (lvl 20) | `boss-05.png` | 170×120 | **510×360** | Biggest, most dramatic. The climax. |
| 12 | Player projectile | `shot-player.png` | 8×24 | **24×72** | Bright bolt, cyan/white. Vertical. |
| 13 | Enemy projectile | `shot-enemy.png` | 8×20 | **24×60** | Visually distinct from player shot (warm/red) so incoming reads at a glance. |
| 14 | Boss projectile | `shot-boss.png` | 14×24 | **42×72** | Bigger, scarier (magenta). |
| 15 | Power-up: rapid-fire | `powerup-rapid.png` | 24×24 | **72×72** | Pickup capsule + icon. Suggested: lightning / fast-forward. |
| 16 | Power-up: spread shot | `powerup-spread.png` | 24×24 | **72×72** | Icon: three diverging arrows / trident. |
| 17 | Power-up: shield | `powerup-shield.png` | 24×24 | **72×72** | Icon: shield/bubble. Suggested colour blue. |
| 18 | Power-up: extra life | `powerup-life.png` | 24×24 | **72×72** | Icon: heart or mini player-ship. Suggested colour green/pink. |

Keep the four power-ups in a **consistent capsule/frame** so they read as collectibles, with a distinct
icon + colour per effect.

## Optional assets (nice to have, all have procedural fallbacks)

| Asset | Filename | On-screen size | File size (3×) | Notes |
|-------|----------|----------------|----------------|-------|
| Background | `background.png` | 360×800 | **1080×2400** | Dark, subtle space scene. Must not compete with sprites. (Default: procedural starfield.) |
| Title logo | `logo.png` | 280×120 | **840×360** | Title screen art, transparent. (Default: styled text.) |
| Enemy alt-frame | `enemy-0X-b.png` | match enemy | match enemy | A 2nd frame per rival type for the classic marching "wiggle". Same size as its `enemy-0X.png`. |

Explosions and the player's thruster are generated procedurally — no art needed for those.

## If you're generating with an AI image tool

- Output transparent PNGs if the tool supports it; otherwise generate on a flat, easily-removable
  background and we'll cut it out.
- Generate larger than the target and let it downscale; keep the subject centered.
- Reuse the **same style + palette descriptors** in every prompt for cohesion (see "Decide this FIRST").
- Square framing for ships and power-ups; wide framing for the UFO; a large box for bosses.
- No text in the image (except the optional logo).

## Delivery

- Drop the files into `assets/sprites/` using the **exact filenames** above, or just send them to me
  and I'll wire them in.
- The engine maps these names via the asset manifest. Any file you don't provide falls back to
  placeholder programmer-art, so the game stays playable while assets trickle in — no asset blocks progress.
