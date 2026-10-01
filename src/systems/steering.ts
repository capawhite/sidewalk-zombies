// Player steering, lean, hop and gait (play state only).
import { CLAMP_X, STEER_ACCEL, STEER_DECEL, STEER_LEAN, STEER_LEAN_SMOOTH, STEER_MAX_SPEED, STEER_REVERSE, STEER_TAP_SPEED, STEER_TOUCH_DEAD_PX, STEER_TOUCH_FOLLOW, STEER_TOUCH_SPAN, STEER_YAW } from '../config';
import { animatePerson } from '../entities/person';
import { batProp, hornProp, player } from '../entities/player';
import { wrap } from '../render/renderer';
import { G, keys } from '../state';
import { clamp, toward } from '../util';

export function updatePlayer(dt: number, now: number) {
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
    // Held keys use full speed; keyup buffer is a soft nudge so taps don't leap.
    let held = 0;
    let tap = 0;
    if (keys.left) held -= 1;
    else if (G.tapLeft > 0) tap -= 1;
    if (keys.right) held += 1;
    else if (G.tapRight > 0) tap += 1;
    const inp = held || tap;
    const targetVx = held
      ? held * STEER_MAX_SPEED
      : tap * STEER_TAP_SPEED;
    const reversing = inp !== 0 && G.vx !== 0 && Math.sign(inp) !== Math.sign(G.vx);
    const rate = inp === 0 ? STEER_DECEL : reversing ? STEER_REVERSE : STEER_ACCEL;
    G.vx = toward(G.vx, targetVx, rate * dt);
    player.position.x += G.vx * dt;
  }
  if (player.position.x > CLAMP_X) { player.position.x = CLAMP_X; G.vx = 0; }
  if (player.position.x < -CLAMP_X) { player.position.x = -CLAMP_X; G.vx = 0; }
  const instV = (player.position.x - prevX) / Math.max(dt, 0.0001);
  G.lateralSpeed = Math.max(Math.abs(instV), G.lateralSpeed * Math.max(0, 1 - dt * 4));
  G.lean += (clamp(instV / 8, -1, 1) - G.lean) * Math.min(1, dt * STEER_LEAN_SMOOTH);
  player.rotation.z = -G.lean * STEER_LEAN;
  player.rotation.y = G.lean * STEER_YAW;
  if (G.hopT > 0) {
    G.hopT -= dt;
    const u = 1 - Math.max(0, G.hopT) / 0.2;
    player.position.y = Math.sin(u * Math.PI) * 0.28;
    if (G.hopT <= 0) { G.hopT = 0; player.position.y = 0; }
  } else player.position.y = 0;
  animatePerson(player, dt, 0.72);
  batProp.visible = G.power === 'cart' || G.cartRush > 0;
  hornProp.visible = G.power === 'horn' || G.scareT > 0;
}
