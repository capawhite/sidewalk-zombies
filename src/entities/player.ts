// The player character and the props it carries.
import * as THREE from 'three';
import { setHornCosmetic } from '../audio/sfx';
import { COL } from '../config';
import { mat } from '../render/materials';
import { scene } from '../render/renderer';
import { equippedBonk, equippedHorn, equippedLook, buildBonkModel, swapBonkProp } from '../systems/cosmetics';
import { applyPlayerLook, holdInRightHand } from './person';

// The group exists from the start (other modules import it); the body is added by initPlayer() once the models have loaded.
export const player: any = new THREE.Group();
player.position.set(0, 0, 6.5);
scene.add(player);

export function makeBatModel() {
  return buildBonkModel('bonk_bat');
}

export const batProp = new THREE.Group();
batProp.visible = false;
export const hornProp = makeHornModel();
hornProp.visible = false;
export const gunProp = new THREE.Group();
{
  // Modelled around the grip, pointing down -z.
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.42), mat(0x2c2c2c));
  body.position.set(0, 0.16, -0.07); gunProp.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.38), mat(0x555555));
  barrel.position.set(0, 0.18, -0.37); gunProp.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.12), mat(0x1a1a1a));
  gunProp.add(grip);
}
gunProp.visible = false;

/** Apply equipped Stage 5 cosmetics (look / bonk prop / horn sound). */
export function applyCosmeticsToPlayer() {
  const look = equippedLook();
  applyPlayerLook(player, {
    body: look.body || 'man',
    skin: look.skin ?? COL.playerSkin,
    shirt: look.shirt ?? COL.player,
    pants: look.pants ?? COL.playerPants,
    hair: look.hair ?? 0xd8362b,
    shoes: look.shoes,
    cap: look.cap !== false,
  }, [batProp, hornProp, gunProp]);
  swapBonkProp(batProp, equippedBonk());
  holdInRightHand(player, batProp, 'bat');
  holdInRightHand(player, hornProp, 'horn', 0.55);
  holdInRightHand(player, gunProp, 'gun');
  setHornCosmetic(equippedHorn());
  batProp.visible = false;
  hornProp.visible = false;
  gunProp.visible = false;
}

export function initPlayer() {
  applyCosmeticsToPlayer();
}

export function makeHornModel() {
  const g = new THREE.Group();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0xe23b2f));
  bulb.position.set(-0.2, 0, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.13, 8), mat(0x1a1a1a));
  neck.rotation.z = Math.PI / 2;
  neck.position.set(-0.04, 0, 0);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.05, 0.3, 12), mat(0xffd24a));
  bell.rotation.z = Math.PI / 2;
  bell.position.set(0.18, 0, 0);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 6, 14), mat(0xffe27a));
  lip.rotation.y = Math.PI / 2;
  lip.position.set(0.33, 0, 0);
  g.add(bulb); g.add(neck); g.add(bell); g.add(lip);
  [bulb, neck, bell, lip].forEach((m) => { m.castShadow = true; });
  return g;
}

export const scareRing = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.5, 28),
  new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0, side: THREE.DoubleSide }),
);
scareRing.rotation.x = -Math.PI / 2;
scene.add(scareRing);
