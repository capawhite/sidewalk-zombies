// Escalator Weave — steer-only zig coin run after clearing the parking garage.
import { SPAWN_Z } from '../config';
import { getCoin } from '../entities/pools';
import { flash } from '../hud/hud';
import { G, slotsX } from '../state';
import { clamp, rand } from '../util';
import { buzz } from './haptics';
import { spawnZombie } from './spawn';

const WAVE_T = 12;
const COIN_EVERY = 0.2;
const BLOCK_EVERY = 0.85;

let waveT = 0;
let coinAcc = 0;
let blockAcc = 0;
let pending = false;
let zig = 0;

export function resetEscalator() {
  waveT = 0;
  coinAcc = 0;
  blockAcc = 0;
  pending = false;
  zig = 0;
}

export function isEscalatorWeave(): boolean {
  return waveT > 0;
}

/** Arm after garage (chapter 5) clear. */
export function armEscalatorWeave() {
  pending = true;
}

export function consumePendingEscalator(): boolean {
  if (!pending) return false;
  pending = false;
  startEscalatorWeave();
  return true;
}

export function startEscalatorWeave() {
  waveT = WAVE_T;
  coinAcc = 0;
  blockAcc = 0;
  zig = 1;
  G.invuln = Math.max(G.invuln, 1.1);
  flash('ESCALATOR WEAVE  ' + WAVE_T + 's — STEER THE STEPS', '#7fd0ff');
  buzz('success');
}

export function updateEscalator(dt: number) {
  if (waveT <= 0) return;
  waveT -= dt;
  coinAcc += dt;
  blockAcc += dt;
  // Coin "steps" zigzag across lanes.
  while (coinAcc >= COIN_EVERY) {
    coinAcc -= COIN_EVERY;
    zig = (zig + 1) % slotsX.length;
    const c = getCoin();
    c.active = true; c.visible = true;
    c.position.set(
      clamp(slotsX[zig] + (rand() - 0.5) * 0.25, -3.6, 3.6),
      0,
      SPAWN_Z - rand() * 0.8,
    );
  }
  // Occasional standing blockers on the opposite step — weave around them.
  while (blockAcc >= BLOCK_EVERY) {
    blockAcc -= BLOCK_EVERY;
    const lane = (zig + 2) % slotsX.length;
    const type = rand() < 0.55 ? 'selfie' : 'text';
    spawnZombie(slotsX[lane], type, SPAWN_Z - 1.2, false);
  }
  if (waveT <= 0) {
    waveT = 0;
    flash('TOP FLOOR', '#ffe27a');
  }
}
