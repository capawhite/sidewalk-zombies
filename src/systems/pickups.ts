// Power pickups and coins: scroll, animate, collect.
import { sfxPickup } from '../audio/sfx';
import { POWERS } from '../config';
import { player } from '../entities/player';
import { PICK_COL, coinPool, pickPool } from '../entities/pools';
import { fxBurst, hexCss, popAt } from '../render/fx';
import { G } from '../state';
import { collectCoin } from './collect';
import { collectPower } from './powers';

export function updatePickups(dt: number, now: number) {
  const pz = player.position.z, px = player.position.x;
  for (const pk of pickPool) {
    if (!pk.active) continue;
    pk.position.z += G.speed * dt;
    pk.position.y = 0.15 + Math.abs(Math.sin(now * 0.004)) * 0.12;
    pk.rotation.y += dt * 1.6;
    if (pk.position.z > 16) { pk.active = false; pk.visible = false; continue; }
    if (Math.abs(pk.position.z - pz) < 1.1 && Math.abs(pk.position.x - px) < 1.0) {
      pk.active = false; pk.visible = false;
      const kind = pk.userData.kind;
      sfxPickup(kind);
      fxBurst(pk.position.x, 0.9, pk.position.z, PICK_COL[kind], 12, 4, 5);
      popAt(pk.position.x, 2.0, pk.position.z, POWERS[kind].name + '!', hexCss(PICK_COL[kind]), true);
      G.fovKick = Math.max(G.fovKick, 2);
      collectPower(kind);
    }
  }
}

export function updateCoins(dt: number, now: number) {
  const pz = player.position.z, px = player.position.x;
  for (const cn of coinPool) {
    if (!cn.active) continue;
    cn.position.z += G.speed * dt;
    cn.rotation.y += dt * 4.2;
    cn.position.y = Math.abs(Math.sin(now * 0.006)) * 0.08;
    if (cn.position.z > 16) { cn.active = false; cn.visible = false; continue; }
    if (Math.abs(cn.position.z - pz) < 1.05 && Math.abs(cn.position.x - px) < 0.95) {
      cn.active = false; cn.visible = false;
      collectCoin(cn.position.x, cn.position.z);
    }
  }
}
