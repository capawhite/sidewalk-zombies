// Game loop: one simulation step (frame) plus rendering (tick).
import { syncCrowdProps } from './entities/crowdProps';
import { elScore } from './hud/hud';
import { updatePerf } from './hud/perf';
import { renderFrame } from './render/post';
import { camera, wrap } from './render/renderer';
import { flapSeagulls } from './scene/seagulls';
import { scrollWorld } from './scene/worlds';
import { updateParts } from './render/fx';
import { SPEED } from './config';
import { G, S, stageOf } from './state';
import { updateCamera } from './systems/camera';
import { beginClear } from './systems/levels';
import { updatePickups, updateCoins } from './systems/pickups';
import { updateBullets } from './systems/projectiles';
import { updateSpawns } from './systems/spawn';
import { updatePlayer } from './systems/steering';
import { updateTimers } from './systems/timers';
import { updateZombies } from './systems/zombies';

// ---------- loop ----------
export function tick(now: number) {
  requestAnimationFrame(tick);
  let dt = (now - G.last) / 1000; G.last = now;
  if (dt < 0) dt = 0;
  if (dt > 0.05) dt = 0.05;
  frame(dt, now);
  draw(dt);
  updatePerf(dt);
}

// Draw the current state (the replay harness and dev tools call this too).
export function draw(dt: number) {
  syncCrowdProps();
  renderFrame(dt);
}

// One simulation step: everything except drawing. The replay harness calls this directly.
export function frame(dt: number, now: number) {
  if (G.hitStop > 0) { G.hitStop -= dt; dt *= 0.06; }

  if (G.state === S.play) {
    G.speed = SPEED;
    G.dist += G.speed * dt;
    const total = Math.floor(G.dist) + G.scoreAcc;
    elScore.textContent = String(total);
    const st = stageOf();
    if (st.clearAt && total >= st.clearAt) beginClear();

    updatePlayer(dt, now);
    scrollWorld(G.speed * dt);
    updateSpawns(dt);
    updateTimers(dt);
    updateBullets(dt);
    updatePickups(dt, now);
    updateCoins(dt, now);
    updateZombies(dt, now);
  }

  updateCamera(dt);
  if (G.state !== S.play) scrollWorld(1.4 * dt);
  flapSeagulls(dt, now);
  updateParts(dt);
  if (G.state !== S.play) wrap.classList.remove('hot');
  if (G.fovKick > 0) G.fovKick = Math.max(0, G.fovKick - dt * 24);
  const wantFov = G.baseFov + G.fovKick;
  if (Math.abs(camera.fov - wantFov) > 0.01) { camera.fov = wantFov; camera.updateProjectionMatrix(); }
}
