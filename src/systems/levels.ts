// Level clear, curtain and moving to the next stage.
import { startMusic, stopMusic } from '../audio/music';
import { sfxFanfare } from '../audio/sfx';
import { LIVES_CAP, POWERS, STAGES } from '../config';
import { bullets, coinPool, pickPool, pool } from '../entities/pools';
import { drawLives, elCKicker, elCPrizes, elCSub, elCTitle, elContinue, elCurtain, elGlitz, elLevel, elShove, showBanner } from '../hud/hud';
import { clearWallet, runWallet } from '../hud/wallet';
import { buildWorld } from '../scene/worlds';
import { G, S, powerQ, stageOf } from '../state';
import { armBonusRush, noteChapterClearForBonus, consumePendingBonusRush } from './bonus';
import { buzz } from './haptics';
import { isEmptyHands } from './emptyHands';
import { armEscalatorWeave, consumePendingEscalator } from './escalator';
import { armLuggageClaim, consumePendingLuggage } from './luggage';
import { armPhotobomb, consumePendingPhotobomb } from './photobomb';
import { refreshPowerHud } from './powers';
import {
  awardChapterStars, noteChapterBest, resetChapterRun, startDistForChapter, unlockChapter,
} from './progress';
import { spawnWave } from './spawn';
import { rand } from '../util';

let rushArmed = false;
let luggageArmed = false;
let photoArmed = false;
let escalatorArmed = false;

function fillGlitz() {
  elGlitz.innerHTML = '';
  const bits = ['★', '✦', '●', '◆', '◈', '•'];
  const cols = ['#f0d078', '#ff7a2f', '#fff6d0', '#ff5a3c', '#7fd0ff', '#ffe27a'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = bits[i % bits.length];
    s.style.left = (4 + rand() * 92) + '%';
    s.style.animationDelay = (rand() * 1.6) + 's';
    s.style.animationDuration = (1.8 + rand() * 1.4) + 's';
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
  // Stars + unlock next chapter on clear.
  const chapMetres = Math.max(0, Math.floor(G.dist) - Math.floor(startDistForChapter(G.level)));
  noteChapterBest(G.level, chapMetres);
  awardChapterStars(G.level, true);
  unlockChapter(G.level + 1);
  rushArmed = noteChapterClearForBonus();
  if (rushArmed) armBonusRush();
  // Boardwalk → Photobomb; garage → Escalator; station → Luggage Claim.
  photoArmed = G.level === 2;
  if (photoArmed) armPhotobomb();
  escalatorArmed = G.level === 5;
  if (escalatorArmed) armEscalatorWeave();
  luggageArmed = G.level === 6;
  if (luggageArmed) armLuggageClaim();
  buzz('success');
  fillGlitz();
  const c = st.curtain;
  if (!c) return;
  elCKicker.textContent = c.kicker;
  elCTitle.textContent = c.title;
  elCSub.textContent = c.sub;
  elContinue.textContent = c.go;
  const next = STAGES[G.level]; // next chapter (0-index = G.level)
  const chips: string[] = [];
  if (rushArmed) chips.push('COIN RUSH');
  if (photoArmed) chips.push('PHOTOBOMB');
  if (escalatorArmed) chips.push('ESCALATOR WEAVE');
  if (luggageArmed) chips.push('LUGGAGE CLAIM');
  if (next) {
    chips.push('♥ BONUS LIFE');
    if (!isEmptyHands()) {
      for (const k of next.kit) chips.push(POWERS[k].name);
    } else {
      chips.push('SHOVE ONLY');
    }
  } else {
    chips.push('★ CAMPAIGN CLEAR ★', '♥ BONUS LIFE');
  }
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
  // Last stage clear → campaign win, not a phantom level 8.
  if (!STAGES[G.level]) {
    elCurtain.classList.remove('show');
    elCurtain.classList.add('hide');
    void import('./lifecycle').then((m) => m.gameOver('escaped'));
    return;
  }
  G.level += 1;
  const st = stageOf();
  G.lives = Math.min(G.lives + 1, LIVES_CAP);
  if (!isEmptyHands()) {
    for (const k of st.kit) powerQ.push(k);
  } else {
    powerQ.length = 0;
  }
  refreshPowerHud();
  drawLives();
  elLevel.textContent = String(G.level);
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  for (const b of bullets) { b.active = false; b.visible = false; }
  buildWorld(G.level);
  clearWallet(); G.lvCoins = 0; G.coinStreak = 0; G.coinStreakT = 0;
  G.spawnTimer = 0.45; G.pickTimer = 2.4; G.coinTimer = 0.8;
  G.cartRush = 0; G.scareT = 0; G.umbrellaCharges = 0;
  resetChapterRun(G.dist);
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
  if (photoArmed) {
    photoArmed = false;
    consumePendingPhotobomb();
  } else if (escalatorArmed) {
    escalatorArmed = false;
    consumePendingEscalator();
  } else if (luggageArmed) {
    luggageArmed = false;
    consumePendingLuggage();
  } else if (rushArmed) {
    rushArmed = false;
    consumePendingBonusRush();
  }
}
