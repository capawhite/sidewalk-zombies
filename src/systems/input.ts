// Keyboard, pointer and button input.
import { audioResume, toggleMute } from '../audio/engine';
import { STEER_FLICK, STEER_TAP_BUFFER, STEER_TOUCH_SPAN } from '../config';
import { player } from '../entities/player';
import { wrap } from '../render/renderer';
import { G, S, keys } from '../state';
import { clamp } from '../util';
import { enterNextLevel } from './levels';
import { start } from './lifecycle';
import { doShove } from './powers';

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (G.state === S.clear) enterNextLevel();
    else doShove();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keys.left = false; G.tapLeft = STEER_TAP_BUFFER; }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = false; G.tapRight = STEER_TAP_BUFFER; }
});
wrap.addEventListener('pointerdown', (e) => {
  if (G.state !== S.play) return;
  const tid = (e.target as HTMLElement).id;
  if (tid === 'shove' || tid === 'mute') return;
  G.pointerActive = true;
  G.pointerX = G.pointerOriginX = G.pointerLastX = e.clientX;
  G.pointerLastT = performance.now();
  G.pointerFlick = 0;
  G.touchAnchorX = player.position.x;
  try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  audioResume();
});
wrap.addEventListener('pointermove', (e) => {
  if (!G.pointerActive) return;
  const t = performance.now();
  const dtm = (t - G.pointerLastT) / 1000;
  if (dtm > 0.0001) G.pointerFlick = (e.clientX - G.pointerLastX) / dtm;
  G.pointerX = G.pointerLastX = e.clientX;
  G.pointerLastT = t;
});
window.addEventListener('pointerup', () => {
  if (G.pointerActive) {
    const flickU = (G.pointerFlick / Math.max(wrap.clientWidth, 1)) * STEER_TOUCH_SPAN * STEER_FLICK;
    G.vx = clamp(flickU, -9, 9);
  }
  G.pointerActive = false;
});
document.getElementById('shove')!.addEventListener('click', doShove);
document.getElementById('start')!.addEventListener('click', () => start({ mode: 'free' }));
document.getElementById('daily')!.addEventListener('click', () => start({ mode: 'daily' }));
document.getElementById('again')!.addEventListener('click', () => start({ mode: 'free' }));
document.getElementById('continue')!.addEventListener('click', (e) => {
  e.stopPropagation();
  if (G.state === S.clear) enterNextLevel();
});