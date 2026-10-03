// Stage 4: daily / run objectives — one rotating challenge per local day.
//
// Progress is tracked from existing run stats. Rewards go to the vault only
// (never G.coins / score) so the replay harness stays untouched.
import { flash } from '../hud/hud';
import { G } from '../state';
import { grantRandomCosmetic, syncVaultDom } from './cosmetics';

export type ChalKind =
  | 'dist'
  | 'combo'
  | 'chains'
  | 'near'
  | 'bonk_inf'
  | 'bonk_any'
  | 'pacifist';

export interface ChallengeDef {
  id: string;
  label: string;
  short: string;
  kind: ChalKind;
  target: number;
  reward: number;
}

/** Add challenges here — daily picker hashes the local date into this pool. */
export const CHALLENGE_POOL: ChallengeDef[] = [
  { id: 'inf12', label: 'Bonk 12 influencers', short: 'INF BONKS', kind: 'bonk_inf', target: 12, reward: 30 },
  { id: 'dist800', label: 'Reach 800 metres', short: 'DISTANCE', kind: 'dist', target: 800, reward: 25 },
  { id: 'combo6', label: 'Hit a ×6 combo', short: 'COMBO', kind: 'combo', target: 6, reward: 30 },
  { id: 'chain3', label: 'Trigger 3 chain reactions', short: 'CHAINS', kind: 'chains', target: 3, reward: 25 },
  { id: 'zen500', label: 'Reach 500m without bonking', short: 'PACIFIST', kind: 'pacifist', target: 500, reward: 40 },
  { id: 'near8', label: 'Get 8 near misses', short: 'NEAR MISS', kind: 'near', target: 8, reward: 25 },
  { id: 'bonk20', label: 'Bonk 20 sidewalk zombies', short: 'BONKS', kind: 'bonk_any', target: 20, reward: 20 },
  { id: 'dist1200', label: 'Reach 1,200 metres', short: 'DISTANCE', kind: 'dist', target: 1200, reward: 35 },
  { id: 'combo10', label: 'Hit a ×10 combo', short: 'COMBO', kind: 'combo', target: 10, reward: 45 },
  { id: 'near15', label: 'Get 15 near misses', short: 'NEAR MISS', kind: 'near', target: 15, reward: 35 },
  { id: 'empty600', label: 'Empty Hands: 600m shove-only', short: 'EMPTY', kind: 'dist', target: 600, reward: 50 },
];

const LS_DAY = 'sz_chal_day';
const LS_DONE = 'sz_chal_done';
const QUIET = typeof location !== 'undefined' && new URLSearchParams(location.search).has('replay');

interface RunTrack {
  bonks: number;
  bonkInf: number;
  failedPacifist: boolean;
  awarded: boolean;
}

let dayKey = '';
let today: ChallengeDef = CHALLENGE_POOL[0];
let doneToday = false;
let run: RunTrack = { bonks: 0, bonkInf: 0, failedPacifist: false, awarded: false };

let elChip: HTMLElement | null = null;
let elLabel: HTMLElement | null = null;
let elProg: HTMLElement | null = null;
let elMenu: HTMLElement | null = null;
let elOver: HTMLElement | null = null;

function localDayKey(): string {
  const d = new Date();
  return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();
}

function hashPick(key: string): ChallengeDef {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return CHALLENGE_POOL[h % CHALLENGE_POOL.length];
}

function readDone(key: string): boolean {
  try {
    return localStorage.getItem(LS_DAY) === key && localStorage.getItem(LS_DONE) === '1';
  } catch {
    return false;
  }
}

function writeDone(key: string) {
  if (QUIET) return;
  try {
    localStorage.setItem(LS_DAY, key);
    localStorage.setItem(LS_DONE, '1');
  } catch { /* ignore */ }
}

function progressValue(): number {
  switch (today.kind) {
    case 'dist': return Math.floor(G.dist);
    case 'combo': return G.bestCombo;
    case 'chains': return G.chainReactions;
    case 'near': return G.nearMisses;
    case 'bonk_inf': return run.bonkInf;
    case 'bonk_any': return run.bonks;
    case 'pacifist': return run.failedPacifist ? 0 : Math.floor(G.dist);
    default: return 0;
  }
}

