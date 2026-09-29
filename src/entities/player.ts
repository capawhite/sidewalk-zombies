// The player character and the props it carries.
import * as THREE from 'three';
import { COL } from '../config';
import { mat } from '../render/materials';
import { scene } from '../render/renderer';
import { makePerson } from './person';

export const player: any = makePerson(COL.player, true);
player.position.set(0, 0, 6.5);
scene.add(player);
export function makeBatModel() {
  const g = new THREE.Group();
  const metal = mat(0xd8e2ea);
  const tape = mat(0x2a241c);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), tape);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.32, 8), tape);
  handle.position.y = 0.18;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.07, 0.36, 8), metal);
  shaft.position.y = 0.51;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.074, 0.52, 8), metal);
  barrel.position.y = 0.94;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.074, 8, 6), metal);
  cap.position.y = 1.19;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.045, 8), mat(0x3d8ec9));
  stripe.position.y = 0.76;
  g.add(knob); g.add(handle); g.add(shaft); g.add(barrel); g.add(cap); g.add(stripe);
  [knob, handle, shaft, barrel, cap, stripe].forEach((m) => { m.castShadow = true; });
  return g;
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
export const batProp = makeBatModel();
batProp.position.set(0.36, 0.7, 0.18);
batProp.rotation.set(-0.95, 0.2, -0.55);
player.add(batProp);
batProp.visible = false;
export const hornProp = makeHornModel();
hornProp.scale.setScalar(0.55);
hornProp.position.set(0.32, 1.28, 0.28);
hornProp.rotation.set(0.15, -0.4, 0.35);
player.add(hornProp);
hornProp.visible = false;
export const gunProp = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.42), mat(0x2c2c2c));
  body.position.set(0.22, 1.2, 0.35); gunProp.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.38), mat(0x555555));
  barrel.position.set(0.22, 1.22, 0.05); gunProp.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.12), mat(0x1a1a1a));
  grip.position.set(0.22, 1.04, 0.42); gunProp.add(grip);
}
player.add(gunProp);
gunProp.visible = false;
export const scareRing = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.5, 28),
  new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0, side: THREE.DoubleSide }),
);
scareRing.rotation.x = -Math.PI / 2;
scene.add(scareRing);