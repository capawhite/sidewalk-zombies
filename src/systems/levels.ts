// Level clear, curtain and moving to the next stage.
import { startMusic, stopMusic } from '../audio/music';
import { sfxFanfare } from '../audio/sfx';
import { LIVES_CAP, POWERS, STAGES } from '../config';
import { bullets, coinPool, pickPool, pool } from '../entities/pools';
import { drawLives, elCKicker, elCPrizes, elCSub, elCTitle, elContinue, elCurtain, elGlitz, elLevel, elShove, showBanner } from '../hud/hud';
import { clearWallet, runWallet } from '../hud/wallet';
import { buildWorld } from '../scene/worlds';
import { G, S, powerQ, stageOf } from '../state';
import { refreshPowerHud } from './powers';
import { spawnWave } from './spawn';

function fillGlitz() {
  elGlitz.innerHTML = '';
  const bits = ['★', '✦', '●', '◆', '✧', '•'];
  const cols = ['#f0d078', '#ff7a2f', '#fff6d0', '#ff5a3c', '#7fd0ff', '#ffe27a'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = bits[i % bits.length];
    s.style.left = (4 + Math.random() * 92) + '%';
    s.style.animationDelay = (Math.random() * 1.6) + 's';
    s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    s.style.color = cols[i % cols.length];
    s.style.fontSize = (11 + ((i * 7) % 16)) + 'px';
    elGlitz.appendChild(s);
  }
}
export function beginClear() {
  const st = stageOf();
  if (G.state !== S.play || !st.clearAt) return;
  G.state = S.clear;
  elShove.classList.add('hide');
  fillGlitz();
  const c = st.curtain;
  elCKicker.textContent = c.kicker;
  elCTitle.textContent = c.title;
  elCSub.textContent = c.sub;
  elContinue.textContent = c.go;
  const next = STAGES[G.level];
  const chips = ['♥ BONUS LIFE'].concat((next ? next.kit : []).map((k: string) => POWERS[k].name));
  elCPrizes.innerHTML = chips.map((t: string) => '<span>' + t + '</span>').join('');
  elCurtain.classList.remove('hide');
  void elCurtain.offsetWidth;
  elCurtain.classList.add('show');
  stopMusic();
  sfxFanfare();
  runWallet();
}
export function enterNextLevel() {
  if (G.state !== S.clear) return;
  G.level += 1;
  const st = stageOf();
  G.lives = Math.min(G.lives + 1, LIVES_CAP);
  for (const k of st.kit) powerQ.push(k);
  refreshPowerHud();
  drawLives();
  elLevel.textContent = 'Lv ' + G.level;
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  for (const b of bullets) { b.active = false; b.visible = false; }
  buildWorld(G.level);
  clearWallet(); G.lvCoins = 0; G.coinStreak = 0; G.coinStreakT = 0;
  G.spawnTimer = 0.45; G.pickTimer = 2.4; G.coinTimer = 0.8;
  G.cartRush = 0; G.scareT = 0;
  spawnWave();
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  elShove.classList.remove('hide');
  G.state = S.play;
  refreshPowerHud();
  G.invuln = Math.max(G.invuln, 1.35);
  G.hopT = 0.22;
  startMusic(G.level);
  showBanner();
}