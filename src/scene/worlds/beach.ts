// Level 4: beach.
//
// Sand and water keep their own materials (grain, gloss). Umbrellas, towels, the boat and the cooler
// are textured from one atlas (art/beachAtlas.ts). Palms and benches come from props.ts.
import * as THREE from 'three';
import { AISLE_W, BIKINIS, SEG_LEN, SHELF_X } from '../../config';
import { mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { photoMap } from '../art/photo';
import { mapUv } from '../kit/atlas';
import { TOWEL_COUNT, beachKit } from '../art/beachAtlas';
import { atlasBox, makeRng, shade } from '../kit/parts';
import { addPalm } from './props';

const matSand = mat(0xffffff, {
  map: photoMap('sand', 256, (AISLE_W + 14) / 2.5, SEG_LEN / 2.5, 6),
  roughness: 1,
  normalMap: grainNormal('coarse', (AISLE_W + 14) / 1.2, SEG_LEN / 1.2),
  normalScale: SUBTLE_NORMAL,
});
const matWet = mat(0xd8c48a, { roughness: 0.45 });
const matWater = mat(0x2fb8c9, { roughness: 0.12, metalness: 0.05 });

export function makeBeachSegment(variant: number): THREE.Group {
  const { atlas, material } = beachKit();
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 14, SEG_LEN), matSand);
  sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; g.add(sand);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, SEG_LEN), matWet);
  wet.rotation.x = -Math.PI / 2; wet.position.set(-AISLE_W * 0.45, 0.01, 0); g.add(wet);
  // A shallow slab, not a plane, so the water has a visible teal edge against the sand.
  const water = new THREE.Mesh(new THREE.BoxGeometry(8, 0.18, SEG_LEN), matWater);
  water.position.set(-AISLE_W * 0.5 - 4.4, -0.12, 0); g.add(water);
  const foam = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.04, SEG_LEN), mat(0xf4f0e6));
  foam.position.set(-AISLE_W * 0.5 - 0.45, 0.02, 0); g.add(foam);

  [-1, 1].forEach((s) => {
    const ui = (variant + (s > 0 ? 2 : 0) + 3) % BIKINIS.length;
    const umb = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), mat(0xf4f0e6));
    pole.position.y = 1.05; umb.add(pole);
    const cap = new THREE.Mesh(shade(mapUv(new THREE.ConeGeometry(1.15, 0.38, 8), atlas.rect('umbSide' + ui)), 0.85), material);
    cap.position.y = 2.15; cap.castShadow = true; umb.add(cap);
    umb.position.set(s * (SHELF_X - 1.1), 0, -SEG_LEN / 2 + 4 + (variant % 2) * 7);
    g.add(umb);
    if (variant % 2 === 0) {
      const ti = (variant + (s > 0 ? 3 : 5)) % TOWEL_COUNT;
      g.add(atlasBox(material, atlas.rect('towel' + ti), 0.7, 0.04, 1.5, s * 3.4, 0.03, 2, { omit: ['ny'] }));
    }
  });

  if (variant % 2 === 1) {
    addPalm(g, SHELF_X - 1.6, -3, 2.9, makeRng(44 + variant));
  }

  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat(BIKINIS[variant % BIKINIS.length]));
  ball.position.set((variant % 2 === 0 ? -2.6 : 2.2), 0.28, 1.5); g.add(ball);

  if (variant % 3 === 0) {
    g.add(atlasBox(material, atlas.rect('wood'), 1.6, 0.22, 0.55, -AISLE_W * 0.5 - 5.1, 0.08, 2, { bottom: 0.7 }));
  }

  // Lounge chair and cooler sit on the sand outside the playable lane.
  if (variant === 1) {
    const chairX = SHELF_X - 1.4;
    g.add(atlasBox(material, atlas.rect('wood'), 0.55, 0.06, 1.4, chairX, 0.22, -6, { omit: ['ny'] }));
    const back = atlasBox(material, atlas.rect('wood'), 0.55, 0.06, 0.7, chairX, 0.48, -5.45, { omit: ['ny'] });
    back.rotation.x = -0.7; g.add(back);
    g.add(atlasBox(material, atlas.rect('cooler'), 0.42, 0.38, 0.55, chairX + 0.7, 0.2, -6.1, { bottom: 0.75 }));
  }
  return g;
}
