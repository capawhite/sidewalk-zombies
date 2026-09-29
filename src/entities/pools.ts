// Object pools for zombies, pickups, coins and bullets.
import * as THREE from 'three';
import { COL } from '../config';
import { mat } from '../render/materials';
import { scene } from '../render/renderer';
import { makeInfluencer, makePerson } from './person';
import { makeBatModel, makeHornModel } from './player';

export const pool: any[] = [];
export function getZombie(type: string): any {
  const inf = type === 'inf';
  for (const z of pool) if (!z.active && !!z.userData.inf === inf) return z;
  const g: any = inf ? makeInfluencer() : makePerson(COL.talk, false);
  g.active = false; scene.add(g); pool.push(g); return g;
}
// ---------- pickups ----------
export const pickPool: any[] = [];
function makePickupMesh() {
  const g: any = new THREE.Group();
  const bat = makeBatModel();
  bat.scale.setScalar(0.72);
  bat.position.y = 0.08;
  bat.rotation.set(0.15, 0.6, 0.22);
  const horn = makeHornModel();
  horn.position.y = 0.58;
  horn.rotation.y = 0.35;
  const gun = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.55), mat(0x3a3a3a));
  body.position.set(0, 0.62, 0); gun.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.45), mat(0x6a6a6a));
  barrel.position.set(0, 0.66, -0.35); gun.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.14), mat(0x1a1a1a));
  grip.position.set(0, 0.44, 0.16); gun.add(grip);
  const bomb = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0x2a2a2a));
  ball.position.y = 0.55; bomb.add(ball);
  const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), mat(0xff4466));
  fuse.position.y = 0.82; bomb.add(fuse);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0xffee66));
  spark.position.y = 0.94; bomb.add(spark);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 16), mat(0xffee88));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.08;
  g.add(bat); g.add(horn); g.add(gun); g.add(bomb); g.add(ring);
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 3.4, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.position.y = 1.7; g.add(beam); g.userData.beam = beam;
  g.userData.cartVis = bat; g.userData.hornVis = horn;
  g.userData.gunVis = gun; g.userData.bombVis = bomb; g.userData.ring = ring;
  return g;
}
export function getPickup(): any {
  for (const p of pickPool) if (!p.active) return p;
  const g: any = makePickupMesh();
  g.active = false; g.visible = false; scene.add(g); pickPool.push(g); return g;
}
export const coinPool: any[] = [];
const matCoin = new THREE.MeshBasicMaterial({ color: 0xf0c020 });
const matCoinIn = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
function makeCoinMesh() {
  const g: any = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 14), matCoin);
  disc.rotation.z = Math.PI / 2;
  disc.position.y = 0.7;
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), matCoinIn);
  inner.rotation.z = Math.PI / 2;
  inner.position.y = 0.7;
  g.add(disc); g.add(inner);
  return g;
}
export function getCoin(): any {
  for (const c of coinPool) if (!c.active) return c;
  const g: any = makeCoinMesh();
  g.active = false; g.visible = false; scene.add(g); coinPool.push(g); return g;
}
export const bullets: any[] = [];
const matBullet = new THREE.MeshBasicMaterial({ color: 0xffee66 });
const geoBullet = new THREE.SphereGeometry(0.09, 6, 6);
export function getBullet(): any {
  for (const b of bullets) if (!b.active) return b;
  const m: any = new THREE.Mesh(geoBullet, matBullet);
  m.active = false; m.visible = false; scene.add(m); bullets.push(m); return m;
}
export const PICK_COL: any = { cart: 0x7fd0ff, horn: 0xffd24a, gun: 0xff8a2a, bomb: 0xff4466 };