// Chiptune music sequencer — distinct theme per stage.
import { G } from '../state';
import { AC, musicGain, noiseBuf } from './engine';
import { rand } from '../util';

type Theme = {
  bpm: number;
  roots: number[];
  minor: boolean;
  lead: number;
  bass: OscillatorType;
  hat: number; // density 0–1
  kickEvery: number; // steps
};

// One theme per stage (1–7). Distinct keys, tempos, and lead patterns.
const THEMES: Record<number, Theme> = {
  1: { bpm: 124, roots: [48, 53, 55, 48], minor: false, lead: 0, bass: 'square', hat: 0.45, kickEvery: 4 },
  2: { bpm: 134, roots: [50, 55, 57, 55], minor: false, lead: 1, bass: 'square', hat: 0.55, kickEvery: 4 },
  3: { bpm: 118, roots: [45, 50, 52, 43], minor: true, lead: 2, bass: 'triangle', hat: 0.35, kickEvery: 4 },
  4: { bpm: 140, roots: [52, 57, 59, 57], minor: false, lead: 3, bass: 'square', hat: 0.7, kickEvery: 2 },
  5: { bpm: 110, roots: [43, 48, 50, 46], minor: true, lead: 4, bass: 'triangle', hat: 0.3, kickEvery: 4 },
  6: { bpm: 128, roots: [47, 50, 54, 52], minor: true, lead: 5, bass: 'square', hat: 0.5, kickEvery: 4 },
  7: { bpm: 148, roots: [55, 60, 62, 58], minor: false, lead: 6, bass: 'sawtooth', hat: 0.8, kickEvery: 2 },
};

const LEADS = [
  [0, -1, 2, -1, 3, -1, 2, -1, 0, -1, 2, -1, 3, 2, 1, -1],
  [3, 2, 1, 0, 3, 2, 1, 0, 2, 1, 0, 1, 2, 3, 2, 1],
  [0, -1, -1, 2, -1, 3, -1, -1, 0, -1, -1, 2, -1, 1, -1, -1],
  [0, 2, 3, 2, 0, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 3],
  [0, -1, 3, -1, 0, -1, 2, -1, 0, -1, 3, 2, -1, 1, -1, -1],
  [0, 1, 3, -1, 2, -1, 3, 1, 0, -1, 2, 3, -1, 2, 1, -1],
  [3, -1, 2, 3, 1, -1, 0, 2, 3, 2, -1, 1, 0, 2, 3, 5],
];

let musicOn = false, musicStage = 1, musicStep = 0, musicNext = 0, musicTimer: any = 0;

function mtof(n: number) { return 440 * Math.pow(2, (n - 69) / 12); }

function mTone(t: number, freq: number, dur: number, type: OscillatorType, vol: number, freqEnd?: number) {
  if (!AC || !musicGain) return;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + dur + 0.03);
}

function mNoise(t: number, dur: number, vol: number, ffreq: number) {
  if (!AC || !musicGain || !noiseBuf) return;
  const src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = ffreq;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(musicGain);
  src.start(t, rand()); src.stop(t + dur + 0.02);
}

function playStep(th: Theme, step: number, t: number, sd: number) {
  const bar = (step >> 4) & 3, st = step & 15;
  const root = th.roots[bar];
  // Scale degrees: 1, 3, 5, octave, 9th, 10th
  const tri = [0, th.minor ? 3 : 4, 7, 12, 14, 16];
  // Bass
  if (st % 2 === 0) {
    const bassNote = root - 12 + (st % 8 === 6 ? 7 : 0);
    mTone(t, mtof(bassNote), sd * 1.8, th.bass, th.bass === 'sawtooth' ? 0.035 : 0.05);
  }
  // Kick
  if (st % th.kickEvery === 0) mTone(t, 150, 0.12, 'sine', 0.24, 42);
  // Snare
  if (st === 4 || st === 12) {
    mNoise(t, 0.09, 0.09, 1800);
    mTone(t, 230, 0.06, 'triangle', 0.05, 120);
  }
  // Hats — denser on later stages / during gun
  const hatOn = st % 2 === 1 || G.gunT > 0 || (th.hat > 0.6 && st % 4 === 2);
  if (hatOn && rand() < th.hat + (G.gunT > 0 ? 0.25 : 0)) {
    mNoise(t, 0.024, 0.032 + th.hat * 0.02, 7500);
  }
  // Lead
  const li = LEADS[th.lead % LEADS.length][st];
  if (li >= 0) {
    const leadType: OscillatorType = th.minor ? 'triangle' : 'square';
    mTone(t, mtof(root + 12 + tri[Math.min(li, tri.length - 1)]), sd * 1.5, leadType, 0.024);
  }
}

function musicTick() {
  if (!AC || !musicOn) return;
  const th = THEMES[musicStage] || THEMES[1];
  const sd = 60 / th.bpm / 4;
  if (musicNext < AC.currentTime - 0.3) musicNext = AC.currentTime + 0.05;
  while (musicNext < AC.currentTime + 0.18) {
    playStep(th, musicStep, musicNext, sd);
    musicNext += sd; musicStep++;
  }
}

export function startMusic(stage: number) {
  const next = Math.max(1, Math.min(7, stage | 0));
  // Already playing: retarget theme on level-up instead of no-op.
  if (musicOn) {
    if (next !== musicStage) {
      musicStage = next;
      musicStep = 0;
      if (AC) musicNext = AC.currentTime + 0.05;
    }
    return;
  }
  if (!AC) return;
  musicStage = next;
  musicOn = true;
  musicStep = 0;
  musicNext = AC.currentTime + 0.08;
  musicTimer = setInterval(musicTick, 40);
}

export function stopMusic() {
  musicOn = false;
  clearInterval(musicTimer);
}
