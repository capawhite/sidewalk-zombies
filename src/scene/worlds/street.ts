// Level 2: boardwalk street.
//
// A road with lane dashes, curbs, a plank boardwalk and, on both sides, a row of shop fronts. Each shop front is a
// 5 m module textured from the street atlas (art/streetAtlas.ts), with a striped awning over the shop window.
import * as THREE from 'three';
import { AISLE_W, COL, SEG_LEN } from '../../config';
import { glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { AWNING_COUNT, BOARDWALK_W, FACADE_COUNT, FACADE_H, FACADE_W, streetKit } from '../art/streetAtlas';
import { Face } from '../kit/atlas';
import { atlasBox, makeRng, shadedGround } from '../kit/parts';
import { addBench, addPalm } from './props';

const FACADE_X = 6.2;                    // where the shop fronts meet the boardwalk
const CURB_X = AISLE_W * 0.5 + 0.15;
const BOARDWALK_X = CURB_X + 0.1 + BOARDWALK_W / 2;
const BAYS = SEG_LEN / FACADE_W;

const matRoad = mat(COL.road, {
  roughness: 0.9,
  normalMap: grainNormal('coarse', (AISLE_W + 2) / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
const matCurb = mat(COL.curb);
const matLamp = new THREE.MeshBasicMaterial({ color: glowColor(0xf4e4b8, 3) });
const matPole = mat(0x4a4e56);
const matBulb = new THREE.MeshBasicMaterial({ color: glowColor(0xffd9a0, 3.5) });
const matDash = mat(0xe8e0c8);

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

export function makeStreetSegment(variant: number): THREE.Group {
  const { atlas, material, boards } = streetKit();
  const rnd = makeRng(2200 + variant * 97);
  const g = new THREE.Group();

  const road = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 2, SEG_LEN), matRoad);
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true; g.add(road);
  for (let t = 0; t < 4; t++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.4), matDash);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.02, -SEG_LEN / 2 + 2.2 + t * 5);
    g.add(dash);
  }

  [-1, 1].forEach((s) => {
    const laneFace: Face = s < 0 ? 'px' : 'nx';
    // Boardwalk planks, darker where they meet the wall.
    const walk = shadedGround(boards, BOARDWALK_W, SEG_LEN, (x) => 1 - 0.4 * smooth((s * x + 0.1) / 0.5), 8);
    walk.position.set(s * BOARDWALK_X, 0.01, 0);
    g.add(walk);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, SEG_LEN), matCurb);
    curb.position.set(s * CURB_X, 0.06, 0); g.add(curb);

    for (let b = 0; b < BAYS; b++) {
      const zc = -SEG_LEN / 2 + FACADE_W * (b + 0.5);
      const shop = (variant * BAYS + b + (s > 0 ? 2 : 0)) % FACADE_COUNT;
      const facade = atlas.rect('facade' + shop);
      g.add(atlasBox(material, atlas.rect('flat'), 3.4, FACADE_H, FACADE_W - 0.02, s * (FACADE_X + 1.7), FACADE_H / 2, zc, {
        faces: { [laneFace]: facade }, bottom: 0.85, castShadow: true, receiveShadow: true,
      }));
      // Awning over the shop window (the window sits 0.6 m off the bay's centre, mirrored on the two sides).
      const awning = atlas.rect('awning' + ((shop + variant) % AWNING_COUNT));
      const a = atlasBox(material, atlas.rect('flat'), 1.15, 0.16, 3.3, s * (FACADE_X - 0.55), 2.55, zc - s * 0.6, {
        faces: { py: awning, [laneFace]: awning }, omit: ['ny'], castShadow: true,
      });
      a.rotation.z = s * 0.22;
      g.add(a);
    }

    // Street lamp on the curb side of the boardwalk.
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6), matPole);
    pole.position.y = 2.1; lamp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), matPole);
    arm.position.set(-s * 0.4, 4.15, 0); arm.rotation.y = Math.PI / 2; lamp.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), matLamp);
    bulb.position.set(-s * 0.75, 4.05, 0); lamp.add(bulb);
    lamp.position.set(s * (CURB_X + 0.35), 0, -SEG_LEN / 2 + 5 + (variant % 2) * 6);
    g.add(lamp);

    // Palms and benches alternate along the boardwalk.
    if (variant === (s > 0 ? 0 : 1)) addPalm(g, s * (CURB_X + 0.75), 4, 2.8 + rnd() * 0.5, rnd);
    if (variant === 2) addBench(g, s * (CURB_X + 0.75), -3 + s * 2, s > 0 ? Math.PI : 0);
  });

  if (variant === 1) stringLights(g);
  return g;
}

// A sagging line of warm bulbs across the street between the two rows of shops.
function stringLights(g: THREE.Group) {
  const span = FACADE_X - 0.4, n = 9, y0 = 5.9, sag = 0.45;
  const points: THREE.Vector2[] = [];
  for (let k = 0; k <= n; k++) {
    const t = k / n;
    points.push(new THREE.Vector2(-span + 2 * span * t, y0 - sag * Math.sin(Math.PI * t)));
  }
  points.forEach((p) => {
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 6, 4), matBulb);
    bulb.position.set(p.x, p.y - 0.1, 0);
    g.add(bulb);
  });
  for (let k = 0; k < n; k++) {
    const a = points[k], b = points[k + 1];
    const wire = new THREE.Mesh(new THREE.BoxGeometry(a.distanceTo(b), 0.02, 0.02), matPole);
    wire.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, 0);
    wire.rotation.z = Math.atan2(b.y - a.y, b.x - a.x);
    g.add(wire);
  }
}
