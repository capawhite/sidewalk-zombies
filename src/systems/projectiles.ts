// Gun bullets: travel and hit test against zombies.
import { GUN_FRONT, GUN_HIT_X, GUN_HIT_Z, GUN_SPEED, SPAWN_Z } from '../config';
import { player } from '../entities/player';
import { bullets, pool } from '../entities/pools';
import { knockOff, registerBonk } from './powers';

export function updateBullets(dt: number) {
  const pz = player.position.z;
  for (const b of bullets) {
    if (!b.active) continue;
    b.position.z -= GUN_SPEED * dt;
    if (b.position.z < SPAWN_Z - 6) { b.active = false; b.visible = false; continue; }
    for (const z of pool) {
      if (!z.active || z.userData.knocked) continue;
      if (z.position.z > player.position.z - GUN_FRONT) continue;
      if (Math.abs(z.position.x - b.position.x) < GUN_HIT_X && Math.abs(z.position.z - b.position.z) < GUN_HIT_Z) {
        knockOff(z, z.position.x - b.position.x, 'gun');
        registerBonk(1, 8, undefined, '#ff8a2a');
        b.active = false; b.visible = false;
        break;
      }
    }
  }
}
