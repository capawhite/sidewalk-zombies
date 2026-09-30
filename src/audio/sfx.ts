// Sound effects.
import { burst, tone } from './engine';
import { rand } from '../util';

function sfxShove() {
  tone(196, 0.05, 'square', 0.12);
  tone(110, 0.09, 'square', 0.1, 0.04, 70);
  burst(0.05, 0.08, 800, 0, 'lowpass', 180);
}
function sfxCart() {
  tone(392, 0.05, 'square', 0.11);
  tone(247, 0.07, 'square', 0.09, 0.05);
  tone(98, 0.12, 'square', 0.08, 0.1, 55);
}
function sfxHorn() {
  tone(523, 0.16, 'square', 0.13);
  tone(262, 0.16, 'square', 0.08);
  tone(523, 0.13, 'square', 0.12, 0.26);
  tone(262, 0.13, 'square', 0.07, 0.26);
}
export function sfxGun() {
  tone(180 + rand() * 50, 0.028, 'square', 0.08);
  burst(0.025, 0.09, 2400, 0, 'highpass', 500);
}
function sfxBomb() {
  tone(180, 0.2, 'square', 0.14, 0, 42);
  tone(90, 0.4, 'square', 0.1, 0.05, 28);
  burst(0.35, 0.18, 380, 0, 'lowpass', 48);
  burst(0.07, 0.1, 1800, 0, 'highpass', 400);
}
export function sfxPickup(_kind: string) {
  tone(523, 0.06, 'square', 0.09);
  tone(659, 0.07, 'square', 0.08, 0.055);
  tone(784, 0.11, 'square', 0.07, 0.11);
}
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
export function sfxCoin(step = 0) {
  const r = Math.pow(2, MAJOR[Math.min(step, MAJOR.length - 1)] / 12);
  tone(988 * r, 0.06, 'square', 0.1);
  tone(1319 * r, 0.12, 'square', 0.09, 0.06);
}
export function sfxBump() {
  tone(98, 0.12, 'square', 0.11, 0, 48);
  burst(0.09, 0.1, 180, 0, 'lowpass', 50);
}
export function sfxNear(n: number) {
  const f = 523 + Math.min(n, 10) * 42;
  tone(f, 0.05, 'square', 0.07);
  tone(f * 1.25, 0.07, 'square', 0.045, 0.04);
}
export function sfxOver() {
  tone(196, 0.16, 'square', 0.1, 0, 110);
  tone(147, 0.2, 'square', 0.09, 0.14, 80);
  tone(98, 0.32, 'square', 0.08, 0.3, 48);
}
export function sfxFanfare() {
  tone(523, 0.11, 'square', 0.11);
  tone(659, 0.11, 'square', 0.11, 0.11);
  tone(784, 0.13, 'square', 0.12, 0.22);
  tone(1046, 0.28, 'square', 0.13, 0.36);
}
export function sfx1up() {
  [659, 784, 1319, 1046, 1175, 1568].forEach((f, i) => tone(f, 0.09, 'square', 0.1, i * 0.075));
}
export function sfxBanner() {
  tone(392, 0.07, 'square', 0.09);
  tone(587, 0.07, 'square', 0.09, 0.08);
  tone(784, 0.2, 'square', 0.1, 0.16);
}
export function sfxWallet(k: number, n: number) {
  tone(660 + (k / Math.max(1, n)) * 700, 0.05, 'square', 0.07);
}
export function sfxKaching() {
  tone(1319, 0.07, 'square', 0.1);
  tone(1760, 0.3, 'square', 0.11, 0.08);
  burst(0.05, 0.08, 6000, 0, 'highpass');
}
export function playPower(kind: string) {
  if (kind === 'cart') sfxCart();
  else if (kind === 'horn') sfxHorn();
  else if (kind === 'gun') { /* per-shot */ }
  else if (kind === 'bomb') sfxBomb();
  else sfxShove();
}