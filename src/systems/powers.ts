// Weapons, shove, knock-off and the power queue.
import * as THREE from 'three';
import { audioResume } from '../audio/engine';
import { playPower, sfxGun } from '../audio/sfx';
import {
  CART_LAUNCH, COMBO_MULT_CAP, COMBO_SCORE_K, COMBO_WINDOW, FEATURE_RAGE,
  GUN_DURATION, GUN_STACK_MAX, GUN_START_INVULN, POWERS, RAGE_KNOCK_SCALE,
  RAGE_SHOVE_CD_SCALE, SHOVE_HITSTOP, SHOVE_SHAKE, SPRAY_SLOW_T,
} from '../config';
import { applyPose } from '../entities/person';
import { batProp, gunProp, hornProp, player, scareRing } from '../entities/player';
import { PICK_COL, getBullet, pool } from '../entities/pools';
import { drawArsenal, elShove, elShoveHint, elShoveName, flash, showCombo } from '../hud/hud';
import { FXC, FXW, fxBurst, hexCss, popAt, screenFlash } from '../render/fx';
import { G, S, powerQ } from '../state';
import { rand } from '../util';
import { onChallengeBonk } from './challenges';
import { shoveCdScale } from './composure';
import { buzz } from './haptics';
import { isEmptyHands } from './emptyHands';
import { isEscalatorWeave } from './escalator';
import { isLuggageClaim } from './luggage';

export function fireGun() {
  const b = getBullet();
  b.active = true; b.visible = true;
  b.position.set(player.position.x + 0.15, 1.28, player.position.z - 0.6);
  fxBurst(b.position.x, 1.28, b.position.z - 0.1, 0xffee66, 1, 1.2, 0.6, 0.14);
  sfxGun();
}
function peekPower(): string {
  return G.gunT > 0 ? 'gun' : (powerQ[0] || 'shoulder');
}
export function refreshPowerHud() {
  G.power = peekPower();
  if (G.gunT <= 0) {
    if (G.umbrellaCharges > 0 && G.power === 'shoulder') elShoveName.textContent = 'BLOCK READY';
    else elShoveName.textContent = POWERS[G.power].name;
  }
  elShove.classList.remove('power-cart', 'power-horn', 'power-gun', 'power-bomb', 'power-whistle', 'power-spray', 'power-umbrella');
  if (G.power === 'cart') elShove.classList.add('power-cart');
  if (G.power === 'horn') elShove.classList.add('power-horn');
  if (G.power === 'gun') elShove.classList.add('power-gun');
  if (G.power === 'bomb') elShove.classList.add('power-bomb');
  if (G.power === 'whistle') elShove.classList.add('power-whistle');
  if (G.power === 'spray') elShove.classList.add('power-spray');
  if (G.power === 'umbrella' || (G.umbrellaCharges > 0 && G.power === 'shoulder')) elShove.classList.add('power-umbrella');
  elShoveHint.textContent = 'SPACE';
  drawArsenal();
  batProp.visible = G.power === 'cart' || G.cartRush > 0;
  hornProp.visible = G.power === 'horn' || G.scareT > 0;
  gunProp.visible = G.power === 'gun' || G.gunT > 0;
}
export function setPower(next: string) {
  powerQ.length = 0;
  if (next !== 'shoulder' && next !== 'gun') powerQ.push(next);
  if (next === 'gun') powerQ.push('gun');
  refreshPowerHud();
}
export function collectPower(kind: string) {
  if (isEmptyHands()) {
    flash('EMPTY HANDS — SHOVE ONLY', '#f0d078');
    return;
  }
  if (kind === 'gun' && G.gunT > 0) {
    startGun(true);
    return;
  }
  powerQ.push(kind);
  refreshPowerHud();
  const hex = '#' + PICK_COL[kind].toString(16).padStart(6, '0');
  if (G.gunT > 0 || powerQ.length > 1) flash(POWERS[kind].name + ' QUEUED', hex);
  else flash(POWERS[kind].name + ' READY', hex);
}
function consumeReadyPower() {
  if (powerQ[0]) powerQ.shift();
  refreshPowerHud();
}

