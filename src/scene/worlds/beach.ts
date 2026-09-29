// Level 4: beach.
import * as THREE from 'three';
import { AISLE_W, BIKINIS, SEG_LEN, SHELF_X } from '../../config';
import { mat } from '../../render/materials';
import { matPalm, matTrunk } from './street';

export function makeBeachSegment(i: number): any {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 14, SEG_LEN), mat(0xe8d4a4));
  sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; g.add(sand);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, SEG_LEN), mat(0xd2c08a));
  wet.rotation.x = -Math.PI / 2; wet.position.set(-AISLE_W * 0.45, 0.01, 0); g.add(wet);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(8, SEG_LEN), mat(0x3aa0c8));
  water.rotation.x = -Math.PI / 2; water.position.set(-AISLE_W * 0.5 - 4.4, -0.04, 0); g.add(water);
  [-1, 1].forEach((s) => {
    const umb = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), mat(0xf4f0e6));
    pole.position.y = 1.05; umb.add(pole);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.35, 8), mat(BIKINIS[(i + (s > 0 ? 2 : 0) + 3) % BIKINIS.length]));
    cap.position.y = 2.15; umb.add(cap);
    umb.position.set(s * (SHELF_X - 1.1), 0, -SEG_LEN / 2 + 4 + (i % 2) * 7);
    g.add(umb);
    if (i % 2 === 0) {
      const towel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 1.5), mat(BIKINIS[(i + (s > 0 ? 3 : 5)) % BIKINIS.length]));
      towel.position.set(s * 3.4, 0.03, 2); g.add(towel);
    }
  });
  if (i % 2 === 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 2.8, 6), matTrunk);
    trunk.position.set(SHELF_X - 1.6, 1.4, -3); g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.95, 8, 6), matPalm);
    leaves.scale.set(1.2, 0.4, 1.2);
    leaves.position.set(SHELF_X - 1.6, 2.9, -3); g.add(leaves);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat(BIKINIS[i % BIKINIS.length]));
  ball.position.set((i % 2 === 0 ? -2.6 : 2.2), 0.28, 1.5); g.add(ball);
  if (i % 3 === 0) {
    const boat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.55), mat(0xf4eee0));
    boat.position.set(-AISLE_W * 0.5 - 5.1, 0.08, 2); g.add(boat);
  }
  return g;
}