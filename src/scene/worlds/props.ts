// Small scenery pieces shared by several levels. Everything here is plain-coloured geometry, so it merges
// into the shared vertex-colour buckets and adds no draw calls.
import * as THREE from 'three';
import { COL } from '../../config';
import { cmat } from '../../render/materials';

export const matPalm = cmat(COL.palm);
export const matTrunk = cmat(COL.trunk);

const FROND_GREENS = [0x2f7a4a, 0x3b8a52, 0x28683f];
const TRUNK_BROWNS = [0x8a5a32, 0x7a4e2a];

function add(g: THREE.Group, geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number): THREE.Mesh {
  const m = new THREE.Mesh(geo, cmat(color));
  m.position.set(x, y, z);
  g.add(m);
  return m;
}

// A palm: a slightly leaning ringed trunk and a crown of drooping fronds (each frond is two bent slabs).
export function addPalm(g: THREE.Group, x: number, z: number, height: number, rnd: () => number) {
  const lean = (rnd() - 0.5) * 0.25;
  const rings = 6;
  for (let r = 0; r < rings; r++) {
    const t = r / rings;
    const h = height / rings;
    const ring = add(g, new THREE.CylinderGeometry(0.1 - t * 0.03, 0.12 - t * 0.03, h * 1.05, 7), TRUNK_BROWNS[r % 2],
      x + lean * height * t * t, h * (r + 0.5), z);
    ring.rotation.z = -lean * t;
  }
  const topX = x + lean * height * (1 - 1 / rings) ** 2;
  const fronds = 8;
  for (let f = 0; f < fronds; f++) {
    const yaw = (f / fronds) * Math.PI * 2 + rnd() * 0.3;
    const color = FROND_GREENS[f % FROND_GREENS.length];
    const arm = new THREE.Group();
    const inner = add(arm, new THREE.BoxGeometry(0.34, 0.03, 0.8), color, 0, 0.12, 0.4);
    inner.rotation.x = -0.35;
    const outer = add(arm, new THREE.BoxGeometry(0.28, 0.03, 0.75), color, 0, 0.12, 1.05);
    outer.position.y = 0.06;
    outer.rotation.x = 0.55;
    arm.rotation.y = yaw;
    arm.position.set(topX, height, z);
    g.add(arm);
  }
  add(g, new THREE.SphereGeometry(0.16, 6, 5), 0x6b4423, topX, height - 0.05, z); // coconut cluster
}

// A wooden park bench facing +x (rotate it with rotY to face the other way).
export function addBench(g: THREE.Group, x: number, z: number, rotY: number) {
  const bench = new THREE.Group();
  add(bench, new THREE.BoxGeometry(0.5, 0.06, 1.5), 0xb98a52, 0, 0.48, 0);           // seat
  add(bench, new THREE.BoxGeometry(0.06, 0.5, 1.5), 0xb98a52, -0.22, 0.8, 0).rotation.z = 0.12; // back
  for (const zz of [-0.6, 0.6]) add(bench, new THREE.BoxGeometry(0.5, 0.46, 0.06), 0x30343a, 0, 0.23, zz); // legs
  bench.position.set(x, 0, z);
  bench.rotation.y = rotY;
  g.add(bench);
}

/** Rolling luggage — airport / station gag prop. */
export function addLuggage(g: THREE.Group, x: number, z: number, rotY: number, color = 0x2a5a8a) {
  const bag = new THREE.Group();
  add(bag, new THREE.BoxGeometry(0.55, 0.7, 0.38), color, 0, 0.45, 0);
  add(bag, new THREE.BoxGeometry(0.08, 0.35, 0.08), 0x1a1a1a, 0, 0.95, -0.05); // handle
  for (const [sx, sz] of [[-0.18, 0.12], [0.18, 0.12], [-0.18, -0.12], [0.18, -0.12]]) {
    const w = add(bag, new THREE.CylinderGeometry(0.06, 0.06, 0.08, 6), 0x222226, sx, 0.08, sz);
    w.rotation.z = Math.PI / 2;
  }
  bag.position.set(x, 0, z);
  bag.rotation.y = rotY;
  g.add(bag);
}

