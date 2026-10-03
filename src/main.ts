// Entry point: loads the character models, wires the modules together and starts the loop.
import './style.css';
import './hud/errors';
import { buildWorld } from './scene/worlds';
import './systems/input';
import './dev/replay';
import { kits, loadCharacterKits } from './entities/character/kit';
import { applyCosmeticsToPlayer, initPlayer } from './entities/player';
import { drawLives } from './hud/hud';
import { initShop } from './hud/shop';
import { initMapUi } from './hud/mapUi';
import { initNative } from './native';
import { initChallenges } from './systems/challenges';
import { initCosmetics } from './systems/cosmetics';
import { initDaily } from './systems/daily';
import { initEconomy } from './systems/economy';
import { initFriendChallenge } from './systems/friendChallenge';
import { initProgress } from './systems/progress';
import { initShareCardUi } from './systems/shareCard';
import { setPower } from './systems/powers';
import { tick } from './loop';

initNative();
initProgress();
initEconomy();
initChallenges();
initDaily();
initFriendChallenge();
initShareCardUi();
initCosmetics(() => {
  if (kits.man) applyCosmeticsToPlayer();
});
loadCharacterKits().then(() => {
  initPlayer();
  buildWorld(1);
  initShop();
  initMapUi();
  drawLives();
  setPower('shoulder');
  requestAnimationFrame(tick);
});
