// Coin collection rules.
import { sfx1up, sfxCoin } from '../audio/sfx';
import { COIN_1UP, COIN_VALUE, LIVES_CAP } from '../config';
import { player } from '../entities/player';
import { drawCoins, drawLives, flash } from '../hud/hud';
import { fxBurst, popAt } from '../render/fx';
import { G } from '../state';
import { score } from './powers';

export function collectCoin(x: number, z: number) {
  G.coins++; G.lvCoins++;
  score(COIN_VALUE);
  G.hopT = 0.2;
  G.coinStreak = G.coinStreakT > 0 ? Math.min(G.coinStreak + 1, 9) : 0;
  G.coinStreakT = 0.95;
  drawCoins();
  sfxCoin(G.coinStreak);
  fxBurst(x, 0.8, z, 0xffe27a, 6, 3, 3.5, 0.5);
  popAt(x, 1.6, z, '+' + COIN_VALUE, '#ffe27a');
  if (G.coins % COIN_1UP === 0) {
    if (G.lives < LIVES_CAP) {
      G.lives++; drawLives(); flash('1UP!', '#7ee08a'); sfx1up();
      popAt(player.position.x, 2.6, player.position.z, '1UP!', '#7ee08a', true);
    } else { score(100); flash('COIN BONUS +100', '#f0d078'); sfx1up(); }
  } else if (G.coins % 10 === 0) flash(G.coins + ' COINS!', '#f0d078');
}