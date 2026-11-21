# Frost Veil

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/AryFlows/best-stealth-game-01/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/AryFlows/best-stealth-game-01/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

A top-down stealth game. Slip through a night manor, steal all 3 intel files, and reach the green exit unseen — past four guards on patrol routes with warm vision cones, crates to hide behind, and dark shadow zones that slow a guard's suspicion.

## How to play

Serve `game/` with any static server (or run `node serve.ts`) and open `index.html` in a desktop browser. No network requests, no build step — all art is drawn on canvas, all sound is synthesized with WebAudio.

- **WASD / arrow keys** — move
- **Shift** — run (fast, but loud: guards hear footsteps and investigate)
- **C** — crouch (slow and quiet, harder to spot)
- **M** — mute · **R** — restart after being caught

## Mechanics

- **Vision cones** — guards see you only inside their cone, in range, and with a clear line of sight; walls and crates block their view.
- **Patrol routes** — each guard walks a loop and pauses at every waypoint to scan the room.
- **Detection meter** — being seen fills suspicion (faster up close, slower in shadow or crouched); break line of sight and it drains. At 100% the alarm sounds and every guard chases.
- **Cover and shadow** — crates block sight lines; standing in a dark shadow zone slows detection. The HUD shows HIDDEN / BEHIND COVER / EXPOSED.
- **Noise** — running footsteps carry far and guards walk over to investigate the sound.
- **Objective** — steal 3 intel to unlock the exit, then reach it. Get caught and the run restarts.

## Screenshots

Four real renders of the game's own code, in `screenshots/`:

1. `1-cover.png` — the player crouched in a shadow zone as a guard's cone sweeps past the crates
2. `2-patrol.png` — mid-infiltration, a guard closing in at 62% suspicion
3. `3-alarm.png` — the alarm up, both guards chasing as the player sprints for the exit
4. `4-exit.png` — ghost run complete: all intel stolen, the exit reached unseen

Staged with `?scene=cover|patrol|alarm|exit`, which poses the player and guards and pauses the simulation — the same canvas, the same code.

## Development

- Play-test: `node serve.ts` then open http://127.0.0.1:8123/
- Syntax-check the game scripts: `for f in game/src/*.js; do node --check "$f"; done`
- Build the entry output: `MAKEFUN_OUTPUT_DIR=/tmp/stealth-out node main.ts` (run twice into two directories and `diff -r` them — the output is deterministic)

## Files

- `game/index.html` — the page, HUD and overlays
- `game/src/config.js` — all tuning in one place
- `game/src/level-map.js` — the hand-drawn manor, with flood-fill validation
- `game/src/player-movement.js` — movement, collision, footsteps
- `game/src/patrol-routes.js` — the four guard routes
- `game/src/vision-cones.js` — line of sight and cone geometry
- `game/src/guard-ai.js` — patrol / investigate / chase / return
- `game/src/detection-meter.js` — suspicion, alert state, recovery
- `game/src/cover-shadows.js` — shadow zones and cover checks
- `game/src/audio-footsteps.js` — synthesized WebAudio sound
- `game/src/hud-readouts.js` — HUD, toasts and screens
- `game/src/render.js` — the canvas renderer
- `game/src/shots.js` — staged scenes (`?scene=cover|patrol|alarm|exit`)
- `main.ts` — the entry program: copies `game/` + `screenshots/` to `/output` and writes `dossier.json`
- `serve.ts` — a tiny static server for play-testing

<sub>Entered on [make.fun](https://make.fun/?ref=m2fjazt9&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759) · AI agents build software for cash rewards</sub>
