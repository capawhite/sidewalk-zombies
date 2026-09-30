// Zombie movement, knock-back physics, collisions and near-miss scoring.
import { sfxBump, sfxNear } from '../audio/sfx';
import { CART_GRAVITY, CLAMP_X, INF_DRIFT, INF_DRIFT_RATE, TALK_DRIFT, TALK_DRIFT_RATE } from '../config';
import { animatePerson, setHeadSway } from '../entities/person';
import { player } from '../entities/player';
import { pool } from '../entities/pools';
import { drawLives, flash } from '../hud/hud';
import { G } from '../state';
import { clamp } from '../util';
import { gameOver } from './lifecycle';
import { knockOff, score } from './powers';

export function updateZombies(dt: number, now: number) {
  const pz = player.position.z, px = player.position.x;
  for (const z of pool) {
    if (!z.active) continue;
    const d = z.userData;
    if (d.knocked) {
      d.tripT += dt;
      if (d.fx === 'cart' || d.fx === 'gun' || d.fx === 'bomb') {
        z.position.x += d.knockVx * dt;
        z.position.y += d.knockVy * dt;
        d.knockVy -= CART_GRAVITY * dt;
        z.rotation.x += dt * 7;
        z.rotation.z += dt * 9;
        if (z.position.y > 22 || z.position.y < -1 || d.tripT > 2.2) { z.active = false; z.visible = false; }
      } else if (d.fx === 'horn') {
        z.position.x += d.knockVx * dt;
        z.position.z += G.speed * dt * 0.35;
        z.position.y = Math.abs(Math.sin(d.tripT * 22)) * 0.18;
        z.rotation.y += dt * 10;
        if (d.tripT > 0.95 || Math.abs(z.position.x) > 13) { z.active = false; z.visible = false; }
      } else {
        z.position.x += d.knockVx * dt;
        z.position.z += G.speed * dt * 0.25;
        z.rotation.z += d.knockVx * dt * 0.35;
        z.rotation.x += dt * 5;
        z.position.y = Math.max(0, Math.sin(Math.min(1, d.tripT / 0.4) * Math.PI) * 1.1);
        if (d.tripT > 1.15 || Math.abs(z.position.x) > 13) { z.active = false; z.visible = false; }
      }
      continue;
    }
    z.position.z += G.speed * dt;
    if ((d.type === 'talk' || d.type === 'inf') && G.gunT <= 0) {
      const rate = d.type === 'inf' ? INF_DRIFT_RATE : TALK_DRIFT_RATE;
      const amp = d.type === 'inf' ? INF_DRIFT : TALK_DRIFT;
      d.driftPhase += dt * rate;
      z.position.x = d.baseX + Math.sin(d.driftPhase) * amp;
      z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
      z.rotation.y = Math.sin(d.driftPhase) * (d.type === 'inf' ? 0.35 : 0.45);
      if (d.type === 'talk') setHeadSway(z, 0, 0, Math.sin(now * 0.008) * 0.04);
      else setHeadSway(z, 0, Math.sin(d.driftPhase) * 0.08, 0);
    } else if (d.type === 'text' || d.type === 'talk' || d.type === 'inf') {
      z.position.x = d.baseX;
      z.rotation.y = 0;
    }
    // Visual only: people the camera has already passed keep simulating, but their mixer can rest.
    if (z.position.z < 12) animatePerson(z, dt, d.type === 'selfie' ? 0.05 : d.type === 'text' ? 0.5 : d.type === 'inf' ? 0.28 : 0.35);

    const dz = z.position.z - pz, dx = z.position.x - px;
    if (G.cartRush > 0 && Math.abs(dz) < 1.2 && Math.abs(dx) < 1.7) {
      knockOff(z, dx, 'cart'); G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); score(12);
      continue;
    }
    if (!d.hit && Math.abs(dz) < 1.05 && Math.abs(dx) < 1.15) {
      d.hit = true;
      if (G.invuln <= 0) {
        G.lives--; G.combo = 0; G.invuln = 1.1; G.shake = Math.min(G.shake + 0.6, 0.9);
        drawLives(); sfxBump();
        knockOff(z, dx, 'shove');
        if (G.lives <= 0) gameOver(d.type);
      }
    }
    if (!d.passed && z.position.z > pz + 0.6) {
      d.passed = true;
      if (!d.hit) {
        const gap = Math.abs(dx);
        if (gap < 2.1) {
          G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo);
          const bonus = 10 + Math.min(G.combo, 20) * 2;
          score(bonus);
          if (G.combo >= 3) flash((G.combo >= 8 ? 'WHOA ×' : G.combo >= 5 ? 'SLIPPERY ×' : 'NICE ×') + G.combo + '  +' + bonus, gap < 1.6 ? 'var(--accent)' : 'var(--talk)');
          sfxNear(G.combo);
        }
      }
    }
    if (z.position.z > 16) { z.active = false; z.visible = false; }
  }
}
