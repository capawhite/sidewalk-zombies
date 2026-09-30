// Level 1: supermarket aisle.
import * as THREE from 'three';
import { AISLE_W, COL, SEG_LEN, SHELF_X } from '../../config';
import { glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';

const matFloor = mat(COL.floor, {
  roughness: 0.35,
  normalMap: grainNormal('fine', (AISLE_W + 10) / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
const matGrout = mat(COL.grout);
const matShelf = mat(COL.shelf);
const matMetal = mat(COL.shelfMetal, { roughness: 0.35, metalness: 0.6 });
const matCeil = mat(COL.ceil);
const matLight = new THREE.MeshBasicMaterial({ color: glowColor(COL.light, 2.5) });
const goodsMats = COL.goods.map((c) => mat(c));
export function makeAisleSegment(i: number): any {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, SEG_LEN), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  for (let t = 0; t < 4; t++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, 0.045), matGrout);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.012, -SEG_LEN / 2 + 2.4 + t * 5);
    g.add(line);
  }
  [-1, 1].forEach((s) => {
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.3, SEG_LEN - 0.2), matShelf);
    back.position.set(s * SHELF_X, 1.65, 0);
    back.castShadow = true; back.receiveShadow = true; g.add(back);
    for (let r = 0; r < 4; r++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, SEG_LEN - 0.3), matMetal);
      plank.position.set(s * (SHELF_X - 1.15), 0.38 + r * 0.78, 0);
      g.add(plank);
      for (let p = 0; p < 4; p++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.42, 1.35),
          goodsMats[(i + r + p + (s > 0 ? 3 : 0)) % goodsMats.length],
        );
        box.position.set(s * (SHELF_X - 1.2), 0.64 + r * 0.78, -SEG_LEN / 2 + 2.6 + p * 5);
        box.castShadow = true; g.add(box);
      }
    }
  });
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(AISLE_W + 12, 0.18, SEG_LEN), matCeil);
  ceil.position.y = 16.5; g.add(ceil);
  const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 8), matLight);
  fixture.position.set(0, 13.2, 0); g.add(fixture);
  return g;
}