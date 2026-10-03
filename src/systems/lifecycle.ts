// Starting a run and game over.
import { audioResume } from '../audio/engine';
import { startMusic, stopMusic } from '../audio/music';
import { sfxOver } from '../audio/sfx';
import { LIVES_CAP, LIVES_MAX, POWERS, SPAWN_GAP, SPEED } from '../config';
import { batProp, gunProp, hornProp, player } from '../entities/player';
import { bullets, coinPool, pickPool, pool } from '../entities/pools';
import {
  drawChaos, drawCoins, drawLives, drawMetres, elArsenal, elCurtain, elLevel,
  elShove, elVault, flash, showBanner, showCombo, updateComposure,
} from '../hud/hud';
import { paintEconomyUi } from '../hud/mapUi';
import { clearWallet } from '../hud/wallet';
import { renderShop } from '../hud/shop';
import { buildWorld } from '../scene/worlds';
import { G, S, powerQ } from '../state';
import { hideChallengeChip, paintChallengeOver, resetChallengeRun } from './challenges';
import { syncVaultDom } from './cosmetics';
import { resetBonus } from './bonus';
import { resetComposureRun } from './composure';
import { beginEmptyHands, emptyHandsOverLine, emptyHandsVaultBonus, isEmptyHands } from './emptyHands';
import { resetEscalator } from './escalator';
import { resetLuggage } from './luggage';
import { resetPhotobomb } from './photobomb';
import {
  applyBoostsToRun, boostCostTotal, purchaseSelectedBoosts, type BoostId,
} from './economy';
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
import { getSelectedChapter } from '../hud/mapUi';
import {
  awardChapterStars, noteChapterBest, resetChapterRun, startDistForChapter, unlockChapter,
} from './progress';
import { setPower, collectPower } from './powers';
import { fillGameOver, snapshotRun } from './runReport';
import { presentShareCard } from './shareCard';
import { spawnWave } from './spawn';
import { rand } from '../util';

// ---------- lifecycle ----------
export function start(opts?: { mode?: RunMode; chapter?: number; emptyHands?: boolean }) {
  const runMode: RunMode = opts?.mode || 'free';
  const empty = !!opts?.emptyHands;
  beginEmptyHands(empty);

  // Consumable boosts — free play only (not Empty Hands); charged when any are selected.
  let boostActive = new Set<BoostId>();
  if (runMode === 'free' && !empty) {
    const cost = boostCostTotal();
    if (cost > 0) {
      const bought = purchaseSelectedBoosts();
      if (!bought.ok) {
        flash('NEED ' + cost + '¢ FOR BOOSTS', '#ff6b7a');
        paintEconomyUi();
        return;
      }
      boostActive = bought.active;
    }
  }

  // Seed before any rand() in this function (spawnWave, death-msg later, etc.).
  beginRunMode(runMode);

  audioResume();
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  const chapter = Math.max(1, Math.min(7, opts?.chapter ?? (runMode === 'free' && !empty ? getSelectedChapter() : 1)));
  const applied = applyBoostsToRun(boostActive);
  G.dist = startDistForChapter(chapter);
  G.speed = SPEED;
  G.lives = Math.min(LIVES_MAX + (applied.extraLife ? 1 : 0), LIVES_CAP);
  G.combo = 0; G.bestCombo = 0; G.invuln = 0; G.shake = 0;
  G.comboTimer = 0; G.nearMisses = 0; G.nearMissStreak = 0; G.chainReactions = 0; G.bonks = 0;
  G.lateralSpeed = 0; G.rageT = 0;
  G.shoveCd = 0; G.lastCd = POWERS.shoulder.cd; G.cartRush = 0; G.scareT = 0; G.gunT = 0; G.gunCd = 0;
  G.umbrellaCharges = 0; G.scoreAcc = 0;
  powerQ.length = 0;
  G.coins = 0; G.hopT = 0; G.lvCoins = 0; G.coinStreak = 0; G.coinStreakT = 0; clearWallet();
  G.level = chapter;
  elLevel.textContent = String(G.level);
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  if (G.worldLevel !== chapter) buildWorld(chapter);
  for (const b of bullets) { b.active = false; b.visible = false; }
  G.spawnTimer = SPAWN_GAP; G.pickTimer = 2.2; G.coinTimer = 1.2;
  resetEncounters();
  resetEvents();
  resetChallengeRun();
  resetBonus();
  resetLuggage();
  resetPhotobomb();
  resetEscalator();
  resetComposureRun();
  resetChapterRun(G.dist);
  // Friend challenges stay on free play — daily runs need a clean comparable seed stream.
  if (runMode === 'free' && !empty && getIncomingChallenge()) acceptIncomingChallenge();
  spawnWave();
  G.vx = 0; G.lean = 0; G.tapLeft = 0; G.tapRight = 0;
  G.pointerActive = false; G.pointerFlick = 0; G.touchAnchorX = 0;
  player.position.set(0, 0, 6.5); player.rotation.set(0, 0, 0);
  setPower('shoulder');
  if (applied.startBat && !empty) collectPower('cart');
  G.state = S.play;
  resetFriendChallengeRun();
  resetDailyRunHud();
  document.getElementById('menu')!.classList.add('hide');
  document.getElementById('over')!.classList.add('hide');
  elShove.classList.remove('hide');
  drawLives(); drawCoins(); drawMetres(); drawChaos(); showCombo(''); updateComposure();
  startMusic(G.level); showBanner();
  if (isDailyRun()) {
    const kick = document.getElementById('bKick');
    const name = document.getElementById('bName');
    if (kick) kick.textContent = '★ DAILY SIDEWALK ★';
    if (name) name.textContent = 'SHARED SEED RUN';
  } else if (isEmptyHands()) {
    const kick = document.getElementById('bKick');
    const name = document.getElementById('bName');
    if (kick) kick.textContent = '★ EMPTY HANDS ★';
    if (name) name.textContent = 'SHOVE ONLY · VAULT BONUS';
    flash('EMPTY HANDS — SHOVE ONLY', '#f0d078');
  }
  paintEconomyUi();
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

  // Chapter progress: airport stars on death or escape; always record best metres.
  const chapMetres = Math.max(0, Math.floor(G.dist) - Math.floor(startDistForChapter(G.level)));
  noteChapterBest(G.level, chapMetres);
  if (cause === 'escaped') {
    awardChapterStars(7, true);
  } else if (G.level === 7 && chapMetres >= 400) {
    awardChapterStars(7, true);
  }

  const prevBest = G.best;
  const prevComboPb = G.bestComboEver;
  const prevDistPb = G.bestDist;
  const snap = snapshotRun(cause, prevBest, prevComboPb, prevDistPb);

  const handsBonus = emptyHandsVaultBonus(snap.dist);
  G.vault += G.coins + handsBonus;
  try { localStorage.setItem('sz_vault', String(G.vault)); } catch (e) {}
  if (elVault) elVault.textContent = elVault.id === 'shopVault' ? String(G.vault) + '¢' : String(G.vault);
  syncVaultDom();
  renderShop();
  paintEconomyUi();

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
  if (handsBonus > 0) {
    const line = emptyHandsOverLine(snap.dist);
    const overChal = document.getElementById('overChal');
    if (overChal && line) overChal.textContent = (overChal.textContent ? overChal.textContent + ' · ' : '') + line;
  }
  if (dailyPb) {
    const v = document.getElementById('verdict');
    if (v && isDailyRun()) v.textContent = '★ DAILY PB ★';
  }
  document.getElementById('over')!.classList.remove('hide');
  sfxOver();
}
