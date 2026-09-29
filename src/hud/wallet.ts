// End-of-level coin-to-wallet animation.
import { sfxKaching, sfxWallet } from '../audio/sfx';
import { G } from '../state';
import { elFly, elWCount, elWNote, elWallet } from './hud';

let walletTimers: number[] = [];
export function clearWallet() {
  for (const t of walletTimers) clearTimeout(t);
  walletTimers = [];
  elFly.innerHTML = '';
}
export function runWallet() {
  clearWallet();
  const startBank = G.coins - G.lvCoins;
  elWCount.textContent = String(startBank);
  elWNote.textContent = '';
  const n = Math.min(G.lvCoins, 30);
  const T0 = 1350, DUR = 700, STEP = 62;
  if (n === 0) { elWNote.textContent = 'Empty pockets. The crowd kept the change.'; return; }
  walletTimers.push(window.setTimeout(() => {
    const fr = elFly.getBoundingClientRect(), wr = elWallet.getBoundingClientRect();
    const tx = wr.left + wr.width / 2 - fr.left - 10, ty = wr.top + 12 - fr.top - 10;
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div'); c.className = 'fc';
      const sx = 10 + Math.random() * Math.max(20, fr.width - 40), sy = Math.random() * 44;
      elFly.appendChild(c);
      c.animate([
        { transform: 'translate(' + sx + 'px,' + sy + 'px) scale(0)', opacity: 0 },
        { transform: 'translate(' + sx + 'px,' + (sy - 12) + 'px) scale(1.3)', opacity: 1, offset: 0.22 },
        { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.55)', opacity: 1 },
      ], { duration: DUR, delay: k * STEP, easing: 'ease-in', fill: 'both' });
      walletTimers.push(window.setTimeout(() => {
        const shown = Math.round((k + 1) * G.lvCoins / n);
        elWCount.textContent = String(startBank + shown);
        elWallet.classList.remove('bump'); void (elWallet as HTMLElement).offsetWidth; elWallet.classList.add('bump');
        sfxWallet(k, n);
      }, k * STEP + DUR * 0.94));
    }
    walletTimers.push(window.setTimeout(() => {
      elWNote.textContent = '+' + G.lvCoins + ' this level' + (G.lvCoins >= 25 ? ' \u2014 coin hog!' : G.lvCoins >= 12 ? ' \u2014 nice haul' : '');
      sfxKaching();
    }, (n - 1) * STEP + DUR + 120));
  }, T0));
}