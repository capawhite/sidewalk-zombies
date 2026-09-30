# Sidewalk Zombies — feel prototype

Third-person weave-and-dodge. Run the block, avoid oblivious phone-zombies, shove a path when cornered. This is a **throwaway feel test** — the goal is to confirm the dodge loop is fun before committing to a Unity build. Nothing here is meant to become production code.

## Run it

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

## Controls

- **A / D** or **← / →** — weave
- **Space** — shove (trips everyone ahead; short recharge)
- On a phone: **drag** to steer, tap **Shove**

## What to judge

One question only: does steering-and-dodging feel good *on its own*, before any art?

If yes → the concept is de-risked and Unity is the next move.
If it feels flat → tune it here (all the knobs are at the top of `src/main.ts`): `speed` ramp, the `steer * 11` steering rate, `spawnTimer` density, collision half-widths (`1.05` / `1.25`), `shoveMax` cooldown.

## Layout

- `index.html` — HUD + menu/game-over markup
- `src/main.ts` — the whole game (scene, spawning, input, loop)
- `src/style.css` — UI styling

## Note on the earlier bug

The first web build looked dead because the `<canvas>` was appended *last*, so it sat on top of the menu and ate every click. Fixed here two ways: the canvas is inserted as the first child of `#wrap`, and `z-index` puts the UI above it (`src/style.css`). If anything throws at runtime, it now prints to a red bar at the bottom of the page so you don't have to open devtools.

## Awareness tiers (the core difficulty lever)

- 🟢 **Chatting** — walks straight, predictable
- 🟠 **Texting** — drifts sideways into your lane
- 🔴 **Filming** — stopped dead, blocks the lane

Spawns always leave at least one open slot, so every wall is passable.

## Character models

The people are rigged glTF bodies by [Quaternius](https://quaternius.com) (CC0, via [poly.pizza](https://poly.pizza)): Man, Woman Casual, Woman in Tank Top and Woman in Dress. `public/models/*.glb` are trimmed copies (mesh, skeleton, and only the Idle/Walk/Run clips); `tools/prep-characters.mjs` documents how they were produced. The phone poses (calling, texting, filming, influencer, scared) are not in the source animations. They are solved from wrist targets with a small IK at load time and played as extra clips on top of the walk cycle (`src/entities/character/kit.ts`).
