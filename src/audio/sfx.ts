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
  // Layered near-miss: climb pitch, add harmony, milestone accents.
  const step = Math.min(Math.max(1, n), 12);
  const f = 523 + step * 55;
  blip(f, 0.04 + step * 0.002, 0.075 + Math.min(step, 8) * 0.004);
  tone(f * 1.5, 0.055, 'triangle', 0.045 + step * 0.002, 0.03);
  // Soft under-sparkle that thickens with the streak.
  if (step >= 2) {
    tone(f * 2, 0.04, 'square', 0.03, 0.02);
  }
  if (step >= 3) {
    blip(f * 1.25, 0.035, 0.05, 0.05);
    burst(0.03, 0.04 + step * 0.003, 5000, 0.02, 'highpass', 1800);
  }
  if (step >= 5) {
    // Mini arpeggio accent
    blip(f, 0.03, 0.06, 0.07);
    blip(f * 1.25, 0.035, 0.07, 0.1);
    blip(f * 1.5, 0.05, 0.08, 0.14);
  }
  if (step >= 8) {
    holdTone(f * 0.5, 0.12, 'triangle', 0.05, 0.02, 'lowpass', 900, 1.2);
    burst(0.05, 0.06, 3200, 0.08, 'bandpass', 1200, 1.5);
  }
  if (step >= 10) {
    // Capstone sparkle
    [f, f * 1.25, f * 1.5, f * 2].forEach((note, i) => blip(note, 0.045, 0.09, 0.16 + i * 0.04));
  }
}

/** Optional sting when a near-miss streak dies (called from gameplay). */
export function sfxNearBreak(was: number) {
  if (was < 3) return;
  tone(220, 0.08, 'square', 0.05, 0, 120);
  burst(0.06, 0.05, 400, 0.02, 'lowpass', 80);
}

export function sfxRage() {
  // Short red-alert chirp when Losing It / Rage arms.
  holdTone(140, 0.16, 'sawtooth', 0.1, 0, 'lowpass', 500, 1.2);
  blip(440, 0.05, 0.09, 0.04);
  blip(330, 0.06, 0.08, 0.1);
  burst(0.08, 0.07, 800, 0.05, 'bandpass', 300, 1.5);
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

function sfxWhistle() {
  // Piercing two-tone ref blow.
  holdTone(1480, 0.12, 'square', 0.11, 0, 'bandpass', 2200, 2);
  tone(1760, 0.1, 'triangle', 0.07, 0.02);
  holdTone(1320, 0.16, 'square', 0.1, 0.14, 'bandpass', 2000, 2);
  burst(0.04, 0.05, 5000, 0.08, 'highpass', 1200);
}

function sfxSpray() {
  // Aerosol hiss + soft drip.
  burst(0.22, 0.1, 2800, 0, 'bandpass', 900, 1.5);
  burst(0.18, 0.07, 4200, 0.04, 'highpass', 1600);
  tone(180, 0.12, 'triangle', 0.04, 0.02, 90);
}

function sfxUmbrella() {
  // Fabric whoosh + soft pop.
  burst(0.1, 0.08, 1200, 0, 'bandpass', 400, 1.2);
  tone(330, 0.08, 'triangle', 0.07, 0.02);
  blip(523, 0.05, 0.08, 0.06);
  tone(220, 0.12, 'square', 0.05, 0.08, 110);
}

export function playPower(kind: string) {
  if (kind === 'cart') sfxCart();
  else if (kind === 'horn') sfxHornVariant();
  else if (kind === 'gun') { /* per-shot */ }
  else if (kind === 'bomb') sfxBomb();
  else if (kind === 'whistle') sfxWhistle();
  else if (kind === 'spray') sfxSpray();
  else if (kind === 'umbrella') sfxUmbrella();
  else sfxShove();
}

/** One-shot chapter flavour sting (mall PA, seagulls, boarding call, …). */
export function sfxChapterSting(level: number) {
  if (level === 1) {
    // Aisle beep + cart squeak
    blip(880, 0.05, 0.08);
    blip(660, 0.06, 0.07, 0.06);
    burst(0.08, 0.06, 900, 0.1, 'bandpass', 400, 2);
  } else if (level === 2) {
    // Boardwalk shutter click
    burst(0.03, 0.1, 4000, 0, 'highpass', 1500);
    blip(1174, 0.04, 0.09, 0.04);
  } else if (level === 3) {
    // Mall PA chime
    [523, 659, 784].forEach((f, i) => blip(f, 0.1, 0.09, i * 0.11));
    holdTone(392, 0.25, 'triangle', 0.05, 0.35, 'lowpass', 800, 1);
  } else if (level === 4) {
    // Seagull squawk
    tone(880, 0.08, 'sawtooth', 0.09, 0, 500);
    tone(1100, 0.1, 'square', 0.08, 0.07, 600);
    burst(0.06, 0.05, 2200, 0.05, 'highpass', 800);
  } else if (level === 5) {
    // Garage tire squeal
    holdTone(220, 0.2, 'sawtooth', 0.1, 0, 'bandpass', 600, 2);
    tone(180, 0.18, 'square', 0.08, 0.05, 90);
    burst(0.12, 0.08, 500, 0.08, 'lowpass', 120);
  } else if (level === 6) {
    // Train horn distant
    holdTone(196, 0.28, 'sawtooth', 0.12, 0, 'lowpass', 500, 1.2);
    holdTone(247, 0.22, 'square', 0.08, 0.08, 'lowpass', 600, 1.2);
    burst(0.15, 0.1, 300, 0.1, 'lowpass', 80);
  } else {
    // Airport boarding call
    [440, 554, 659, 880].forEach((f, i) => blip(f, 0.08, 0.1, i * 0.09));
    holdTone(330, 0.3, 'triangle', 0.06, 0.4, 'lowpass', 700, 1);
  }
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
  } else if (hornId === 'horn_train') {
    holdTone(165, 0.32, 'sawtooth', 0.14, 0, 'lowpass', 480, 1.3);
    holdTone(196, 0.28, 'square', 0.1, 0.06, 'lowpass', 520, 1.3);
    burst(0.18, 0.12, 280, 0.05, 'lowpass', 70);
  } else if (hornId === 'horn_jingle') {
    [784, 988, 1174, 988, 784].forEach((f, i) => blip(f, 0.05, 0.1, i * 0.06));
    burst(0.04, 0.05, 6000, 0.28, 'highpass', 2000);
  } else if (hornId === 'horn_witch') {
    tone(420, 0.1, 'sawtooth', 0.1, 0, 280);
    tone(520, 0.12, 'square', 0.09, 0.08, 360);
    tone(300, 0.16, 'sawtooth', 0.1, 0.18, 180);
    burst(0.08, 0.06, 900, 0.12, 'bandpass', 400, 2);
  } else {
    sfxHorn();
  }
}