// ---------- bonk combo ----------
export function comboLabel(n: number): string {
  if (n >= 10) return 'ABSOLUTE MENACE ×' + n;
  if (n >= 5) return 'MEGA BONK ×' + n;
  if (n >= 3) return 'BONK ×' + n;
  if (n >= 2) return 'BONK ×' + n;
  return '';
}
export function comboMult(): number {
  return 1 + Math.min(COMBO_MULT_CAP, Math.max(0, G.combo - 1) * COMBO_SCORE_K);
}
/** Register successful bonk hits: refresh combo window, score with multiplier, flash tiers. */
export function registerBonk(hits: number, basePerHit: number, yell?: string, color = 'var(--accent)') {
  if (hits <= 0) return 0;
  G.combo += hits;
  G.bestCombo = Math.max(G.bestCombo, G.combo);
  G.comboTimer = COMBO_WINDOW;
  const pts = Math.round(basePerHit * hits * comboMult());
  score(pts);
  const tier = comboLabel(G.combo);
  if (tier) {
    flash(tier + '  +' + pts, color);
    showCombo(tier);
  } else {
    flash((yell || 'BONK!') + ' +' + pts, color);
  }
  return pts;
}
export function resetCombo() {
  G.combo = 0;
  G.comboTimer = 0;
  showCombo('');
}

