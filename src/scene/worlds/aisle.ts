// Level 1: supermarket aisle.
//
// Built from modules: a shelf "unit" (2.5 m of upright, four planks with price rails and stocked goods) repeated
// along both sides, plus category headers, a hanging sign and a few cardboard stacks. Everything textured comes
// from one atlas (art/aisleAtlas.ts) and is merged, so the whole scene is a couple of draw calls.
import * as THREE from 'three';
import { AISLE_W, COL, SEG_LEN, SHELF_X } from '../../config';
import { glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { HEADER_NAMES, PRODUCT_COUNT, aisleKit } from '../art/aisleAtlas';
import { photoMap } from '../art/photo';
import { Atlas, Face } from '../kit/atlas';
import { atlasBox, makeRng, shadedGround } from '../kit/parts';

const UNIT = 2.5;                 // metres of shelving per module
const UNITS = SEG_LEN / UNIT;
const WALL_X = SHELF_X - 1.3;     // x of the shelving wall's face toward the lane
const SHELF_DEPTH = 0.6;          // how far planks stick out of the wall
const FRONT_X = WALL_X - SHELF_DEPTH;
const ROWS = 4;
const ROW_Y0 = 0.38, ROW_STEP = 0.78;
const SHELF_TOP = 3.3;

const matFloor = mat(0xffffff, {
  map: photoMap('linoleum', 256, (AISLE_W + 10) / 2, SEG_LEN / 2, 7),
  roughness: 0.35,
  normalMap: grainNormal('fine', (AISLE_W + 10) / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
matFloor.vertexColors = true; // baked contact shadow along the shelves
const matGrout = mat(COL.grout);
const matCeil = mat(COL.ceil);
const matLight = new THREE.MeshBasicMaterial({ color: glowColor(COL.light, 2.5) });

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

export function makeAisleSegment(variant: number): THREE.Group {
  const { atlas, material } = aisleKit();
  const rnd = makeRng(4100 + variant * 131);
  const g = new THREE.Group();

  g.add(shadedGround(matFloor, AISLE_W + 10, SEG_LEN, (x) => 1 - 0.42 * smooth((Math.abs(x) - 3.7) / 1.2), 48));
  for (let t = 0; t < 4; t++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, 0.045), matGrout);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.012, -SEG_LEN / 2 + 2.4 + t * 5);
    g.add(line);
  }

  const plank = atlas.rect('plank'), rail = atlas.rect('priceRail'), upright = atlas.rect('upright');
  [-1, 1].forEach((s) => {
    const laneFace: Face = s < 0 ? 'px' : 'nx';
    // The wall behind the shelves (also what casts the shelf shadow).
    g.add(atlasBox(material, atlas.rect('panel'), 2.6, SHELF_TOP, SEG_LEN - 0.1, s * SHELF_X, SHELF_TOP / 2, 0,
      { bottom: 0.8, castShadow: true, receiveShadow: true }));
    g.add(atlasBox(material, atlas.rect('kick'), SHELF_DEPTH + 0.02, 0.34, SEG_LEN - 0.1, s * (WALL_X - SHELF_DEPTH / 2), 0.17, 0, { bottom: 0.55 }));

    for (let u = 0; u < UNITS; u++) {
      const zc = -SEG_LEN / 2 + UNIT * (u + 0.5);
      g.add(atlasBox(material, upright, 0.1, SHELF_TOP, 0.1, s * FRONT_X, SHELF_TOP / 2, zc - UNIT / 2 + 0.02, { bottom: 0.7 }));
      for (let r = 0; r < ROWS; r++) {
        const y = ROW_Y0 + r * ROW_STEP;
        g.add(atlasBox(material, plank, SHELF_DEPTH, 0.06, UNIT - 0.06, s * (WALL_X - SHELF_DEPTH / 2), y, zc, { omit: ['ny'] }));
        g.add(atlasBox(material, rail, 0.03, 0.15, UNIT - 0.06, s * FRONT_X, y + 0.04, zc, { omit: ['ny', 'py'] }));
        stockRow(g, atlas, material, rnd, s, laneFace, zc, y + 0.03, Math.min(0.66, SHELF_TOP - 0.05 - y - 0.03));
      }
    }
    // Category headers on top of the shelving, one per two modules.
    for (let h = 0; h < UNITS / 2; h++) {
      const name = (variant * 2 + h + (s > 0 ? 3 : 0)) % HEADER_NAMES.length;
      g.add(atlasBox(material, atlas.rect('hdr' + name), 0.12, 0.8, UNIT * 2 - 0.15, s * (FRONT_X + 0.06), SHELF_TOP + 0.4,
        -SEG_LEN / 2 + UNIT * (2 * h + 1), { faces: { [laneFace]: atlas.rect('hdr' + name) }, bottom: 0.85 }));
    }
    // A cardboard stack waiting to be shelved.
    if (variant > 0 && (variant + (s > 0 ? 1 : 0)) % 2 === 0) {
      const cb = atlas.rect('cardboard'), z0 = -SEG_LEN / 2 + 5 + rnd() * 8;
      g.add(atlasBox(material, cb, 0.5, 0.42, 0.62, s * (FRONT_X - 0.28), 0.21, z0, { bottom: 0.7 }));
      g.add(atlasBox(material, cb, 0.44, 0.36, 0.5, s * (FRONT_X - 0.27), 0.6, z0 + 0.04, { bottom: 0.85 }));
    }
  });

  if (variant === 0) { // hanging aisle sign
    const sign = atlas.rect('sign');
    g.add(atlasBox(material, sign, 3.4, 1.15, 0.08, 0, 8.2, 0, { faces: { pz: sign, nz: sign } }));
    for (const x of [-1.4, 1.4]) g.add(atlasBox(material, upright, 0.04, 8.4, 0.04, x, 12.3, 0));
  }

  const ceil = new THREE.Mesh(new THREE.BoxGeometry(AISLE_W + 12, 0.18, SEG_LEN), matCeil);
  ceil.position.y = 16.5; g.add(ceil);
  const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 8), matLight);
  fixture.position.set(0, 13.2, 0); g.add(fixture);
  return g;
}

// Fills one plank of one module with product boxes of varying width and height.
function stockRow(
  g: THREE.Group, atlas: Atlas, material: THREE.Material,
  rnd: () => number, s: number, laneFace: Face, zc: number, top: number, maxHeight: number,
) {
  const wallFace: Face = laneFace === 'px' ? 'nx' : 'px';
  const depth = SHELF_DEPTH - 0.1;
  const x = s * (FRONT_X + 0.05 + depth / 2);
  let z = zc - UNIT / 2 + 0.05;
  const end = zc + UNIT / 2 - 0.05;
  while (z < end - 0.3) {
    const w = Math.min(0.36 + rnd() * 0.24, end - z);
    const h = Math.min(0.34 + rnd() * 0.3, maxHeight);
    const p = Math.floor(rnd() * PRODUCT_COUNT);
    if (rnd() > 0.05) { // now and then a gap where something has been bought
      g.add(atlasBox(material, atlas.rect('side' + p), depth, h, w, x, top + h / 2, z + w / 2, {
        faces: { [laneFace]: atlas.rect('prod' + p) },
        omit: ['ny', wallFace],
        bottom: 0.72,
      }));
    }
    z += w + 0.025;
  }
}
