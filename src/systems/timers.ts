// Cooldowns and power timers: shove, gun, invuln, coin streak, cart rush, horn scare ring, combo decay.
import { FEATURE_RAGE, GUN_DURATION, GUN_RATE, POWERS } from '../config';
import { gunProp, player, scareRing } from '../entities/player';
import { PICK_COL } from '../entities/pools';
import { elCool, elShoveName, flash } from '../hud/hud';
import { wrap } from '../render/renderer';
import { G } from '../state';
import { fireGun, refreshPowerHud, resetCombo } from './powers';

export function updateTimers(dt: number) {
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
    (scareRing.material as any).opacity = Math.max(0, 0.7 * (1 - u));
  } else (scareRing.material as any).opacity = 0;

  // Bonk combo decay
  if (G.combo > 0) {
    G.comboTimer -= dt;
    if (G.comboTimer <= 0) resetCombo();
  }

  if (FEATURE_RAGE && G.rageT > 0) {
    G.rageT -= dt;
    if (G.rageT <= 0) G.rageT = 0;
  }
}