// ---------- knock / shove ----------
function knockScale() {
  return FEATURE_RAGE && G.rageT > 0 ? RAGE_KNOCK_SCALE : 1;
}
export function knockOff(z: any, dx: number, fx: string) {
  const d = z.userData;
  if (d.knocked) return;
  d.knocked = true; d.tripT = 0; d.hit = true; d.fx = fx;
  const dir = dx === 0 ? (z.position.x >= 0 ? 1 : -1) : Math.sign(dx);
  const k = knockScale();
  if (fx === 'cart') {
    d.knockVx = dir * (2 + rand() * 2) * k;
    d.knockVy = CART_LAUNCH * (k > 1 ? 1.1 : 1);
  } else if (fx === 'horn') {
    d.knockVx = dir * (13 + rand() * 4) * k;
    d.knockVy = 2;
    applyPose(z, 'scared');
  } else if (fx === 'gun') {
    d.knockVx = dir * (3 + rand() * 2) * k;
    d.knockVy = 6;
  } else if (fx === 'bomb') {
    d.knockVx = (rand() - 0.5) * 22 * k;
    d.knockVy = (10 + rand() * 10) * (k > 1 ? 1.1 : 1);
  } else if (fx === 'whistle') {
    // Hard lateral shove — clear the player's lane without a full wipe.
    d.knockVx = dir * (14 + rand() * 4) * k;
    d.knockVy = 1.6;
    applyPose(z, 'scared');
  } else if (fx === 'umbrella') {
    d.knockVx = dir * (11 + rand() * 3) * k;
    d.knockVy = 2.2;
    applyPose(z, 'scared');
  } else if (fx === 'chain') {
    d.knockVx = dir * (6 + rand() * 2.5);
    d.knockVy = 2.4;
  } else {
    d.knockVx = dir * (9 + rand() * 3) * k;
    d.knockVy = 3.2 * (k > 1 ? 1.15 : 1);
  }
  if (d.phone) d.phone.visible = false;
  const fcol = FXC[fx] || 0xffffff;
  const nBurst = fx === 'gun' ? 3 : fx === 'bomb' ? 4 : fx === 'chain' ? 6 : 11;
  fxBurst(z.position.x, 1.1, z.position.z, fcol, nBurst, fx === 'bomb' ? 7 : fx === 'chain' ? 3.5 : 5, 5);
  if (fx === 'gun' ? rand() < 0.18 : fx === 'bomb' ? rand() < 0.25 : true) {
    popAt(z.position.x, 2.1, z.position.z, FXW[fx] || 'BONK!', hexCss(fcol === 0xffffff ? 0xffe27a : fcol));
  }
  onChallengeBonk(d.type || 'text');
  // Linked couple: both go down together (break the link first to avoid recursion).
  const partner = d.link;
  if (partner && partner.active && !partner.userData.knocked) {
    d.link = null;
    partner.userData.link = null;
    knockOff(partner, dx, fx);
  }
}
function thinForGun() {
  // Don't wipe the crowd. Bullets only hit what's on the barrel line.
  G.spawnTimer = 0.28;
}
function startGun(stack = false) {
  audioResume();
  if (stack && G.gunT > 0) {
    G.gunT = Math.min(G.gunT + GUN_DURATION, GUN_STACK_MAX);
    flash('GUN +' + GUN_DURATION + 's', '#ff8a2a');
  } else {
    G.gunT = GUN_DURATION; G.gunCd = 0;
    thinForGun();
    G.invuln = Math.max(G.invuln, GUN_START_INVULN);
    flash('GUN ' + GUN_DURATION + 's', '#ff8a2a');
  }
  refreshPowerHud();
}
function fireWeapon(kind: string) {
  if (G.state !== S.play) return;
  audioResume();
  if (kind === 'gun') { startGun(G.gunT > 0); return; }
  if (kind === 'bomb') {
    playPower('bomb');
    G.scareT = 0.45;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xff4466);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
    let got = 0;
    for (const z of pool) {
      if (!z.active || z.userData.knocked) continue;
      knockOff(z, z.position.x - player.position.x, 'bomb');
      got++;
    }
    if (got) registerBonk(got, 20, 'BOOM!', '#ff4466');
    else flash('BOOM!', '#ff4466');
    G.shake = Math.min(G.shake + 0.85, 1);
    G.hitStop = 0.11; G.fovKick = 7; screenFlash();
    refreshPowerHud();
    return;
  }
  if (kind === 'whistle') {
    playPower('whistle');
    G.scareT = 0.35;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xa8e6ff);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
    const p = POWERS.whistle;
    const laneHalf = p.halfW;
    let got = 0;
    for (const z of pool) {
      if (!z.active || z.userData.knocked) continue;
      const dz = z.position.z - player.position.z;
      const dx = z.position.x - player.position.x;
      // Anyone in the player's lane ahead — blow them sideways to open a path.
      if (dz < 0.5 && dz > -p.reach && Math.abs(dx) < laneHalf) {
        const side = Math.abs(dx) < 0.2
          ? (z.position.x >= player.position.x ? 1 : -1)
          : Math.sign(dx);
        knockOff(z, side * 2, 'whistle');
        got++;
      }
    }
    if (got) registerBonk(got, 12, p.yell, '#a8e6ff');
    else flash(p.yell, '#a8e6ff');
    G.shake = Math.min(G.shake + p.shake, 0.85);
    if (got) G.hitStop = 0.04;
    G.fovKick = Math.max(G.fovKick, 2.5);
    refreshPowerHud();
    return;
  }
  if (kind === 'spray') {
    playPower('spray');
    G.scareT = 0.5;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0x7ee08a);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
    const p = POWERS.spray;
    let got = 0;
    for (const z of pool) {
      if (!z.active || z.userData.knocked) continue;
      const dz = z.position.z - player.position.z;
      const dx = z.position.x - player.position.x;
      const hit = dz < 3 && dz > -p.reach && Math.hypot(dx, Math.min(0, dz)) < p.halfW;
      if (hit) {
        z.userData.slowT = SPRAY_SLOW_T;
        got++;
      }
    }
    if (got) {
      G.scoreAcc += got * 4;
      flash(p.yell + ' ×' + got, '#7ee08a');
    } else flash(p.yell, '#7ee08a');
    G.shake = Math.min(G.shake + p.shake, 0.7);
    G.fovKick = Math.max(G.fovKick, 2);
    refreshPowerHud();
    return;
  }
  if (kind === 'umbrella') {
    playPower('umbrella');
    G.umbrellaCharges = Math.min(2, G.umbrellaCharges + 1);
    G.scareT = 0.35;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xc9a0e8);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 1.2);
    flash(G.umbrellaCharges > 1 ? 'UMBRELLA ×' + G.umbrellaCharges : 'UMBRELLA READY', '#c9a0e8');
    G.shake = Math.min(G.shake + POWERS.umbrella.shake, 0.6);
    refreshPowerHud();
    return;
  }
  const p = POWERS[kind];
  if (!p) return;
  playPower(kind);
  if (p.rush) G.cartRush = p.rush;
  if (kind === 'horn') {
    G.scareT = 0.4;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xffd24a);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
    hornProp.visible = true;
  }
  if (kind === 'cart') batProp.visible = true;
  let got = 0;
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    const dz = z.position.z - player.position.z, dx = z.position.x - player.position.x;
    let hit = false;
    if (p.radial) hit = dz < 3 && dz > -p.reach && Math.hypot(dx, Math.min(0, dz)) < p.halfW;
    else hit = dz < 0.5 && dz > -p.reach && Math.abs(dx) < p.halfW;
    if (hit) { knockOff(z, dx, kind); got++; }
  }
  const col = kind === 'horn' ? '#ffd24a' : kind === 'cart' ? '#7fd0ff' : 'var(--accent)';
  if (got) registerBonk(got, 15, p.yell, col);
  else flash(p.yell, col);
  G.shake = Math.min(G.shake + p.shake, 0.85);
  if (got) G.hitStop = 0.05;
  G.fovKick = Math.max(G.fovKick, kind === 'horn' ? 3 : 4);
  refreshPowerHud();
}
export function doShove() {
  if (G.state !== S.play) return;
  if (G.gunT > 0) return;
  // Luggage Claim / Escalator Weave: steer-only — shove button is a no-op.
  if (isLuggageClaim() || isEscalatorWeave()) {
    flash('STEER ONLY', '#f0d078');
    buzz('light');
    return;
  }
  audioResume();
  const ready = peekPower();
  if (isEmptyHands() && ready !== 'shoulder') {
    // Strip any accidental queue; shove only.
    powerQ.length = 0;
    refreshPowerHud();
  }
  if (ready === 'gun') {
    consumeReadyPower();
    startGun(false);
    return;
  }
  if (ready === 'bomb' || ready === 'cart' || ready === 'horn' || ready === 'whistle' || ready === 'spray' || ready === 'umbrella') {
    consumeReadyPower();
    fireWeapon(ready);
    return;
  }
  if (G.shoveCd > 0) return;
  const p = POWERS.shoulder;
  let cdScale = FEATURE_RAGE && G.rageT > 0 ? RAGE_SHOVE_CD_SCALE : 1;
  cdScale *= shoveCdScale();
  G.shoveCd = p.cd * cdScale; G.lastCd = G.shoveCd;
  playPower('shoulder');
  let got = 0;
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    const dz = z.position.z - player.position.z, dx = z.position.x - player.position.x;
    if (dz < 0.5 && dz > -p.reach && Math.abs(dx) < p.halfW) { knockOff(z, dx, 'shove'); got++; }
  }
  if (got) {
    registerBonk(got, 15, p.yell, 'var(--accent)');
    G.hitStop = Math.max(G.hitStop, SHOVE_HITSTOP);
    G.fovKick = Math.max(G.fovKick, 3.5);
    buzz('medium');
  } else {
    buzz('light');
  }
  G.shake = Math.min(G.shake + (got ? SHOVE_SHAKE : p.shake), 0.9);
}
export function score(n: number) { G.scoreAcc += n; }

/** Absorb one frontal hit with an armed umbrella. Returns true if blocked. */
export function tryUmbrellaBlock(z: any, dx: number): boolean {
  if (G.umbrellaCharges <= 0) return false;
  G.umbrellaCharges--;
  G.invuln = Math.max(G.invuln, 0.55);
  G.shake = Math.min(G.shake + 0.35, 0.85);
  G.fovKick = Math.max(G.fovKick, 3);
  knockOff(z, dx, 'umbrella');
  registerBonk(1, 18, 'BLOCK!', '#c9a0e8');
  buzz('medium');
  playPower('umbrella');
  refreshPowerHud();
  return true;
}
