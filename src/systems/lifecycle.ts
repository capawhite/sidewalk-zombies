// Starting a run and game over.
import { audioResume } from '../audio/engine';
import { startMusic, stopMusic } from '../audio/music';
import { sfxOver } from '../audio/sfx';
import { LIVES_MAX, POWERS, SPAWN_GAP, SPEED } from '../config';
import { batProp, gunProp, hornProp, player } from '../entities/player';
import { bullets, coinPool, pickPool, pool } from '../entities/pools';
import {
  drawChaos, drawCoins, drawLives, drawMetres, elArsenal, elCurtain, elLevel,
  elShove, elVault, showBanner, showCombo, updateComposure,
} from '../hud/hud';
import { clearWallet } from '../hud/wallet';
import { renderShop } from '../hud/shop';
import { buildWorld } from '../scene/worlds';
import { G, S, powerQ } from '../state';
import { hideChallengeChip, paintChallengeOver, resetChallengeRun } from './challenges';
import { syncVaultDom } from './cosmetics';
import { resetEncounters } from './encounters';
import { resetEvents } from './events';
import {
  acceptIncomingChallenge, fillChallengeOver, getIncomingChallenge,
  hideFriendChallengeChip, resetFriendChallengeRun,
} from './friendChallenge';
import {
  beginRunMode, fillDailyOver, hideDailyChip, isDailyRun, paintDailyMenu,
  recordDailyResult, resetDailyRunHud, type RunMode,
} from './daily';
import { setPower } from './powers';
import { fillGameOver, snapshotRun } from './runReport';
import { presentShareCard } from './shareCard';
import { spawnWave } from './spawn';
import { rand } from '../util';

// ---------- lifecycle ----------
export function start(opts?: { mode?: RunMode }) {
  const runMode: RunMode = opts?.mode || 'free';
  // Seed before any rand() in this function (spawnWave, death-msg later, etc.).
  beginRunMode(runMode);
  audioResume();
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  G.dist = 0; G.speed = SPEED; G.lives = LIVES_MAX; G.combo = 0; G.bestCombo = 0; G.invuln = 0; G.shake = 0;
  G.comboTimer = 0; G.nearMisses = 0; G.nearMissStreak = 0; G.chainReactions = 0; G.bonks = 0;
  G.lateralSpeed = 0; G.rageT = 0;
  G.shoveCd = 0; G.lastCd = POWERS.shoulder.cd; G.cartRush = 0; G.scareT = 0; G.gunT = 0; G.gunCd = 0; G.scoreAcc = 0;
  powerQ.length = 0;
  G.coins = 0; G.hopT = 0; G.lvCoins = 0; G.coinStreak = 0; G.coinStreakT = 0; clearWallet();
  G.level = 1;
  elLevel.textContent = 'Lv 1';
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  if (G.worldLevel !== 1) buildWorld(1);
  for (const b of bullets) { b.active = false; b.visible = false; }
  G.spawnTimer = SPAWN_GAP; G.pickTimer = 2.2; G.coinTimer = 1.2;
  resetEncounters();
  resetEvents();
  resetChallengeRun();
  // Friend challenges stay on free play — daily runs need a clean comparable seed stream.
  if (runMode === 'free' && getIncomingChallenge()) acceptIncomingChallenge();
  spawnWave();
  G.vx = 0; G.lean = 0; G.tapLeft = 0; G.tapRight = 0;
  G.pointerActive = false; G.pointerFlick = 0; G.touchAnchorX = 0;
  player.position.set(0, 0, 6.5); player.rotation.set(0, 0, 0);
  setPower('shoulder');
  G.state = S.play;
  resetFriendChallengeRun();
  resetDailyRunHud();
  document.getElementById('menu')!.classList.add('hide');
  document.getElementById('over')!.classList.add('hide');
  elShove.classList.remove('hide');
  drawLives(); drawCoins(); drawMetres(); drawChaos(); showCombo(''); updateComposure();
  startMusic(1); showBanner();
  if (isDailyRun()) {
    const kick = document.getElementById('bKick');
    const name = document.getElementById('bName');
    if (kick) kick.textContent = '★ DAILY SIDEWALK ★';
    if (name) name.textContent = 'SHARED SEED RUN';
  }
  G.last = performance.now();
}
export function gameOver(cause: string) {
  G.state = S.over; elShove.classList.add('hide');
  elArsenal.classList.add('hide');
  elCurtain.classList.remove('show'); elCurtain.classList.add('hide');
  batProp.visible = false; hornProp.visible = false; gunProp.visible = false; G.gunT = 0; powerQ.length = 0;
  stopMusic();
  showCombo('');
  hideChallengeChip();
  hideFriendChallengeChip();
  hideDailyChip();

  const prevBest = G.best;
  const prevComboPb = G.bestComboEver;
  const prevDistPb = G.bestDist;
  const snap = snapshotRun(cause, prevBest, prevComboPb, prevDistPb);

  G.vault += G.coins; try { localStorage.setItem('sz_vault', String(G.vault)); } catch (e) {}
  if (elVault) elVault.textContent = elVault.id === 'shopVault' ? String(G.vault) + '¢' : String(G.vault);
  syncVaultDom();
  renderShop();

  if (snap.total > G.best) {
    G.best = snap.total;
    try { localStorage.setItem('sz_best', String(G.best)); } catch (e) {}
  }
  if (G.bestCombo > G.bestComboEver) {
    G.bestComboEver = G.bestCombo;
    try { localStorage.setItem('sz_best_combo', String(G.bestComboEver)); } catch (e) {}
  }
  if (snap.dist > G.bestDist) {
    G.bestDist = snap.dist;
    try { localStorage.setItem('sz_best_dist', String(G.bestDist)); } catch (e) {}
  }

  const dailyPb = recordDailyResult(snap.total, snap.dist);

  // One seeded pick for the death line (keeps the funny; title is deterministic).
  const payload = fillGameOver(snap, rand);
  void presentShareCard(payload).catch(() => { /* share preview is best-effort */ });
  fillChallengeOver(snap.dist);
  fillDailyOver();
  paintChallengeOver();
  paintDailyMenu();
  if (dailyPb) {
    const v = document.getElementById('verdict');
    if (v && isDailyRun()) v.textContent = '★ DAILY PB ★';
  }
  document.getElementById('over')!.classList.remove('hide');
  sfxOver();
}
