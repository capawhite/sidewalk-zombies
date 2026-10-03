// Photobomb — zigzag photographers only, after clearing the boardwalk.
import { SPAWN_Z } from '../config';
import { flash } from '../hud/hud';
import { G, slotsX } from '../state';
import { rand } from '../util';
import { buzz } from './haptics';
import { spawnZombie } from './spawn';

const BOMB_T = 10;
const SPAWN_EVERY = 0.55;

let bombT = 0;
let spawnAcc = 0;
let pending = false;
let zig = 0;

export function resetPhotobomb() {
  bombT = 0;
  spawnAcc = 0;
  pending = false;
  zig = 0;
}

export function isPhotobomb(): boolean {
  return bombT > 0;
}

/** Arm after boardwalk (chapter 2) clear. */
export function armPhotobomb() {
  pending = true;
}

export function consumePendingPhotobomb(): boolean {
  if (!pending) return false;
  pending = false;
  startPhotobomb();
  return true;
}

export function startPhotobomb() {
  bombT = BOMB_T;
  spawnAcc = 0;
  zig = 0;
  G.invuln = Math.max(G.invuln, 1.2);
  flash('PHOTOBOMB  ' + BOMB_T + 's — DODGE THE LENSES', '#b07aff');
  buzz('success');
}

export function updatePhotobomb(dt: number) {
  if (bombT <= 0) return;
  bombT -= dt;
  spawnAcc += dt;
  while (spawnAcc >= SPAWN_EVERY) {
    spawnAcc -= SPAWN_EVERY;
    zig = (zig + 1) % slotsX.length;
    const lane = zig;
    const x = slotsX[lane] + Math.sin(performance.now() * 0.003 + lane) * 0.35;
    spawnZombie(x, 'photo', SPAWN_Z - rand() * 1.2, true);
    if (rand() < 0.45) {
      const l2 = (lane + 2) % slotsX.length;
      spawnZombie(slotsX[l2], 'photo', SPAWN_Z - 1.4 - rand(), true);
    }
  }
  if (bombT <= 0) {
    bombT = 0;
    flash('LENS CAP ON', '#ffe27a');
  }
}
