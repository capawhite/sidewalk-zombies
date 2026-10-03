// Chapter unlocks, star ratings, and city-map progress (local).
import { STAGES } from '../config';
import { G } from '../state';

const LS_UNLOCK = 'sz_chap_unlock';
const LS_STARS = 'sz_chap_stars';
const LS_BEST = 'sz_chap_best';
const QUIET = typeof location !== 'undefined' && new URLSearchParams(location.search).has('replay');

/** Short labels for the city map. */
export const CHAPTER_SHORT = [
  'Aisle', 'Boardwalk', 'Food Court', 'Beach', 'Garage', 'Station', 'Airport',
];

let unlocked = 1; // highest chapter id unlocked (1..7)
let stars: number[] = [0, 0, 0, 0, 0, 0, 0]; // index 0 = chapter 1
let bestM: number[] = [0, 0, 0, 0, 0, 0, 0];

/** Per-chapter run tracking (reset on chapter enter). */
export const chapterRun = {
  livesLost: 0,
  nearPeak: 0,
  startDist: 0,
};

function load() {
  if (QUIET) { unlocked = 7; return; }
  try {
    unlocked = Math.max(1, Math.min(7, parseInt(localStorage.getItem(LS_UNLOCK) || '1', 10) || 1));
    const s = JSON.parse(localStorage.getItem(LS_STARS) || '[]');
    if (Array.isArray(s)) for (let i = 0; i < 7; i++) stars[i] = Math.max(0, Math.min(3, s[i] | 0));
    const b = JSON.parse(localStorage.getItem(LS_BEST) || '[]');
    if (Array.isArray(b)) for (let i = 0; i < 7; i++) bestM[i] = Math.max(0, b[i] | 0);
  } catch { /* ignore */ }
}

function save() {
  if (QUIET) return;
  try {
    localStorage.setItem(LS_UNLOCK, String(unlocked));
    localStorage.setItem(LS_STARS, JSON.stringify(stars));
    localStorage.setItem(LS_BEST, JSON.stringify(bestM));
  } catch { /* ignore */ }
}

export function initProgress() {
  load();
  // Catch returning players who already cleared stages before the map existed.
  try {
    const best = parseInt(localStorage.getItem('sz_best') || '0', 10) || 0;
    for (let i = 0; i < STAGES.length - 1; i++) {
      const need = STAGES[i].clearAt;
      if (need && best >= need) unlockChapter(i + 2);
    }
  } catch { /* ignore */ }
}

export function getUnlocked(): number {
  return unlocked;
}
export function getStars(chapter: number): number {
  return stars[chapter - 1] || 0;
}
export function getBestMetres(chapter: number): number {
  return bestM[chapter - 1] || 0;
}
export function isChapterUnlocked(chapter: number): boolean {
  return chapter >= 1 && chapter <= unlocked;
}

export function resetChapterRun(startDist = G.dist) {
  chapterRun.livesLost = 0;
  chapterRun.nearPeak = 0;
  chapterRun.startDist = startDist;
}

export function noteChapterLifeLost() {
  chapterRun.livesLost++;
}

export function noteChapterNearMiss(streak: number) {
  if (streak > chapterRun.nearPeak) chapterRun.nearPeak = streak;
}

/** Award stars for clearing `chapter` (1–6) or finishing a strong airport run. */
export function awardChapterStars(chapter: number, cleared: boolean) {
  if (chapter < 1 || chapter > 7) return 0;
  let earned = 0;
  if (cleared || chapter === 7) earned = 1;
  if (chapterRun.nearPeak >= 4) earned++;
  if (chapterRun.livesLost === 0 && (cleared || chapter === 7)) earned++;
  earned = Math.min(3, earned);
  const i = chapter - 1;
  if (earned > stars[i]) {
    stars[i] = earned;
    save();
  }
  return stars[i];
}

export function unlockChapter(chapter: number) {
  if (chapter > unlocked && chapter <= 7) {
    unlocked = chapter;
    save();
  }
}

export function noteChapterBest(chapter: number, metres: number) {
  const i = chapter - 1;
  if (metres > bestM[i]) {
    bestM[i] = metres;
    save();
  }
}

/** Dist the player should start at so clear thresholds still make sense. */
export function startDistForChapter(chapter: number): number {
  if (chapter <= 1) return 0;
  const prev = STAGES[chapter - 2];
  return prev?.clearAt || 0;
}

export function chapterCount(): number {
  return STAGES.length;
}
