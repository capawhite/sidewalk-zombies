// Static-world batching: collapses a freshly built segment into a handful of merged meshes.
//
// How it works:
//  1. Every mesh with a plain colour material (no texture, no transparency) has its colour baked into a
//     per-vertex colour attribute. All of those can then share ONE vertex-colour material per type.
//  2. Meshes are grouped by (material, side, shadow flags) and their geometry is merged in segment space.
//  3. Optionally, vertical surfaces are darkened near the ground (baked contact shadow / ambient occlusion).
//     This only touches vertex colours, so it costs nothing at run time.
//
// Call it once on a segment right after building it. Nothing in a segment may animate individually
// afterwards: the whole segment scrolls as one group.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { pbr } from '../../render/materials';

// A "plain" material is just a colour: no texture, no transparency, no emission.
interface Plain {
  kind: 'standard' | 'basic';
  side: THREE.Side;
  roughness: number;
  metalness: number;
}

// One shared vertex-colour material per distinct Plain description. Never disposed: they live for the whole session.
const vertexMats = new Map<string, THREE.Material>();
function vertexColorMaterial(p: Plain): THREE.Material {
  const key = [p.kind, p.side, p.roughness, p.metalness].join(':');
  let m = vertexMats.get(key);
  if (!m) {
    m = p.kind === 'basic'
      ? new THREE.MeshBasicMaterial({ vertexColors: true, side: p.side })
      : pbr({ vertexColors: true, side: p.side, roughness: p.roughness, metalness: p.metalness });
    vertexMats.set(key, m);
  }
  return m;
}

function plainOf(m: THREE.Material): Plain | null {
  if (m.transparent || m.opacity < 1) return null;
  if ((m as THREE.MeshStandardMaterial).vertexColors) return null; // brings its own vertex colours
  if (m instanceof THREE.MeshBasicMaterial && !m.map) {
    return { kind: 'basic', side: m.side, roughness: 1, metalness: 0 };
  }
  if (m instanceof THREE.MeshStandardMaterial && !m.map && !m.normalMap && !m.roughnessMap && m.emissive.getHex() === 0) {
    return { kind: 'standard', side: m.side, roughness: m.roughness, metalness: m.metalness };
  }
  return null;
}

interface Bucket {
  material: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
  geos: THREE.BufferGeometry[];
}

export interface MergeOptions {
  // Vertical faces get darker toward y = 0: full strength at the floor, none at `height`.
  groundAO?: { height: number; strength: number };
}

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function applyGroundAO(geo: THREE.BufferGeometry, height: number, strength: number) {
  const pos = geo.getAttribute('position');
  const normal = geo.getAttribute('normal');
  const color = geo.getAttribute('color') as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    if (Math.abs(normal.getY(i)) > 0.5) continue; // floors, ceilings and shelf tops are not "walls"
    const k = 1 - strength * (1 - smoothstep(pos.getY(i) / height));
    color.setXYZ(i, color.getX(i) * k, color.getY(i) * k, color.getZ(i) * k);
  }
}

export function mergeStatic(segment: THREE.Group, options: MergeOptions = {}): THREE.Group {
  segment.updateMatrixWorld(true);
  const buckets = new Map<string, Bucket>();

  segment.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const src = obj.material as THREE.Material;
    const plain = plainOf(src);
    const material = plain ? vertexColorMaterial(plain) : src;
    const key = material.uuid + ':' + obj.castShadow + ':' + obj.receiveShadow;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, castShadow: obj.castShadow, receiveShadow: obj.receiveShadow, geos: [] };
      buckets.set(key, bucket);
    }

    let geo = obj.geometry.index ? obj.geometry.clone() : obj.geometry.toNonIndexed();
    // Keep only the attributes every merged geometry is guaranteed to share.
    const ownColors = !plain && (src as THREE.MeshStandardMaterial).vertexColors;
    for (const name of Object.keys(geo.attributes)) {
      if (name === 'position' || name === 'normal' || name === 'uv') continue;
      if (name === 'color' && ownColors) continue;
      geo.deleteAttribute(name);
    }
    if (ownColors && !geo.getAttribute('color')) {
      geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 3).fill(1), 3));
    }
    if (!geo.getAttribute('uv')) {
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
    }
    geo.applyMatrix4(obj.matrixWorld);
    if (plain) {
      const c = (src as THREE.MeshBasicMaterial).color;
      const count = geo.getAttribute('position').count;
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }
    if (options.groundAO && geo.getAttribute('color')) {
      applyGroundAO(geo, options.groundAO.height, options.groundAO.strength);
    }
    bucket.geos.push(geo);
    // The original per-mesh geometry is never rendered again.
    obj.geometry.dispose();
  });

  const out = new THREE.Group();
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    for (const g of b.geos) g.dispose();
    if (!merged) throw new Error('mergeStatic: geometry attributes did not match');
    const mesh = new THREE.Mesh(merged, b.material);
    mesh.castShadow = b.castShadow;
    mesh.receiveShadow = b.receiveShadow;
    out.add(mesh);
  }
  // The raw segment is never drawn; drop it so the per-mesh objects can be collected.
  segment.clear();
  return out;
}
