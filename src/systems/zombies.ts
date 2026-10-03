// Zombie movement, knock-back physics, collisions, chain reactions and near-miss scoring.
import { sfxBump, sfxNear, sfxNearBreak, sfxRage } from '../audio/sfx';
import {
  CART_GRAVITY, CHAIN_MAX_PER_FRAME, CHAIN_RADIUS, CHAIN_SCORE, CLAMP_X,
  DELIVERY_EXTRA, DELIVERY_WEAVE, DOG_LEASH, FEATURE_RAGE, HIT_HALF_W, INF_DRIFT, INF_DRIFT_RATE,
  NAV_LANE_STEP, NAV_SPIN_T, NAV_TURN_MAX, NAV_TURN_MIN, NEAR_MISS_GAP, NEAR_MISS_SCORE,
  NEAR_MISS_STEER, NEAR_MISS_STREAK_K, PHOTO_WOBBLE, RAGE_DURATION, SCOOTER_EXTRA,
  SPRAY_SLOW_SCALE, TALK_DRIFT, TALK_DRIFT_RATE,
} from '../config';
import { animatePerson, setHeadSway } from '../entities/person';
import { player } from '../entities/player';
import { pool } from '../entities/pools';
import { drawLives, flash, updateComposure } from '../hud/hud';
import { G, slotsX } from '../state';
import { clamp, rand } from '../util';
import { eventIsNoSignal, eventPull } from './events';
import { gameOver } from './lifecycle';
import { knockOff, registerBonk, resetCombo, score, tryUmbrellaBlock } from './powers';
import { buzz } from './haptics';
import { noteChapterLifeLost, noteChapterNearMiss } from './progress';

const nearMissLines = [
  'TOO CLOSE',
  'THREAD THE NEEDLE',
  'THAT WAS STUPID',
  'SOCIAL DISTANCING FAILED',
];

function tryChains(source: any, budget: { left: number }) {
  if (budget.left <= 0) return;
  const sx = source.position.x, sz = source.position.z;
  for (const v of pool) {
    if (budget.left <= 0) break;
    if (!v.active || v === source) continue;
    const d = v.userData;
    if (d.knocked || d.hit) continue;
    const dx = v.position.x - sx, dz = v.position.z - sz;
    if (Math.abs(dx) > CHAIN_RADIUS || Math.abs(dz) > CHAIN_RADIUS) continue;
    if (Math.hypot(dx, dz) > CHAIN_RADIUS) continue;
    knockOff(v, dx || (v.position.x - player.position.x), 'chain');
    G.chainReactions++;
    registerBonk(1, CHAIN_SCORE, 'CLANK!', '#ffe27a');
    budget.left--;
  }
}

function updateNavigator(z: any, d: any, dt: number) {
  d.navT -= dt;
  if (d.navSpin > 0) {
    d.navSpin -= dt;
    z.rotation.y = Math.PI;
    if (d.navSpin <= 0) {
      d.navSpin = 0;
      z.rotation.y = 0;
      d.navT = NAV_TURN_MIN + rand() * (NAV_TURN_MAX - NAV_TURN_MIN);
    }
  } else if (d.navT <= 0) {
    // Either a sudden lane hop or a confused 180.
    if (rand() < 0.55) {
      const dir = rand() < 0.5 ? -1 : 1;
      d.baseX = clamp(d.baseX + dir * NAV_LANE_STEP, -CLAMP_X, CLAMP_X);
      d.navT = NAV_TURN_MIN + rand() * (NAV_TURN_MAX - NAV_TURN_MIN);
    } else {
      d.navSpin = NAV_SPIN_T;
    }
  }
  // Ease toward the new lane so the hop reads as a decision, not a teleport.
  z.position.x += (d.baseX - z.position.x) * Math.min(1, dt * 6);
  if (d.navSpin <= 0) z.rotation.y = (d.baseX - z.position.x) * 0.35;
  setHeadSway(z, 0.15, Math.sin(d.driftPhase) * 0.1, 0);
}

/** Base yaw: Math.PI = walking with the player, 0 = walking into them. */
function faceBase(d: any) {
  return d.faceAway ? Math.PI : 0;
}

