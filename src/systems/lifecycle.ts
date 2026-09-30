// Starting a run and game over.
import { audioResume } from '../audio/engine';
import { startMusic, stopMusic } from '../audio/music';
import { sfxOver } from '../audio/sfx';
import { LIVES_MAX, POWERS, SPAWN_GAP, SPEED } from '../config';
import { batProp, gunProp, hornProp, player } from '../entities/player';
import { bullets, coinPool, pickPool, pool } from '../entities/pools';
import { drawCoins, drawLives, elArsenal, elCurtain, elLevel, elScore, elShove, elVault, showBanner } from '../hud/hud';
import { clearWallet } from '../hud/wallet';
import { buildWorld } from '../scene/worlds';
import { G, S, powerQ } from '../state';
import { setPower } from './powers';
import { spawnWave } from './spawn';
import { rand } from '../util';

// ---------- lifecycle ----------
export function start() {
  audioResume();
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  G.dist = 0; G.speed = SPEED; G.lives = LIVES_MAX; G.combo = 0; G.bestCombo = 0; G.invuln = 0; G.shake = 0;
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
  spawnWave();
  G.vx = 0; G.lean = 0; G.tapLeft = 0; G.tapRight = 0;
  G.pointerActive = false; G.pointerFlick = 0; G.touchAnchorX = 0;
  player.position.set(0, 0, 6.5); player.rotation.set(0, 0, 0);
  setPower('shoulder');
  G.state = S.play;
  document.getElementById('menu')!.classList.add('hide');
  document.getElementById('over')!.classList.add('hide');
  elShove.classList.remove('hide');
  drawLives(); drawCoins(); elScore.textContent = '0';
  startMusic(1); showBanner();
  G.last = performance.now();
}
export function gameOver(cause: string) {
  G.state = S.over; elShove.classList.add('hide');
  elArsenal.classList.add('hide');
  elCurtain.classList.remove('show'); elCurtain.classList.add('hide');
  batProp.visible = false; hornProp.visible = false; gunProp.visible = false; G.gunT = 0; powerQ.length = 0;
  stopMusic();
  const total = Math.floor(G.dist) + G.scoreAcc;
  const newBest = total > G.best && G.best > 0;
  G.vault += G.coins; try { localStorage.setItem('sz_vault', String(G.vault)); } catch (e) {}
  elVault.textContent = String(G.vault);
  document.getElementById('fCoins')!.textContent = String(G.coins);
  if (total > G.best) { G.best = total; try { localStorage.setItem('sz_best', String(G.best)); } catch (e) {} }
  document.getElementById('fScore')!.textContent = String(total);
  document.getElementById('fBest')!.textContent = String(G.best);
  document.getElementById('fCombo')!.textContent = String(G.bestCombo);
  const titles = ['BONK!', 'OOF!', 'SPLAT!', 'PHONE FACE!', 'DOWN YOU GO!', 'AISLE WIPEOUT!'];
  const verdicts = ['Composure: gone', 'Caught in 4K', 'That\'s a wrap', 'Out of chill', 'Face met floor'];
  const msgs: any = {
    selfie: [
      'You photobombed the wrong shoot. They kept rolling.',
      'Selfie stick: 1. You: a pile.',
      'Congrats — you\'re the crash in someone\'s story.',
    ],
    text: [
      'A texter used you as a bumper. Still typing.',
      'They never looked up. You did. That\'s the joke.',
      'Head down, thumbs up, you down.',
    ],
    talk: [
      'A caller took a left through your personal space. Then your face.',
      'They said "can you hear me now?" Loud and clear. With your nose.',
      'Hands-free walking. You were the free part.',
    ],
    inf: [
      'Ring light, tripod, you. Only one of those wanted to be on the floor.',
      'She filmed the wipeout. It already has a sound on it.',
      'Influencer: 1. Sidewalk: you.',
    ],
    mall: [
      'You were the obstacle in someone\'s mall-map walking tour.',
      'Food-court GPS said "you have arrived." You had.',
    ],
  };
  const m = msgs[cause] || msgs.talk;
  document.getElementById('overTitle')!.textContent = titles[(rand() * titles.length) | 0];
  document.getElementById('verdict')!.textContent = newBest ? '\u2605 NEW BEST \u2605' : verdicts[(rand() * verdicts.length) | 0];
  document.getElementById('overMsg')!.textContent = m[(rand() * m.length) | 0];
  document.getElementById('over')!.classList.remove('hide');
  sfxOver();
}