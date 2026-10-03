// Luggage Claim — brief steer-only coin-belt mini-game after clearing the station.
import { SPAWN_Z } from '../config';
import { getCoin } from '../entities/pools';
import { flash } from '../hud/hud';
import { G, slotsX } from '../state';
import { clamp, rand } from '../util';
import { buzz } from './haptics';

const CLAIM_T = 15;
const BELT_EVERY = 0.22;

let claimT = 0;
let spawnAcc = 0;
let pending = false;
let beltPhase = 0;

export function resetLuggage() {
  claimT = 0;
  spawnAcc = 0;
  pending = false;
  beltPhase = 0;
}

export function isLuggageClaim(): boolean {
  return claimT > 0;
}

/** Arm after station (chapter 6) clear. */
export function armLuggageClaim() {
  pending = true;
}

export function consumePendingLuggage(): boolean {
  if (!pending) return false;
  pending = false;
  startLuggageClaim();
  return true;
}

export function startLuggageClaim() {
  claimT = CLAIM_T;
  spawnAcc = 0;
  beltPhase = 0;
  G.invuln = Math.max(G.invuln, CLAIM_T);
  flash('LUGGAGE CLAIM  ' + CLAIM_T + 's — STEER ONLY', '#f0d078');
  buzz('success');
}

export function updateLuggage(dt: number) {
  if (claimT <= 0) return;
  claimT -= dt;
  spawnAcc += dt;
  beltPhase += dt * 1.4;
  while (spawnAcc >= BELT_EVERY) {
    spawnAcc -= BELT_EVERY;
    // Two conveyor belts drifting laterally.
    for (let belt = 0; belt < 2; belt++) {
      const laneBase = belt === 0 ? 1 : 3;
      const x = slotsX[laneBase] + Math.sin(beltPhase + belt * 1.7) * 1.1;
      const c = getCoin();
      c.active = true; c.visible = true;
      c.position.set(clamp(x, -3.6, 3.6), 0, SPAWN_Z - rand() * 1.5);
    }
  }
  if (claimT <= 0) {
    claimT = 0;
    flash('BAGS CLAIMED', '#ffe27a');
  }
}

export function luggageHudLabel(): string | null {
  if (claimT <= 0) return null;
  return 'LUGGAGE ' + Math.ceil(claimT) + 's';
}