export function updateZombies(dt: number, now: number) {
  const pz = player.position.z, px = player.position.x;
  const chainBudget = { left: CHAIN_MAX_PER_FRAME };
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
      } else if (d.fx === 'horn' || d.fx === 'whistle' || d.fx === 'umbrella') {
        z.position.x += d.knockVx * dt;
        z.position.z += G.speed * dt * 0.35;
        z.position.y = Math.abs(Math.sin(d.tripT * 22)) * 0.18;
        z.rotation.y += dt * (d.fx === 'whistle' ? 14 : d.fx === 'umbrella' ? 8 : 10);
        if (d.tripT > 0.95 || Math.abs(z.position.x) > 13) { z.active = false; z.visible = false; }
      } else {
        z.position.x += d.knockVx * dt;
        z.position.z += G.speed * dt * 0.25;
        z.rotation.z += d.knockVx * dt * 0.35;
        z.rotation.x += dt * 5;
        z.position.y = Math.max(0, Math.sin(Math.min(1, d.tripT / 0.4) * Math.PI) * 1.1);
        if (d.tripT > 1.15 || Math.abs(z.position.x) > 13) { z.active = false; z.visible = false; }
      }
      if (z.active && d.tripT < 0.45) tryChains(z, chainBudget);
      continue;
    }

    // Approach speed: scooters / deliveries close the gap faster; tour groups drift slower.
    if (d.slowT > 0) d.slowT = Math.max(0, d.slowT - dt);
    let approach = G.speed
      + (d.type === 'scooter' ? SCOOTER_EXTRA : 0)
      + (d.type === 'delivery' ? DELIVERY_EXTRA : 0)
      + (d.type === 'tour' ? -1.1 : 0)
      + (d.type === 'dog' && d.isPup ? 0.4 : 0);
    if (d.slowT > 0) approach *= SPRAY_SLOW_SCALE;
    z.position.z += Math.max(G.speed * 0.35, approach) * dt;

    // Stage 3: No Signal — everyone walks like a person for a few seconds.
    if (eventIsNoSignal() && G.gunT <= 0) {
      z.position.x += (d.baseX - z.position.x) * Math.min(1, dt * 5);
      z.rotation.y = faceBase(d);
      z.rotation.z = 0;
      setHeadSway(z, -0.32, Math.sin(now * 0.004 + d.driftPhase) * 0.05, 0);
    } else if (d.type === 'nav' && G.gunT <= 0) {
      d.driftPhase += dt;
      updateNavigator(z, d, dt);
    } else if (d.type === 'photo') {
      // Walking with the player (same facing); light weave like talkers.
      d.driftPhase += dt * TALK_DRIFT_RATE * 0.7;
      z.position.x = d.baseX + Math.sin(d.driftPhase) * Math.max(PHOTO_WOBBLE * 8, TALK_DRIFT * 0.55);
      z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
      z.rotation.y = Math.PI + Math.sin(d.driftPhase) * 0.4;
      setHeadSway(z, -0.08, 0, Math.sin(now * 0.01) * 0.05);
    } else if (d.type === 'scooter') {
      z.position.x = d.baseX;
      z.rotation.y = 0;
      z.rotation.z = Math.sin(now * 0.02 + d.driftPhase) * 0.08;
      setHeadSway(z, 0.2, 0, 0);
    } else if (d.type === 'delivery') {
      // Reverse-lane bike: faces with player, weaves hard across lanes.
      d.driftPhase += dt * 2.4;
      z.position.x = d.baseX + Math.sin(d.driftPhase) * DELIVERY_WEAVE;
      z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
      z.rotation.y = Math.PI + Math.sin(d.driftPhase) * 0.55;
      z.rotation.z = Math.sin(now * 0.03 + d.driftPhase) * 0.12;
      setHeadSway(z, 0.1, Math.sin(d.driftPhase) * 0.1, 0);
    } else if (d.type === 'tour') {
      // Slow blob: ease toward baseX; lean toward linked neighbour.
      z.position.x += (d.baseX - z.position.x) * Math.min(1, dt * 3);
      z.rotation.y = faceBase(d);
      if (d.link && d.link.active) {
        const toward = Math.sign(d.link.position.x - z.position.x) * 0.16;
        setHeadSway(z, 0, toward, 0);
      }
    } else if (d.type === 'dog') {
      // Walker weaves; pup is tugged back if the leash stretches.
      if (!d.isPup) {
        d.driftPhase += dt * TALK_DRIFT_RATE * 1.1;
        d.baseX = clamp(d.baseX + Math.sin(d.driftPhase) * 0.012, -CLAMP_X, CLAMP_X);
        z.position.x = d.baseX + Math.sin(d.driftPhase) * TALK_DRIFT * 0.7;
        z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
        z.rotation.y = faceBase(d) + Math.sin(d.driftPhase) * 0.35;
      } else {
        z.rotation.y = faceBase(d);
        if (d.link && d.link.active) {
          const lx = d.link.position.x - z.position.x;
          const lz = d.link.position.z - z.position.z;
          const dist = Math.hypot(lx, lz);
          const maxL = d.leashLen || DOG_LEASH;
          if (dist > maxL) {
            const pull = (dist - maxL) / dist;
            z.position.x += lx * pull;
            z.position.z += lz * pull * 0.35;
          } else {
            z.position.x += (d.link.position.x + Math.sin(now * 0.008) * 0.4 - z.position.x) * Math.min(1, dt * 4);
          }
        }
      }
      setHeadSway(z, d.isPup ? 0.25 : 0, 0, 0);
    } else if (d.type === 'couple') {
      // Linked pair: stay on baseX; soft lean toward partner when present.
      z.position.x = d.baseX;
      z.rotation.y = faceBase(d);
      if (d.link && d.link.active) {
        const toward = Math.sign(d.link.position.x - z.position.x) * 0.12;
        setHeadSway(z, 0, toward, 0);
      }
    } else if (
      (d.type === 'talk' || d.type === 'inf' || ((d.type === 'text' || d.type === 'selfie') && d.faceAway))
      && G.gunT <= 0
    ) {
      // Talk/inf always zigzag; same-direction texters/selfiers weave too.
      const rate = d.type === 'inf' ? INF_DRIFT_RATE : TALK_DRIFT_RATE;
      const amp = d.type === 'inf' ? INF_DRIFT : TALK_DRIFT;
      const yawAmp = d.type === 'inf' ? 0.35 : 0.45;
      d.driftPhase += dt * rate;
      z.position.x = d.baseX + Math.sin(d.driftPhase) * amp;
      z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
      z.rotation.y = faceBase(d) + Math.sin(d.driftPhase) * yawAmp;
      if (d.type === 'talk') setHeadSway(z, 0, 0, Math.sin(now * 0.008) * 0.04);
      else setHeadSway(z, 0, Math.sin(d.driftPhase) * 0.08, 0);
    } else if (d.type === 'text' || d.type === 'talk' || d.type === 'inf' || d.type === 'selfie') {
      z.position.x = d.baseX;
      z.rotation.y = faceBase(d);
    }

    // Stage 3: Free WiFi / Low Battery — soft lateral pull after archetype motion.
    const pull = eventPull();
    if (pull && G.gunT <= 0 && !d.knocked) {
      const tx = pull.kind === 'battery'
        ? (z.position.x < 0 ? slotsX[0] : slotsX[4])
        : pull.targetX;
      z.position.x += (tx - z.position.x) * Math.min(1, dt * pull.rate);
      z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
    }

    // Visual only: people the camera has already passed keep simulating, but their mixer can rest.
    if (z.position.z < 12) {
      const amt = d.type === 'selfie' ? 0.05
        : d.type === 'scooter' || d.type === 'delivery' ? 0.75
        : d.type === 'photo' ? 0.4
        : d.type === 'tour' ? 0.22
        : d.type === 'dog' ? (d.isPup ? 0.9 : 0.4)
        : d.type === 'text' || d.type === 'nav' ? 0.5
        : d.type === 'inf' ? 0.28
        : 0.35;
      animatePerson(z, dt, amt);
    }

    const halfW = d.hitHalfW ?? HIT_HALF_W;
    const dz = z.position.z - pz, dx = z.position.x - px;
    if (G.cartRush > 0 && Math.abs(dz) < 1.2 && Math.abs(dx) < 1.7) {
      knockOff(z, dx, 'cart');
      registerBonk(1, 12, undefined, '#7fd0ff');
      continue;
    }
    if (!d.hit && Math.abs(dz) < 1.05 && Math.abs(dx) < halfW) {
      d.hit = true;
      if (G.invuln <= 0) {
        if (tryUmbrellaBlock(z, dx)) {
          // Frontal bump absorbed — no composure loss.
        } else {
          G.lives--;
          noteChapterLifeLost();
          resetCombo();
          G.nearMissStreak = 0;
          G.invuln = 1.1;
          G.shake = Math.min(G.shake + 0.6, 0.9);
          drawLives();
          updateComposure();
          sfxBump();
          buzz('error');
          knockOff(z, dx, 'shove');
          if (G.lives === 1) flash('LOSING IT — SHOVE FASTER', '#ff4466');
        if (FEATURE_RAGE && G.lives === 1 && G.rageT <= 0) {
          G.rageT = RAGE_DURATION;
          flash('LOSING IT', '#ff4466');
          sfxRage();
          buzz('heavy');
        }
          if (G.lives <= 0) gameOver(d.type);
        }
      }
    }
    if (!d.passed && z.position.z > pz + 0.6) {
      d.passed = true;
      if (!d.hit) {
        const gap = Math.abs(dx);
        const weaving = G.lateralSpeed >= NEAR_MISS_STEER;
        if (gap < NEAR_MISS_GAP && weaving) {
          G.nearMisses++;
          G.nearMissStreak++;
          noteChapterNearMiss(G.nearMissStreak);
          const bonus = NEAR_MISS_SCORE + Math.min(G.nearMissStreak, 12) * NEAR_MISS_STREAK_K;
          score(bonus);
          const line = nearMissLines[Math.min(nearMissLines.length - 1, G.nearMissStreak - 1)]
            + (G.nearMissStreak >= 2 ? ' ×' + G.nearMissStreak : '');
          flash(line + '  +' + bonus, gap < 1.0 ? 'var(--accent)' : 'var(--talk)');
          sfxNear(G.nearMissStreak);
          if (G.nearMissStreak === 1 || G.nearMissStreak % 3 === 0) buzz('light');
          else if (G.nearMissStreak >= 5 && G.nearMissStreak % 2 === 0) buzz('medium');
        } else {
          if (G.nearMissStreak >= 3) sfxNearBreak(G.nearMissStreak);
          G.nearMissStreak = 0;
        }
      }
    }
    if (z.position.z > 16) { z.active = false; z.visible = false; z.userData.link = null; }
  }
}
