// Chiptune music sequencer.
import { G } from '../state';
import { AC, musicGain, noiseBuf } from './engine';
import { rand } from '../util';

// ---------- chiptune music ----------
const THEMES: any = {
  1: { bpm: 126, roots: [48, 53, 55, 48], minor: false, lead: 0 },
  2: { bpm: 136, roots: [50, 55, 57, 55], minor: false, lead: 1 },
  3: { bpm: 116, roots: [45, 50, 52, 43], minor: true, lead: 2 },
  4: { bpm: 142, roots: [52, 57, 59, 57], minor: false, lead: 3 },
};
const LEADS = [
  [0, -1, 2, -1, 3, -1, 2, -1, 0, -1, 2, -1, 3, 2, 1, -1],
  [3, 2, 1, 0, 3, 2, 1, 0, 2, 1, 0, 1, 2, 3, 2, 1],
  [0, -1, -1, 2, -1, 3, -1, -1, 0, -1, -1, 2, -1, 1, -1, -1],
  [0, 2, 3, 2, 0, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 3],
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
function playStep(th: any, step: number, t: number, sd: number) {
  const bar = (step >> 4) & 3, st = step & 15;
  const root = th.roots[bar];
  const tri = [0, th.minor ? 3 : 4, 7, 12];
  if (st % 2 === 0) mTone(t, mtof(root - 12 + (st % 8 === 6 ? 7 : 0)), sd * 1.8, 'square', 0.05);
  if (st % 4 === 0) mTone(t, 150, 0.12, 'sine', 0.24, 42);
  if (st === 4 || st === 12) { mNoise(t, 0.09, 0.09, 1800); mTone(t, 230, 0.06, 'triangle', 0.05, 120); }
  if (st % 2 === 1 || G.gunT > 0) mNoise(t, 0.028, 0.035, 7500);
  const li = LEADS[th.lead][st];
  if (li >= 0) mTone(t, mtof(root + 12 + tri[li]), sd * 1.5, 'square', 0.022);
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
  musicStage = Math.min(stage, 4);
  if (musicOn || !AC) return;
  musicOn = true; musicStep = 0; musicNext = AC.currentTime + 0.08;
  musicTimer = setInterval(musicTick, 40);
}
export function stopMusic() {
  musicOn = false;
  clearInterval(musicTimer);
}