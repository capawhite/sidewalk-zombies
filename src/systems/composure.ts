// Mid-run composure payoffs: calm drip when full hearts, sharper shove when desperate.
import { LIVES_MAX } from '../config';
import { flash } from '../hud/hud';
import { G } from '../state';
import { buzz } from './haptics';

const CALM_EVERY = 22; // seconds at full composure
const CALM_CHAOS = 18;
const DESPERATE_CD = 0.68; // shove cooldown scale at 1 life

let calmT = 0;
let calmReady = false;

export function resetComposureRun() {
  calmT = 0;
  calmReady = false;
}

/** Call each play frame. */
export function updateComposurePayoffs(dt: number) {
  if (G.lives >= LIVES_MAX) {
    calmT += dt;
    if (calmT >= CALM_EVERY) {
      calmT = 0;
      G.scoreAcc += CALM_CHAOS;
      flash('KEEP CALM  +' + CALM_CHAOS, '#7ee08a');
      buzz('success');
      calmReady = true;
    }
  } else {
    calmT = 0;
  }
}

/** Multiplier on shove cooldown (lower = faster). */
export function shoveCdScale(): number {
  if (G.lives === 1) return DESPERATE_CD;
  return 1;
}

export function composureTip(): string | null {
  if (G.lives === 1) return 'LOSING IT — SHOVE FASTER';
  if (calmReady) { calmReady = false; return null; }
  return null;
}
