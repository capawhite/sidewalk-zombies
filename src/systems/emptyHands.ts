// Empty Hands — shove-only run. No kits, no pickup collect; vault bonus on death/escape.
import { G } from '../state';

const QUIET = typeof location !== 'undefined' && new URLSearchParams(location.search).has('replay');

let active = false;

export function beginEmptyHands(on: boolean) {
  active = on;
}

export function isEmptyHands(): boolean {
  return active;
}

/** Vault cents from a shove-only run (capped). */
export function emptyHandsVaultBonus(dist: number): number {
  if (!active) return 0;
  return Math.min(90, Math.floor(Math.max(0, dist) / 35));
}

export function emptyHandsHudLabel(): string | null {
  if (!active || G.state !== 'play') return null;
  return 'EMPTY HANDS';
}

export function emptyHandsOverLine(dist: number): string {
  const bonus = emptyHandsVaultBonus(dist);
  if (QUIET) return '';
  return bonus > 0
    ? 'Empty Hands bonus +' + bonus + '¢'
    : 'Empty Hands — no bonus this short';
}
