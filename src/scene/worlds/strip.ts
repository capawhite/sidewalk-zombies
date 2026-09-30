// The scrolling world as instanced meshes.
//
// The world is a ring of SEG_N segments that slide toward the camera and wrap around. Only a few distinct
// segments (variants) are ever built; segment k shows variant k % variants.length. Every merged mesh of a
// variant becomes ONE InstancedMesh with one instance per segment that uses it, so the whole world costs a
// handful of draw calls no matter how many segments it has. Scrolling only rewrites instance translations.
//
// Because the ring is walked in order, the pattern of variants along the road stays the same when a segment
// wraps from the front to the back (as long as SEG_N is a multiple of the variant count).
import * as THREE from 'three';
import { CAM_BACK_Z, SEG_LEN, SEG_N } from '../../config';

interface Layer {
  mesh: THREE.InstancedMesh;
  slots: number[]; // ring slot of each instance
}

export interface Strip {
  group: THREE.Group;
  fogFar: number; // segments entirely beyond this distance are hidden in fog, so they are not drawn
  layers: Layer[];
  z: number[]; // current z of every ring slot
}

const matrix = new THREE.Matrix4();

// `variants` are merged segments (see mergeStatic). Their meshes are reused, not cloned.
export function buildStrip(variants: THREE.Group[], fogFar: number): Strip {
  if (SEG_N % variants.length !== 0) throw new Error('SEG_N must be a multiple of the number of segment variants');
  const strip: Strip = { group: new THREE.Group(), fogFar, layers: [], z: [] };
  for (let k = 0; k < SEG_N; k++) strip.z.push(-k * SEG_LEN);
  variants.forEach((variant, v) => {
    const slots: number[] = [];
    for (let k = v; k < SEG_N; k += variants.length) slots.push(k);
    for (const src of variant.children as THREE.Mesh[]) {
      const mesh = new THREE.InstancedMesh(src.geometry, src.material, slots.length);
      mesh.castShadow = src.castShadow;
      mesh.receiveShadow = src.receiveShadow;
      mesh.frustumCulled = false; // the default bounds ignore the instances
      strip.group.add(mesh);
      strip.layers.push({ mesh, slots });
    }
  });
  writeMatrices(strip);
  return strip;
}

// A segment is skipped when its nearest edge is farther from the camera than the fog reaches.
function inView(strip: Strip, slot: number) {
  return strip.z[slot] + SEG_LEN / 2 > CAM_BACK_Z - strip.fogFar;
}

// Only segments in view are written (first) and drawn: InstancedMesh.count limits the draw.
function writeMatrices(strip: Strip) {
  for (const { mesh, slots } of strip.layers) {
    let n = 0;
    for (const slot of slots) {
      if (inView(strip, slot)) mesh.setMatrixAt(n++, matrix.makeTranslation(0, 0, strip.z[slot]));
    }
    mesh.count = n;
    mesh.instanceMatrix.needsUpdate = true;
  }
}

// Slide every segment toward the camera by dz, wrapping the far ones back to the start.
export function scrollStrip(strip: Strip, dz: number) {
  for (let k = 0; k < strip.z.length; k++) {
    strip.z[k] += dz;
    if (strip.z[k] > SEG_LEN) strip.z[k] -= SEG_N * SEG_LEN;
  }
  writeMatrices(strip);
}

export function disposeStrip(strip: Strip) {
  strip.group.removeFromParent();
  for (const { mesh } of strip.layers) {
    mesh.geometry.dispose(); // materials and textures are shared and stay alive
    mesh.dispose();
  }
}
