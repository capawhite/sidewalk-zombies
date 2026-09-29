// HUD elements and drawing helpers.
import { muted, toggleMute } from '../audio/engine';
import { sfxBanner } from '../audio/sfx';
import { LIVES_MAX, POWERS } from '../config';
import { G, powerQ, stageOf } from '../state';

// ---------- HUD ----------
export const elScore = document.getElementById('score')!, elLives = document.getElementById('lives')!,
  elFlash = document.getElementById('flash')!, elShove = document.getElementById('shove')!,
  elCool = document.getElementById('cool')!, elShoveName = document.getElementById('shoveName')!,
  elShoveHint = document.getElementById('shoveHint')!,
  elCurtain = document.getElementById('curtain')!, elLevel = document.getElementById('level')!,
  elGlitz = document.getElementById('cGlitz')!, elArsenal = document.getElementById('arsenal')!,
  elCoins = document.getElementById('coins')!,
  elCKicker = document.getElementById('cKicker')!, elCTitle = document.getElementById('cTitle')!,
  elCSub = document.getElementById('cSub')!, elCPrizes = document.getElementById('cPrizes')!,
  elContinue = document.getElementById('continue')!,
  elBanner = document.getElementById('banner')!, elBKick = document.getElementById('bKick')!,
  elBName = document.getElementById('bName')!, elMute = document.getElementById('mute')!,
  elFly = document.getElementById('cFly')!, elWallet = document.getElementById('wallet')!,
  elWCount = document.getElementById('wCount')!, elWNote = document.getElementById('wNote')!,
  elVault = document.getElementById('vault')!;
elMute.addEventListener('click', toggleMute);
elMute.classList.toggle('off', muted);
elVault.textContent = String(G.vault);
export function showBanner() {
  const st = stageOf();
  elBKick.textContent = 'LEVEL ' + G.level;
  elBName.textContent = st.name;
  elBanner.classList.remove('show'); void (elBanner as HTMLElement).offsetWidth; elBanner.classList.add('show');
  sfxBanner();
}
export function drawLives() {
  elLives.innerHTML = '';
  const n = Math.max(LIVES_MAX, G.lives);
  for (let i = 0; i < n; i++) {
    const h = document.createElement('div');
    h.className = 'heart' + (i >= G.lives ? ' gone' : '');
    elLives.appendChild(h);
  }
}
export function drawCoins() {
  elCoins.textContent = String(G.coins);
}
export function drawArsenal() {
  const list = G.gunT > 0 ? ['gun', ...powerQ] : powerQ.slice();
  elArsenal.innerHTML = '';
  if (!list.length) { elArsenal.classList.add('hide'); return; }
  elArsenal.classList.remove('hide');
  for (let i = 0; i < list.length; i++) {
    const k = list[i];
    const d = document.createElement('div');
    d.className = 'slot slot-' + k + (i === 0 ? ' next' : '');
    d.textContent = POWERS[k].name;
    elArsenal.appendChild(d);
  }
}
export function flash(msg: string, color: string) {
  elFlash.textContent = msg; elFlash.style.color = color;
  elFlash.classList.remove('show'); void (elFlash as HTMLElement).offsetWidth; elFlash.classList.add('show');
}