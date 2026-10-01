// Arcade-style layered sound effects (chiptune stack: square + triangle + noise).
import { burst, holdTone, tone } from './engine';
import { rand } from '../util';

/** Short stacked blip — square body + triangle sparkle. */
function blip(freq: number, dur: number, vol: number, when = 0, end?: number) {
  tone(freq, dur, 'square', vol, when, end);
  tone(freq * 2, dur * 0.7, 'triangle', vol * 0.45, when + 0.008, end ? end * 2 : undefined);
}

function sfxShove() {
  // Punchy body hit + grit scrape.
  tone(220, 0.04, 'square', 0.14);
  tone(110, 0.1, 'sawtooth', 0.1, 0.02, 55);
  holdTone(90, 0.12, 'triangle', 0.08, 0.01, 'lowpass', 220, 1.2, 40);
  burst(0.06, 0.11, 900, 0, 'lowpass', 140);
  burst(0.035, 0.07, 3200, 0.02, 'highpass', 800);
}

function sfxCart() {
  // Metallic clang + wooden follow-through.
  blip(523, 0.045, 0.12);
  tone(330, 0.08, 'triangle', 0.1, 0.04);
  tone(165, 0.14, 'square', 0.09, 0.08, 70);
  burst(0.05, 0.08, 1400, 0.02, 'bandpass', 400, 2);
}

function sfxHorn() {
  // Classic two-tone beep-beep with harmonics.
  holdTone(523, 0.15, 'square', 0.13, 0, 'bandpass', 900, 2);
  tone(1046, 0.12, 'triangle', 0.06, 0.01);
  holdTone(523, 0.12, 'square', 0.12, 0.24, 'bandpass', 900, 2);
  tone(1046, 0.1, 'triangle', 0.05, 0.25);
}

export function sfxGun() {
  // Laser-ish pew with noise crack.
  const f = 420 + rand() * 90;
  tone(f, 0.035, 'square', 0.1, 0, f * 0.35);
  tone(f * 1.5, 0.025, 'triangle', 0.06, 0.005, f * 0.5);
  burst(0.03, 0.11, 2800, 0, 'highpass', 600);
}

function sfxBomb() {
  // Deep boom + debris shower.
  tone(140, 0.22, 'sawtooth', 0.16, 0, 36);
  tone(70, 0.45, 'square', 0.12, 0.04, 22);
  holdTone(55, 0.35, 'triangle', 0.1, 0.02, 'lowpass', 180, 1, 28);
  burst(0.4, 0.22, 420, 0, 'lowpass', 40);
  burst(0.1, 0.12, 2200, 0.05, 'highpass', 500);
  burst(0.08, 0.08, 5000, 0.12, 'highpass', 1200);
}

export function sfxPickup(_kind: string) {
  // Rising power-up arpeggio.
  blip(392, 0.05, 0.1);
  blip(523, 0.055, 0.1, 0.05);
  blip(659, 0.06, 0.09, 0.1);
  blip(784, 0.1, 0.1, 0.155);
  burst(0.04, 0.05, 4000, 0.18, 'highpass');
}

const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
export function sfxCoin(step = 0) {
  // Bright coin sparkle that climbs with combo.
  const r = Math.pow(2, MAJOR[Math.min(step, MAJOR.length - 1)] / 12);
  blip(988 * r, 0.05, 0.11);
  tone(1480 * r, 0.1, 'triangle', 0.09, 0.045);
  burst(0.03, 0.05, 7000, 0.02, 'highpass');
}

export function sfxBump() {
  // Soft fail thud.
  tone(90, 0.14, 'square', 0.12, 0, 42);
  tone(60, 0.18, 'triangle', 0.08, 0.02, 30);
  burst(0.1, 0.12, 200, 0, 'lowpass', 45);
}

export function sfxNear(n: number) {
  // Tight miss whistle that climbs with streak.
  const f = 587 + Math.min(n, 10) * 48;
  blip(f, 0.045, 0.08);
  tone(f * 1.5, 0.06, 'triangle', 0.05, 0.035);
}

export function sfxOver() {
  // Descending game-over dirge with grit.
  blip(220, 0.14, 0.1, 0, 140);
  blip(165, 0.18, 0.09, 0.14, 100);
  blip(110, 0.3, 0.09, 0.3, 55);
  burst(0.2, 0.08, 300, 0.35, 'lowpass', 60);
}

export function sfxFanfare() {
  // Level-clear brass-ish climb.
  const notes = [523, 659, 784, 1046];
  notes.forEach((f, i) => {
    blip(f, 0.1 + i * 0.02, 0.11, i * 0.1);
    tone(f * 0.5, 0.12, 'triangle', 0.05, i * 0.1);
  });
  burst(0.06, 0.06, 5000, 0.42, 'highpass');
}

export function sfx1up() {
  // Classic 1-UP sparkle run.
  [659, 784, 1046, 1319, 1568, 2093].forEach((f, i) => {
    blip(f, 0.08, 0.1, i * 0.07);
  });
}

export function sfxBanner() {
  blip(392, 0.06, 0.1);
  blip(587, 0.06, 0.1, 0.07);
  blip(784, 0.18, 0.11, 0.14);
}

export function sfxWallet(k: number, n: number) {
  const f = 700 + (k / Math.max(1, n)) * 800;
  blip(f, 0.045, 0.08);
}

export function sfxKaching() {
  blip(1319, 0.06, 0.11);
  tone(1760, 0.28, 'triangle', 0.12, 0.07);
  tone(2093, 0.2, 'square', 0.07, 0.1);
  burst(0.05, 0.09, 6500, 0.05, 'highpass');
}

export function playPower(kind: string) {
  if (kind === 'cart') sfxCart();
  else if (kind === 'horn') sfxHornVariant();
  else if (kind === 'gun') { /* per-shot */ }
  else if (kind === 'bomb') sfxBomb();
  else sfxShove();
}

/** Stage 5: horn cosmetic variants (timbre only — same power). */
let hornId = 'horn_classic';
export function setHornCosmetic(id: string) {
  hornId = id;
}
function sfxHornVariant() {
  if (hornId === 'horn_bike') {
    blip(1568, 0.04, 0.1);
    blip(2093, 0.055, 0.08, 0.03);
    blip(1568, 0.05, 0.07, 0.11);
  } else if (hornId === 'horn_air') {
    holdTone(420, 0.24, 'sawtooth', 0.14, 0, 'lowpass', 900, 1.5);
    holdTone(380, 0.24, 'sawtooth', 0.1, 0.02, 'lowpass', 800, 1.5);
    burst(0.2, 0.13, 1000, 0, 'lowpass', 200);
  } else if (hornId === 'horn_goose') {
    tone(280, 0.08, 'square', 0.13, 0, 160);
    tone(220, 0.14, 'sawtooth', 0.11, 0.06, 90);
    tone(340, 0.1, 'square', 0.1, 0.18, 120);
    burst(0.06, 0.06, 800, 0.1, 'bandpass', 300, 2);
  } else if (hornId === 'horn_excuse') {
    [440, 440, 330, 523].forEach((f, i) => blip(f, 0.065, 0.11, i * 0.085));
    burst(0.05, 0.08, 700, 0.34, 'highpass', 400);
  } else {
    sfxHorn();
  }
}
