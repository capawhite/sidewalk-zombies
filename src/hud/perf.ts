// Toggleable FPS / draw-call overlay. Enable with ?perf in the URL, or press P.
import { renderer } from '../render/renderer';

const REFRESH_SECONDS = 0.5;

const el = document.createElement('div');
el.style.cssText = [
  'position:fixed', 'left:6px', 'top:6px', 'z-index:9999', 'padding:4px 6px',
  'font:11px/1.35 ui-monospace,Menlo,monospace', 'color:#9cff9c', 'background:rgba(0,0,0,.65)',
  'border-radius:4px', 'pointer-events:none', 'white-space:pre', 'display:none',
].join(';');
document.body.appendChild(el);

let visible = false;
let frames = 0;
let elapsed = 0;
let worstMs = 0;

function setVisible(v: boolean) {
  visible = v;
  el.style.display = v ? 'block' : 'none';
  frames = 0; elapsed = 0; worstMs = 0;
}

if (new URLSearchParams(location.search).has('perf')) setVisible(true);
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyP') setVisible(!visible);
});
// Phones have no P key: five taps in the top-left corner toggle the overlay.
let taps = 0, lastTap = 0;
window.addEventListener('pointerdown', (e) => {
  if (e.clientX > 88 || e.clientY > 88) { taps = 0; return; }
  const now = performance.now();
  taps = now - lastTap > 1600 ? 1 : taps + 1;
  lastTap = now;
  if (taps >= 5) { setVisible(!visible); taps = 0; }
});

// Call once per rendered frame, after renderer.render(). dt is the real frame time in seconds.
export function updatePerf(dt: number) {
  if (!visible) return;
  frames++;
  elapsed += dt;
  worstMs = Math.max(worstMs, dt * 1000);
  if (elapsed < REFRESH_SECONDS) return;
  const info = renderer.info;
  el.textContent =
    Math.round(frames / elapsed) + ' fps  (worst ' + Math.round(worstMs) + ' ms)\n' +
    'draws ' + info.render.calls + '  tris ' + info.render.triangles + '\n' +
    'geo ' + info.memory.geometries + '  tex ' + info.memory.textures;
  frames = 0; elapsed = 0; worstMs = 0;
}
