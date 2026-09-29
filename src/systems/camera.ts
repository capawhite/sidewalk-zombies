// Camera follow, shake and FOV kick.
import { CAM_FOLLOW_RATE, CAM_FOLLOW_X, CAM_LOOK_X, CAM_LOOK_Y, CAM_LOOK_Z } from '../config';
import { player } from '../entities/player';
import { camBase, camera } from '../render/renderer';
import { G, S } from '../state';

export function updateCamera(dt: number) {
  const tx = G.state === S.play ? player.position.x * CAM_FOLLOW_X : 0;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * CAM_FOLLOW_RATE);
  camera.position.z = camBase.z;
  if (G.shake > 0) {
    camera.position.x += (Math.random() - 0.5) * G.shake;
    camera.position.y = camBase.y + (Math.random() - 0.5) * G.shake;
    G.shake = Math.max(0, G.shake - dt * 2.2);
  } else camera.position.y += (camBase.y - camera.position.y) * 0.1;
  const lookX = G.state === S.play ? player.position.x * CAM_LOOK_X : 0;
  camera.lookAt(lookX, CAM_LOOK_Y, CAM_LOOK_Z);

}
