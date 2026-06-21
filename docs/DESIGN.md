# Design — mobile arcade space shooter (working title: "Star Siege")

Status: approved 2026-06-21. Working title and host are placeholders, rename/change anytime.

An original, Space-Invaders-style arcade game. Mobile-first, delivered as a link the
player taps and plays in mobile Safari — no install. Original engine, original
(synthesized) audio, original art supplied by the owner. Not affiliated with Taito's
Space Invaders; no copyrighted assets or trademarked names are used.

## Platform & delivery
- HTML5 Canvas + TypeScript. Lightweight, fast to load over cellular, full pixel control.
- Portrait orientation. Scales to any iPhone; respects notch / home-bar safe areas. Targets 60fps.
- Shipped as static files + PWA ("Add to Home Screen", fullscreen, offline after first load).
- Hosted free (default: GitHub Pages; Netlify / Cloudflare Pages / itch.io are fine alternatives).

## Controls
- Drag thumb across the lower screen to move the ship horizontally.
- Auto-fire, keeping the classic "one shot on screen at a time" rule.

## Campaign — 20 levels
- Data-driven: each level is one row of tunable config.
- Bosses at levels 4, 8, 12, 16, 20.
- Escalation across levels: more enemies/rows, faster formation movement (the classic
  "fewer aliens left = faster"), quicker descent, denser enemy fire, new rival types
  introduced as you climb.

## Bosses (5)
- Each is a large, unique enemy with its own health bar and attack patterns, flanked by minions.
- Later bosses are multi-phase; level 20 is the final boss.
- Defeating a boss = big score bonus + a guaranteed power-up drop.

## Enemies
- ~4 rival-ship types: differ in speed, points, and firing behaviour; each type owns a colour.
- Bonus UFO drifts across the top for bonus points.

## Power-ups (drops)
- Dropped occasionally by kills and the UFO; fly into them to collect.
- Rapid-fire, spread/double shot, temporary shield, extra life. All time-limited except extra life.

## Player, lives & shields
- Start with 3 lives. Lose one when hit or if invaders reach the bottom. Brief respawn invulnerability.
- Destructible bunkers/shields for cover that erode as they take hits.

## Scoring & persistence
- Points per enemy by type, UFO bonus, level-clear bonus.
- High score saved on-device (`localStorage`); shown on title and game-over screens.

## Audio
- Synthesized retro SFX (shoot, hit, explosion, power-up, boss) + looping music
  (one normal theme, one boss theme). Web Audio API, starts on first tap (iOS), mute button.

## Juice
- Starfield, particle explosions, screen shake on big hits, hit-flashes, floating score popups.
  Tuned to hold 60fps on a phone.

## Game flow
- Title → level-intro card → wave → clear → (boss on the 4ths) → … → win screen after level 20,
  or game-over. Pause button.

## Architecture (brief)
- Fixed-timestep game loop; entity types (player, enemy, boss, bullet, power-up);
  systems (input, collision, spawning, audio, render); scene/state manager;
  20-row level config table; an asset manifest.
- Built first with placeholder programmer-art so it is fully playable immediately; real art
  drops in by adding files + editing the one manifest, no code changes.

## Assets
- The owner supplies custom art. Exact specifications: see [ASSETS.md](ASSETS.md).

## Out of scope (YAGNI)
- Accounts, online leaderboards, multiplayer, level editor, monetization.
