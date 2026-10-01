// Stage 9: Daily Sidewalk — one shared seed per local calendar day.
//
// Spawns / events / encounters / pickups all go through rand(), so a dated seed
// makes every player's crowd script comparable. Scores stay local (no server board).
import { G, S } from '../state';
import { mulberry32, resetRandomSource, setRandomSource } from '../util';

const LS_DAY = 'sz_daily_day';
const LS_BEST = 'sz_daily_best';
const LS_BEST_DIST = 'sz_daily_dist';
const QUIET = typeof location !== 'undefined' && new URLSearchParams(location.search).has('replay');

export type RunMode = 'free' | 'daily';

let mode: RunMode = 'free';
let dayKey = '';
let daySeed = 0;
let bestTotal = 0;
let bestDist = 0;

let elChip: HTMLElement | null = null;
let elChipText: HTMLElement | null = null;
let elMenuBest: HTMLElement | null = null;

export function localDayKey(d = new Date()): string {
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

export function seedFromDayKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return (h ^ 0x5a444c59) >>> 0; // mix tag "ZDLY"
}

function loadBest(key: string) {
  bestTotal = 0;
  bestDist = 0;
  if (QUIET) return;
  try {
    if (localStorage.getItem(LS_DAY) !== key) return;
    bestTotal = parseInt(localStorage.getItem(LS_BEST) || '0', 10) || 0;
    bestDist = parseInt(localStorage.getItem(LS_BEST_DIST) || '0', 10) || 0;
  } catch { /* ignore */ }
}

function saveBest(key: string, total: number, dist: number) {
  if (QUIET) return;
  try {
    localStorage.setItem(LS_DAY, key);
    localStorage.setItem(LS_BEST, String(total));
    localStorage.setItem(LS_BEST_DIST, String(dist));
  } catch { /* ignore */ }
}

export function getRunMode(): RunMode {
  return mode;
}
export function isDailyRun(): boolean {
  return mode === 'daily';
}
export function todaysDailySeed(): number {
  return daySeed;
}
export function todaysDailyBest(): { total: number; dist: number; day: string } {
  return { total: bestTotal, dist: bestDist, day: dayKey };
}

/** Arm RNG for the next run. Call at the top of start() before any rand(). */
export function beginRunMode(next: RunMode) {
  mode = next;
  if (next === 'daily') {
    dayKey = localDayKey();
    daySeed = seedFromDayKey(dayKey);
    loadBest(dayKey);
    setRandomSource(mulberry32(daySeed));
  } else {
    // Free play: leave RNG alone if the replay harness already installed a source.
    if (!QUIET) resetRandomSource();
  }
}

export function paintDailyMenu() {
  if (!elMenuBest) return;
  loadBest(localDayKey());
  dayKey = localDayKey();
  daySeed = seedFromDayKey(dayKey);
  if (bestTotal > 0) {
    elMenuBest.textContent =
      'Daily best today: ' + bestTotal.toLocaleString()
      + ' · ' + bestDist.toLocaleString() + 'm · seed ' + daySeed.toString(16).toUpperCase();
  } else {
    elMenuBest.textContent =
      'Daily Sidewalk · shared seed ' + daySeed.toString(16).toUpperCase() + ' · not played yet';
  }
}

export function resetDailyRunHud() {
  if (!elChip || !elChipText) return;
  if (mode !== 'daily' || G.state !== S.play) {
    elChip.classList.add('hide');
    return;
  }
  elChip.classList.remove('hide');
  elChipText.textContent = 'DAILY · ' + Math.floor(G.dist).toLocaleString() + 'm';
}

export function updateDailyHud() {
  if (mode !== 'daily' || G.state !== S.play || !elChipText) return;
  elChip.classList?.remove('hide');
  elChipText.textContent = 'DAILY · ' + Math.floor(G.dist).toLocaleString() + 'm';
}

export function hideDailyChip() {
  if (elChip) elChip.classList.add('hide');
}

/** Record today's personal best if this daily run improved it. Returns whether it was a PB. */
export function recordDailyResult(total: number, dist: number): boolean {
  if (mode !== 'daily' || QUIET) return false;
  dayKey = localDayKey();
  loadBest(dayKey);
  if (total > bestTotal) {
    bestTotal = total;
    bestDist = dist;
    saveBest(dayKey, bestTotal, bestDist);
    paintDailyMenu();
    return true;
  }
  return false;
}

export function fillDailyOver(el?: HTMLElement | null) {
  const node = el || document.getElementById('overDaily');
  if (!node) return;
  if (mode !== 'daily') {
    node.classList.add('hide');
    return;
  }
  node.classList.remove('hide');
  const pb = bestTotal;
  node.textContent = pb > 0
    ? 'Daily Sidewalk · today\'s best ' + pb.toLocaleString() + ' (seed ' + daySeed.toString(16).toUpperCase() + ')'
    : 'Daily Sidewalk · seed ' + daySeed.toString(16).toUpperCase();
}

export function initDaily() {
  elChip = document.getElementById('dailyChip');
  elChipText = document.getElementById('dailyChipText');
  elMenuBest = document.getElementById('dailyBest');
  dayKey = localDayKey();
  daySeed = seedFromDayKey(dayKey);
  loadBest(dayKey);
  paintDailyMenu();
  if (elChip) elChip.classList.add('hide');
}
