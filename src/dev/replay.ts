// Deterministic replay harness (open the game with ?replay).
import { LIVES_MAX } from '../config';
import { player } from '../entities/player';
import { bullets, coinPool, pickPool, pool } from '../entities/pools';
import { drawLives } from '../hud/hud';
import { frame } from '../loop';
import { parts } from '../render/fx';
import { G, S, keys } from '../state';
import { enterNextLevel } from '../systems/levels';
import { start } from '../systems/lifecycle';
import { collectPower, doShove } from '../systems/powers';

// ---------- dev: deterministic replay (verifies refactors play identically) ----------
// Open the game with ?replay, then run window.__replay.run(1234, 7200) in the console.
// Fixed 1/60s steps, seeded Math.random, scripted input. Returns a trace + hash to diff.
function runReplay(seed: number, frames: number) {
  let a = seed >>> 0, calls = 0;
  Math.random = () => {
    calls++;
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const lines: string[] = [];
  const cycle = ['cart', 'horn', 'gun', 'bomb'];
  let clearFrame = -1;
  start();
  for (let f = 0; f < frames; f++) {
    const ph = f % 300;
    keys.left = ph < 50;
    keys.right = ph >= 100 && ph < 190;
    G.pointerActive = f >= 600 && f < 700;
    if (G.pointerActive) { G.pointerOriginX = 200; G.pointerX = 200 + (f - 600) * 2; if (f === 600) G.touchAnchorX = 0; }
    if (f % 45 === 0) doShove();
    if (f % 500 === 250) collectPower(cycle[(f / 500 | 0) % 4]);
    if (f === 1500 || f === 3500 || f === 5500) G.scoreAcc += 600;
    if (f % 400 === 0 && G.state === S.play) { G.lives = LIVES_MAX; drawLives(); }
    if (G.state === S.over || G.state === S.menu) start();
    if (G.state === S.clear) { if (clearFrame < 0) clearFrame = f; if (f - clearFrame > 30) { enterNextLevel(); clearFrame = -1; } }
    frame(1 / 60, f * 1000 / 60);
    if (f % 60 === 0) {
      let sx = 0, sz = 0, kn = 0, n = 0;
      for (const z of pool) if (z.active) { n++; sx += z.position.x; sz += z.position.z; if (z.userData.knocked) kn++; }
      const cnt = (arr: any[]) => arr.filter((o) => o.active).length;
      lines.push([f, G.state, G.level, Math.round(G.dist * 1000), G.scoreAcc, G.lives, G.combo, G.coins, Math.round(G.gunT * 1000),
        Math.round(player.position.x * 1000), n, Math.round(sx * 1000), Math.round(sz * 1000), kn,
        cnt(pickPool), cnt(coinPool), cnt(bullets), cnt(parts), calls].join(','));
    }
  }
  let h = 2166136261;
  for (const ch of lines.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return { hash: h, calls, count: lines.length, lines };
}
if (new URLSearchParams(location.search).has('replay')) {
  (window as any).__replay = { run: runReplay };
}