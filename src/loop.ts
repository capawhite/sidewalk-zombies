// Game loop: one simulation step (frame) plus rendering (tick).
import * as THREE from 'three';
import { sfxBump, sfxNear, sfxPickup } from './audio/sfx';
import { CAM_FOLLOW_RATE, CAM_FOLLOW_X, CAM_LOOK_X, CAM_LOOK_Y, CAM_LOOK_Z, CART_GRAVITY, CLAMP_X, COIN_GAP, GUN_DURATION, GUN_FRONT, GUN_HIT_X, GUN_HIT_Z, GUN_PACK_GAP, GUN_RATE, GUN_SPEED, INF_DRIFT, INF_DRIFT_RATE, POWERS, SEG_LEN, SEG_N, SPAWN_GAP, SPAWN_Z, SPEED, STEER_ACCEL, STEER_DECEL, STEER_LEAN, STEER_LEAN_SMOOTH, STEER_MAX_SPEED, STEER_REVERSE, STEER_TOUCH_DEAD_PX, STEER_TOUCH_FOLLOW, STEER_TOUCH_SPAN, STEER_YAW, TALK_DRIFT, TALK_DRIFT_RATE } from './config';
import { gait } from './entities/person';
import { batProp, gunProp, hornProp, player, scareRing } from './entities/player';
import { PICK_COL, bullets, coinPool, pickPool, pool } from './entities/pools';
import { drawLives, elCool, elScore, elShoveName, flash } from './hud/hud';
import { fxBurst, hexCss, popAt, updateParts } from './render/fx';
import { camBase, camera, renderer, scene, wrap } from './render/renderer';
import { flapSeagulls } from './scene/seagulls';
import { scroll } from './scene/worlds';
import { G, S, keys, stageOf } from './state';
import { collectCoin } from './systems/collect';
import { beginClear } from './systems/levels';
import { gameOver } from './systems/lifecycle';
import { collectPower, fireGun, knockOff, refreshPowerHud, score } from './systems/powers';
import { spawnCoin, spawnPickup, spawnWave } from './systems/spawn';
import { clamp, toward } from './util';

