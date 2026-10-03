// Bonus Coin Rush — short invuln coin-spray between chapters.
import { SPAWN_Z } from '../config';
import { getCoin } from '../entities/pools';
import { flash } from '../hud/hud';
import { G, slotsX } from '../state';
import { clamp, rand } from '../util';
import { buzz } from './haptics';

const RUSH_T = 12;
const RUSH_EVERY = 3; // after every Nth chapter clear

let rushT = 0;
let clears = 0;
let spawnAcc = 0;

export function resetBonus() {
  rushT = 0;
  clears = 0;
  spawnAcc = 0;
}

export function isBonusRush(): boolean {
  return rushT > 0;
}

/** Call when a chapter is cleared. Returns true if a rush should start after continue. */
export function noteChapterClearForBonus(): boolean {
  clears++;
  return clears > 0 && clears % RUSH_EVERY === 0;
}

let pendingRush = false;

export function armBonusRush() {
  pendingRush = true;
}

export function consumePendingBonusRush(): boolean {
  if (!pendingRush) return false;
  pendingRush = false;
  startBonusRush();
  return true;
}

export function startBonusRush() {
  rushT = RUSH_T;
  spawnAcc = 0;
  G.invuln = Math.max(G.invuln, RUSH_T);
  flash('COIN RUSH  ' + RUSH_T + 's', '#f0d078');
  buzz('success');
}

export function updateBonus(dt: number) {
  if (rushT <= 0) return;
  rushT -= dt;
  spawnAcc += dt;
  // Spray coins in a zig lane pattern.
  while (spawnAcc >= 0.18) {
    spawnAcc -= 0.18;
    const lane = (rand() * slotsX.length) | 0;
    const c = getCoin();
    c.active = true; c.visible = true;
    c.position.set(
      clamp(slotsX[lane] + (rand() - 0.5) * 0.4, -3.6, 3.6),
      0,
      SPAWN_Z - rand() * 2,
    );
  }
  if (rushT <= 0) {
    rushT = 0;
    flash('RUSH OVER', '#ffe27a');
  }
}

export function bonusHudLabel(): string | null {
  if (rushT <= 0) return null;
  return 'COIN RUSH ' + Math.ceil(rushT) + 's';
}
