// Beach seagulls.
import * as THREE from 'three';
import { mat } from '../render/materials';
import { scene } from '../render/renderer';
import { G } from '../state';

const matGull = mat(0xf7f7f4);
const matGullWing = mat(0xffffff);
function makeSeagull() {
  const g: any = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.16), matGull);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), mat(0xff9a3a));
  beak.position.set(0.28, 0.02, 0);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.9), matGullWing);
  g.add(body); g.add(beak); g.add(wing);
  g.userData.wing = wing;
  g.visible = false;
  scene.add(g);
  return g;
}
const seagulls = [0, 1, 2, 3].map((i) => {
  const g = makeSeagull();
  g.userData.phase = i * 1.7;
  g.userData.vx = 3.4 + i * 0.45;
  g.userData.zBase = -4 - i * 3.5;
  return g;
});
export function flapSeagulls(dt: number, now: number) {
  const on = G.worldLevel === 4;
  for (let i = 0; i < seagulls.length; i++) {
    const g = seagulls[i];
    g.visible = on;
    if (!on) continue;
    g.userData.phase += dt * g.userData.vx * 0.35;
    let x = -14 + ((g.userData.phase * 2.4) % 32);
    g.position.set(x, 3.4 + Math.sin(now * 0.003 + i) * 0.45, g.userData.zBase);
    g.userData.wing.rotation.z = Math.sin(now * 0.012 + i) * 0.55;
    g.rotation.y = 0.15;
  }
}