// Level 2: boardwalk street.
import * as THREE from 'three';
import { AISLE_W, BIKINIS, COL, SEG_LEN, SHELF_X } from '../../config';
import { glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';

const matSkyWin = new THREE.MeshBasicMaterial({ color: COL.window });
const matRoad = mat(COL.road, {
  roughness: 0.9,
  normalMap: grainNormal('coarse', (AISLE_W + 2) / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
const matWalk = mat(COL.walk, {
  roughness: 0.8,
  normalMap: grainNormal('fine', 4.6 / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
const matCurb = mat(COL.curb);
export const matTrunk = mat(COL.trunk);
export const matPalm = mat(COL.palm);
const matBuild = COL.stucco.map((c) => mat(c));
const matLamp = new THREE.MeshBasicMaterial({ color: glowColor(0xf4e4b8, 3) });
const matPole = mat(0x4a4e56);
export function makeStreetSegment(i: number): any {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 2, SEG_LEN), matRoad);
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true; g.add(road);
  [-1, 1].forEach((s) => {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(4.6, SEG_LEN), matWalk);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(s * (AISLE_W * 0.5 + 1.6), 0.01, 0);
    walk.receiveShadow = true; g.add(walk);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, SEG_LEN), matCurb);
    curb.position.set(s * (AISLE_W * 0.5 + 0.15), 0.06, 0); g.add(curb);
    const bcol = matBuild[(i + (s > 0 ? 2 : 0)) % matBuild.length];
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(3.4, 7.2, SEG_LEN - 1.2), bcol);
    bldg.position.set(s * (SHELF_X + 0.4), 3.6, 0);
    bldg.castShadow = true; bldg.receiveShadow = true; g.add(bldg);
    for (let r = 0; r < 3; r++) {
      for (let w = 0; w < 3; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.08), matSkyWin);
        win.position.set(s * (SHELF_X - 1.15), 1.4 + r * 1.85, -SEG_LEN / 2 + 4 + w * 4.2);
        g.add(win);
      }
    }
    const awn = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 3.2), mat(BIKINIS[(i + 2) % BIKINIS.length]));
    awn.position.set(s * (SHELF_X - 1.4), 2.55, -2 + (i % 2) * 4);
    awn.rotation.z = s * -0.18; g.add(awn);
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6), matPole);
    pole.position.y = 2.1; lamp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), matPole);
    arm.position.set(-s * 0.4, 4.15, 0); lamp.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), matLamp);
    bulb.position.set(-s * 0.75, 4.05, 0); lamp.add(bulb);
    lamp.position.set(s * (AISLE_W * 0.5 + 0.7), 0, -SEG_LEN / 2 + 5 + (i % 2) * 6);
    g.add(lamp);
    if (i % 2 === (s > 0 ? 0 : 1)) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.4, 6), matTrunk);
      trunk.position.set(s * (SHELF_X - 2.2), 1.2, 4); g.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 6), matPalm);
      leaves.scale.set(1.1, 0.45, 1.1);
      leaves.position.set(s * (SHELF_X - 2.2), 2.55, 4); g.add(leaves);
    }
  });
  for (let t = 0; t < 4; t++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.4), mat(0xe8e0c8));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.02, -SEG_LEN / 2 + 2.2 + t * 5);
    g.add(dash);
  }
  return g;
}