// ---------- loop ----------
export function tick(now: number) {
  requestAnimationFrame(tick);
  let dt = (now - G.last) / 1000; G.last = now;
  if (dt < 0) dt = 0;
  if (dt > 0.05) dt = 0.05;
  frame(dt, now);
  renderer.render(scene, camera);
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

    if (G.tapLeft > 0) G.tapLeft -= dt;
    if (G.tapRight > 0) G.tapRight -= dt;
    const prevX = player.position.x;
    if (G.pointerActive) {
      let dxPx = G.pointerX - G.pointerOriginX;
      if (Math.abs(dxPx) < STEER_TOUCH_DEAD_PX) dxPx = 0;
      const targetX = clamp(
        G.touchAnchorX + (dxPx / Math.max(wrap.clientWidth, 1)) * STEER_TOUCH_SPAN,
        -CLAMP_X, CLAMP_X,
      );
      player.position.x = toward(player.position.x, targetX, STEER_TOUCH_FOLLOW * dt);
      G.vx = 0;
    } else {
      let inp = 0;
      if (keys.left || G.tapLeft > 0) inp -= 1;
      if (keys.right || G.tapRight > 0) inp += 1;
      const targetVx = inp * STEER_MAX_SPEED;
      const reversing = inp !== 0 && G.vx !== 0 && Math.sign(inp) !== Math.sign(G.vx);
      const rate = inp === 0 ? STEER_DECEL : reversing ? STEER_REVERSE : STEER_ACCEL;
      G.vx = toward(G.vx, targetVx, rate * dt);
      player.position.x += G.vx * dt;
    }
    if (player.position.x > CLAMP_X) { player.position.x = CLAMP_X; G.vx = 0; }
    if (player.position.x < -CLAMP_X) { player.position.x = -CLAMP_X; G.vx = 0; }
    const instV = (player.position.x - prevX) / Math.max(dt, 0.0001);
    G.lean += (clamp(instV / 8, -1, 1) - G.lean) * Math.min(1, dt * STEER_LEAN_SMOOTH);
    player.rotation.z = -G.lean * STEER_LEAN;
    player.rotation.y = G.lean * STEER_YAW;
    if (G.hopT > 0) {
      G.hopT -= dt;
      const u = 1 - Math.max(0, G.hopT) / 0.2;
      player.position.y = Math.sin(u * Math.PI) * 0.28;
      if (G.hopT <= 0) { G.hopT = 0; player.position.y = 0; }
    } else player.position.y = 0;
    gait(player, now * 0.014, 0.55);
    batProp.visible = G.power === 'cart' || G.cartRush > 0;
    hornProp.visible = G.power === 'horn' || G.scareT > 0;

    for (const s of scroll) {
      s.position.z += G.speed * dt;
      if (s.position.z > SEG_LEN) s.position.z -= SEG_N * SEG_LEN;
    }

    G.spawnTimer -= dt;
    if (G.spawnTimer <= 0) {
      spawnWave();
      G.spawnTimer = G.gunT > 0
        ? GUN_PACK_GAP + Math.random() * 0.08
        : SPAWN_GAP + Math.random() * 0.2;
    }
    G.pickTimer -= dt;
    if (G.pickTimer <= 0) {
      spawnPickup();
      G.pickTimer = 6.5 + Math.random() * 2;
    }
    G.coinTimer -= dt;
    if (G.coinTimer <= 0) {
      spawnCoin();
      G.coinTimer = COIN_GAP + Math.random() * 1.1;
    }

    if (G.shoveCd > 0) { G.shoveCd -= dt; if (G.shoveCd < 0) G.shoveCd = 0; }
    if (G.gunT > 0) {
      G.gunT -= dt; G.gunCd -= dt;
      elShoveName.textContent = 'GUN ' + Math.max(0, Math.ceil(G.gunT));
      (elCool as HTMLElement).style.transform = 'scaleY(' + (1 - Math.min(1, G.gunT / GUN_DURATION)) + ')';
      gunProp.visible = true;
      if (G.gunCd <= 0) { fireGun(); G.gunCd = GUN_RATE; }
      if (G.gunT <= 0) {
        G.gunT = 0;
        refreshPowerHud();
        if (G.power !== 'shoulder') {
          flash(POWERS[G.power].name + ' READY', '#' + PICK_COL[G.power].toString(16).padStart(6, '0'));
        }
      }
    } else {
      const cooling = G.power === 'shoulder' ? G.shoveCd / G.lastCd : 0;
      (elCool as HTMLElement).style.transform = 'scaleY(' + cooling + ')';
    }
    if (G.invuln > 0) G.invuln -= dt;
    if (G.coinStreakT > 0) G.coinStreakT -= dt;
    wrap.classList.toggle('hot', G.gunT > 0);
    if (G.cartRush > 0) { G.cartRush -= dt; if (G.cartRush < 0) G.cartRush = 0; }
    if (G.scareT > 0) {
      G.scareT -= dt;
      const u = 1 - G.scareT / 0.4;
      scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
      scareRing.scale.setScalar(1 + u * 10);
      (scareRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - u));
    } else (scareRing.material as THREE.MeshBasicMaterial).opacity = 0;

    const pz = player.position.z, px = player.position.x;
    for (const b of bullets) {
      if (!b.active) continue;
      b.position.z -= GUN_SPEED * dt;
      if (b.position.z < SPAWN_Z - 6) { b.active = false; b.visible = false; continue; }
      for (const z of pool) {
        if (!z.active || z.userData.knocked) continue;
        if (z.position.z > player.position.z - GUN_FRONT) continue;
        if (Math.abs(z.position.x - b.position.x) < GUN_HIT_X && Math.abs(z.position.z - b.position.z) < GUN_HIT_Z) {
          knockOff(z, z.position.x - b.position.x, 'gun');
          G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); score(8);
          b.active = false; b.visible = false;
          break;
        }
      }
    }
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
        if (d.type === 'talk') d.head.rotation.set(0.02, 0.06, 0.1 + Math.sin(now * 0.008) * 0.04);
        else d.head.rotation.set(-0.12, Math.sin(d.driftPhase) * 0.08, 0);
      } else if (d.type === 'text' || d.type === 'talk' || d.type === 'inf') {
        z.position.x = d.baseX;
        z.rotation.y = 0;
      }
      gait(z, now * 0.008 + d.driftPhase, d.type === 'selfie' ? 0.05 : d.type === 'text' ? 0.5 : d.type === 'inf' ? 0.28 : 0.35);

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

  if (G.state !== S.play) {
    for (const s of scroll) { s.position.z += 1.4 * dt; if (s.position.z > SEG_LEN) s.position.z -= SEG_N * SEG_LEN; }
  }
  flapSeagulls(dt, now);
  updateParts(dt);
  if (G.state !== S.play) wrap.classList.remove('hot');
  if (G.fovKick > 0) G.fovKick = Math.max(0, G.fovKick - dt * 24);
  const wantFov = G.baseFov + G.fovKick;
  if (Math.abs(camera.fov - wantFov) > 0.01) { camera.fov = wantFov; camera.updateProjectionMatrix(); }
}