// Entry point: loads the character models, wires the modules together and starts the loop.
import './style.css';
import './hud/errors';
import { buildWorld } from './scene/worlds';
import './systems/input';
import './dev/replay';
import { loadCharacterKits } from './entities/character/kit';
import { initPlayer } from './entities/player';
import { drawLives } from './hud/hud';
import { setPower } from './systems/powers';
import { tick } from './loop';

loadCharacterKits().then(() => {
  initPlayer();
  buildWorld(1);
  drawLives();
  setPower('shoulder');
  requestAnimationFrame(tick);
});
