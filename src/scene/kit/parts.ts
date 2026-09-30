// Small building blocks shared by the scene generators.
import * as THREE from 'three';
import { Face, Rect, mapBoxUv, mapUv } from './atlas';

// Tiny seeded random generator. World building must NOT use the game's rand() (util.ts): the replay test
// depends on the order of those calls, and scenery is built while the game is running.
export function makeRng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Writes a per-vertex colour that goes from `bottom` (at the geometry's lowest point) to 1 at the top,
// multiplied by an optional tint. It is baked ambient occlusion: the base of an object is darker.
export function shade(geo: THREE.BufferGeometry, bottom: number, tint: THREE.ColorRepresentation = 0xffffff): THREE.BufferGeometry {
  geo.computeBoundingBox();
  const { min, max } = geo.boundingBox!;
  const pos = geo.getAttribute('position');
  const c = new THREE.Color(tint);
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const t = max.y > min.y ? (pos.getY(i) - min.y) / (max.y - min.y) : 1;
    const k = bottom + (1 - bottom) * t;
    colors[i * 3] = c.r * k; colors[i * 3 + 1] = c.g * k; colors[i * 3 + 2] = c.b * k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}

export interface BoxOptions {
  faces?: Partial<Record<Face, Rect>>;
  omit?: Face[];   // faces nobody can see (bottom, back): dropped to save triangles
  bottom?: number; // base darkening, see shade()
  tint?: THREE.ColorRepresentation;
  castShadow?: boolean;
  receiveShadow?: boolean;
}

// Removes faces from an indexed BoxGeometry by leaving their triangles out of the index buffer.
function dropFaces(geo: THREE.BoxGeometry, faces: Face[]) {
  const order: Face[] = ['px', 'nx', 'py', 'ny', 'pz', 'nz'];
  const index = geo.getIndex()!;
  const kept: number[] = [];
  order.forEach((face, f) => {
    if (faces.includes(face)) return;
    for (let i = f * 6; i < f * 6 + 6; i++) kept.push(index.getX(i));
  });
  geo.setIndex(kept);
}

// An atlas-textured box centred at (x, y, z). `fallback` covers faces that have no rectangle of their own.
export function atlasBox(
  material: THREE.Material, fallback: Rect,
  w: number, h: number, d: number, x: number, y: number, z: number, opts: BoxOptions = {},
): THREE.Mesh {
  const geo = mapBoxUv(new THREE.BoxGeometry(w, h, d), fallback, opts.faces);
  shade(geo, opts.bottom ?? 1, opts.tint);
  if (opts.omit) dropFaces(geo, opts.omit);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.castShadow = opts.castShadow ?? false;
  mesh.receiveShadow = opts.receiveShadow ?? false;
  return mesh;
}

// An atlas-textured plane. By default it faces +z; rotate it with rotY.
export function atlasPlane(
  material: THREE.Material, rect: Rect, w: number, h: number,
  x: number, y: number, z: number, rotY = 0, bottom = 1,
): THREE.Mesh {
  const geo = mapUv(new THREE.PlaneGeometry(w, h), rect);
  shade(geo, bottom);
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(x, y, z);
  mesh.rotation.y = rotY;
  return mesh;
}

// A ground plane with a per-vertex colour that fades toward the edges (baked contact shadow next to walls).
// `edgeShade(x)` returns the brightness (0..1) at a given local x.
export function shadedGround(
  material: THREE.Material, width: number, length: number, edgeShade: (x: number) => number, steps = 24,
): THREE.Mesh {
  const geo = new THREE.PlaneGeometry(width, length, steps, 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.getAttribute('position');
  const colors = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const k = edgeShade(pos.getX(i));
    colors[i * 3] = colors[i * 3 + 1] = colors[i * 3 + 2] = k;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const mesh = new THREE.Mesh(geo, material);
  mesh.receiveShadow = true;
  return mesh;
}
