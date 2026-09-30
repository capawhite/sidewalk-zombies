// Weapons, shove, knock-off and the power queue.
import * as THREE from 'three';
import { audioResume } from '../audio/engine';
import { playPower, sfxGun } from '../audio/sfx';
import { CART_LAUNCH, GUN_DURATION, GUN_STACK_MAX, GUN_START_INVULN, POWERS } from '../config';
import { applyPose } from '../entities/person';
import { batProp, gunProp, hornProp, player, scareRing } from '../entities/player';
import { PICK_COL, getBullet, pool } from '../entities/pools';
import { drawArsenal, elShove, elShoveHint, elShoveName, flash } from '../hud/hud';
import { FXC, FXW, fxBurst, hexCss, popAt, screenFlash } from '../render/fx';
import { G, S, powerQ } from '../state';
import { rand } from '../util';

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
function waitingPower(): string {
  return powerQ[G.gunT > 0 ? 0 : 1] || '';
}
export function refreshPowerHud() {
  G.power = peekPower();
  if (G.gunT <= 0) elShoveName.textContent = POWERS[G.power].name;
  elShove.classList.remove('power-cart', 'power-horn', 'power-gun', 'power-bomb');
  if (G.power === 'cart') elShove.classList.add('power-cart');
  if (G.power === 'horn') elShove.classList.add('power-horn');
  if (G.power === 'gun') elShove.classList.add('power-gun');
  if (G.power === 'bomb') elShove.classList.add('power-bomb');
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
// ---------- knock / shove ----------
export function knockOff(z: any, dx: number, fx: string) {
  const d = z.userData;
  d.knocked = true; d.tripT = 0; d.hit = true; d.fx = fx;
  const dir = dx === 0 ? (z.position.x >= 0 ? 1 : -1) : Math.sign(dx);
  if (fx === 'cart') {
    d.knockVx = dir * (2 + rand() * 2);
    d.knockVy = CART_LAUNCH;
  } else if (fx === 'horn') {
    d.knockVx = dir * (13 + rand() * 4);
    d.knockVy = 2;
    applyPose(z, 'scared');
  } else if (fx === 'gun') {
    d.knockVx = dir * (3 + rand() * 2);
    d.knockVy = 6;
  } else if (fx === 'bomb') {
    d.knockVx = (rand() - 0.5) * 22;
    d.knockVy = 10 + rand() * 10;
  } else {
    d.knockVx = dir * (9 + rand() * 3);
    d.knockVy = 3.2;
  }
  if (d.phone) d.phone.visible = false;
  const fcol = FXC[fx] || 0xffffff;
  fxBurst(z.position.x, 1.1, z.position.z, fcol, fx === 'gun' ? 3 : fx === 'bomb' ? 4 : 9, fx === 'bomb' ? 7 : 4.5, 5);
  if (fx === 'gun' ? rand() < 0.18 : fx === 'bomb' ? rand() < 0.25 : true) {
    popAt(z.position.x, 2.1, z.position.z, FXW[fx] || 'BONK!', hexCss(fcol === 0xffffff ? 0xffe27a : fcol));
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
    if (got) {
      G.combo += got; G.bestCombo = Math.max(G.bestCombo, G.combo);
      flash('BOOM! +' + got * 20, '#ff4466');
      score(got * 20);
    } else flash('BOOM!', '#ff4466');
    G.shake = Math.min(G.shake + 0.85, 1);
    G.hitStop = 0.11; G.fovKick = 7; screenFlash();
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
  if (got) {
    G.combo += got; G.bestCombo = Math.max(G.bestCombo, G.combo);
    flash(p.yell + ' +' + got * 15, kind === 'horn' ? '#ffd24a' : kind === 'cart' ? '#7fd0ff' : 'var(--accent)');
    score(got * 15);
  } else flash(p.yell, kind === 'horn' ? '#ffd24a' : kind === 'cart' ? '#7fd0ff' : 'var(--accent)');
  G.shake = Math.min(G.shake + p.shake, 0.85);
  if (got) G.hitStop = 0.05;
  G.fovKick = Math.max(G.fovKick, kind === 'horn' ? 3 : 4);
  refreshPowerHud();
}
export function doShove() {
  if (G.state !== S.play) return;
  if (G.gunT > 0) return;
  audioResume();
  const ready = peekPower();
  if (ready === 'gun') {
    consumeReadyPower();
    startGun(false);
    return;
  }
  if (ready === 'bomb' || ready === 'cart' || ready === 'horn') {
    consumeReadyPower();
    fireWeapon(ready);
    return;
  }
  if (G.shoveCd > 0) return;
  const p = POWERS.shoulder;
  G.shoveCd = p.cd; G.lastCd = p.cd;
  playPower('shoulder');
  let got = 0;
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    const dz = z.position.z - player.position.z, dx = z.position.x - player.position.x;
    if (dz < 0.5 && dz > -p.reach && Math.abs(dx) < p.halfW) { knockOff(z, dx, 'shove'); got++; }
  }
  if (got) {
    G.combo += got; G.bestCombo = Math.max(G.bestCombo, G.combo);
    flash(p.yell + ' +' + got * 15, 'var(--accent)');
    score(got * 15);
  }
  G.shake = Math.min(G.shake + p.shake, 0.85);
}
export function score(n: number) { G.scoreAcc += n; }