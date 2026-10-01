# Sidewalk Zombies

Third-person weave-and-dodge. Run the block, avoid oblivious phone-zombies, shove a path when cornered.

## Run it (browser)

```bash
npm install
npm run dev
```

Open the URL Vite prints (usually http://localhost:5173).

```bash
npm run build      # typecheck + production bundle in dist/
npm run preview    # serve that bundle
```

### Quality and overlay

- `?quality=low|medium|high` picks a GPU tier and remembers it in `localStorage` (`sz_quality`). Phones are guessed: low if they report ≤4 GB RAM or ≤4 cores, otherwise medium. Desktops get high.
- `?perf` or press **P** shows fps, worst frame, draw calls and GPU memory. On a phone, tap the top-left corner five times.

## iOS and Android (Capacitor)

The same `dist/` bundle runs in a native WebView.

The `ios/` and `android/` projects are in the repo. Whenever the web build changes:

```bash
npm run ios        # typecheck, vite build, cap sync, open Xcode
npm run android    # typecheck, vite build, cap sync, open Android Studio
```

Or `npm run cap:sync` to update the native projects without opening an IDE. If those folders are missing (a fresh checkout that dropped them), run `npx cap add ios` and `npx cap add android` once first.

- **iOS:** Xcode 15+, a simulator or a signed device. Run from the `ios` workspace Capacitor opens.
- **Android:** Android Studio, SDK 33+, a device or emulator. Run the `android` project.
- Status bar overlays the WebView; the HUD already uses `env(safe-area-inset-*)`.
- First launch still needs the network for the Google fonts; after that the game itself is in the app bundle (`public/models`, `public/env`).

## Controls

- **A / D** or **← / →** — weave
- **Space** — shove (trips everyone ahead; short recharge)
- On a phone: **drag** to steer, tap **Shove**

## Awareness tiers

- 🟢 **Calling** — phone on the ear, wandering left and right
- 🟠 **Texting** — head down, walking straight
- 🔴 **Filming** — stopped dead, blocks the lane

Spawns always leave at least one open slot, so every wall is passable.

## Character models

The people are rigged glTF bodies by [Quaternius](https://quaternius.com) (CC0, via [poly.pizza](https://poly.pizza)): Man, Woman Casual, Woman in Tank Top and Woman in Dress. `public/models/*.glb` are trimmed copies (mesh, skeleton, and only the Idle/Walk/Run clips); `tools/prep-characters.mjs` documents how they were produced. Clothing and skin use a shared canvas atlas (`src/entities/character/clothing.ts`); threat-shirt colours still tint per person via vertex colours. The phone poses (calling, texting, filming, influencer, scared) are not in the source animations. They are solved from wrist targets with a small IK at load time and played as extra clips on top of the walk cycle (`src/entities/character/kit.ts`).

## Environments

Each scene paints its signs, products and shop fronts into one canvas atlas (`src/scene/art/`) so the textured scenery shares a single material and merges into a handful of instanced meshes (`src/scene/worlds/strip.ts`). Floors use repeating photographic albedos (linoleum, asphalt, terrazzo, sand, concrete) generated in `src/scene/art/photo.ts`. The aisle, boardwalk, food court, beach and parking garage are built from a few repeating modules; the playable lane is left calm and low-contrast.

Feel knobs live in `src/config.ts`.