function isComplete(): boolean {
  if (doneToday || run.awarded) return true;
  if (today.kind === 'pacifist' && run.failedPacifist) return false;
  return progressValue() >= today.target;
}

function formatProg(cur: number): string {
  if (doneToday || run.awarded) return 'DONE';
  if (today.kind === 'pacifist' && run.failedPacifist) return 'FAILED';
  const shown = Math.min(cur, today.target);
  return shown + ' / ' + today.target;
}

function paintChip() {
  if (!elChip || !elLabel || !elProg) return;
  const cur = progressValue();
  elLabel.textContent = 'TODAY · ' + today.short;
  elProg.textContent = formatProg(cur);
  elChip.classList.remove('hide', 'done', 'fail');
  if (doneToday || run.awarded) elChip.classList.add('done');
  else if (today.kind === 'pacifist' && run.failedPacifist) elChip.classList.add('fail');
  // Fill bar via CSS var
  const pct = doneToday || run.awarded ? 1 : Math.min(1, cur / today.target);
  elChip.style.setProperty('--chal', String(pct));
}

function paintMenu() {
  if (!elMenu) return;
  if (doneToday) {
    elMenu.textContent = 'Today\'s challenge: cleared · +' + today.reward + ' vault';
    elMenu.classList.add('done');
  } else {
    elMenu.textContent = 'Today: ' + today.label + ' · +' + today.reward + ' coins';
    elMenu.classList.remove('done');
  }
}

function completeChallenge() {
  if (run.awarded || doneToday) return;
  run.awarded = true;
  doneToday = true;
  writeDone(dayKey);
  if (!QUIET) {
    G.vault += today.reward;
    try { localStorage.setItem('sz_vault', String(G.vault)); } catch { /* ignore */ }
    syncVaultDom();
    const prize = grantRandomCosmetic();
    flash(
      prize
        ? 'CHALLENGE CLEAR  +' + today.reward + ' · UNLOCKED ' + prize.toUpperCase()
        : 'CHALLENGE CLEAR  +' + today.reward,
      '#f0d078',
    );
  }
  paintChip();
  paintMenu();
}

/** Call once after DOM is ready. */
export function initChallenges() {
  dayKey = localDayKey();
  today = hashPick(dayKey);
  doneToday = readDone(dayKey);
  elChip = document.getElementById('chalChip');
  elLabel = document.getElementById('chalLabel');
  elProg = document.getElementById('chalProg');
  elMenu = document.getElementById('menuChal');
  elOver = document.getElementById('overChal');
  paintMenu();
  if (elChip) elChip.classList.add('hide');
}

export function resetChallengeRun() {
  run = { bonks: 0, bonkInf: 0, failedPacifist: false, awarded: doneToday };
  // Refresh day in case the tab sat overnight.
  const key = localDayKey();
  if (key !== dayKey) {
    dayKey = key;
    today = hashPick(dayKey);
    doneToday = readDone(dayKey);
    run.awarded = doneToday;
    paintMenu();
  }
  paintChip();
  if (elChip) elChip.classList.remove('hide');
}

export function hideChallengeChip() {
  if (elChip) elChip.classList.add('hide');
}

/** Every knocked zombie (including couple partners / chains). */
export function onChallengeBonk(type: string) {
  run.bonks++;
  G.bonks++;
  if (type === 'inf') run.bonkInf++;
  if (today.kind === 'pacifist') run.failedPacifist = true;
}

export function updateChallenges() {
  if (!elChip) return;
  paintChip();
  if (!QUIET && !doneToday && !run.awarded && isComplete()) completeChallenge();
}

export function challengeOverLine(): string {
  if (run.awarded || doneToday) return 'Today\'s challenge: cleared · +' + today.reward + ' vault';
  if (today.kind === 'pacifist' && run.failedPacifist) return 'Today\'s challenge: failed (you bonked)';
  const cur = progressValue();
  return 'Today: ' + today.label + ' · ' + Math.min(cur, today.target) + '/' + today.target;
}

export function paintChallengeOver() {
  if (!elOver) return;
  elOver.textContent = challengeOverLine();
}

export function todaysChallenge(): ChallengeDef {
  return today;
}
