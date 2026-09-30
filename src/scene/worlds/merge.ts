// Static-world batching: collapses a freshly built segment into a handful of merged meshes.
//
// How it works:
//  1. Every mesh with a plain colour material (no texture, no transparency) has its colour baked into a
//     per-vertex colour attribute. All of those can then share ONE vertex-colour material per type.
//  2. Meshes are grouped by (material, side, shadow flags) and their geometry is merged in segment space.
//
// Call it once on a segment right after building it. Nothing in a segment may animate individually
// afterwards: the whole segment scrolls as one group.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type PlainKind = 'lambert' | 'basic';

// One shared vertex-colour material per (kind, side). Never disposed: they live for the whole session.
const vertexMats = new Map<string, THREE.Material>();
function vertexColorMaterial(kind: PlainKind, side: THREE.Side): THREE.Material {
  const key = kind + ':' + side;
  let m = vertexMats.get(key);
  if (!m) {
    m = kind === 'basic'
      ? new THREE.MeshBasicMaterial({ vertexColors: true, side })
      : new THREE.MeshLambertMaterial({ vertexColors: true, side });
    vertexMats.set(key, m);
  }
  return m;
}

// Returns the kind if this material is "just a colour" and can be baked into vertex colours.
function plainKind(m: THREE.Material): PlainKind | null {
  if (m.transparent || m.opacity < 1) return null;
  if (m instanceof THREE.MeshBasicMaterial && !m.map) return 'basic';
  if (m instanceof THREE.MeshLambertMaterial && !m.map && m.emissive.getHex() === 0) return 'lambert';
  return null;
}

interface Bucket {
  material: THREE.Material;
  castShadow: boolean;
  receiveShadow: boolean;
  geos: THREE.BufferGeometry[];
}

export function mergeStatic(segment: THREE.Group): THREE.Group {
  segment.updateMatrixWorld(true);
  const buckets = new Map<string, Bucket>();

  segment.traverse((obj) => {
    if (!(obj instanceof THREE.Mesh)) return;
    const src = obj.material as THREE.Material;
    const kind = plainKind(src);
    const material = kind ? vertexColorMaterial(kind, src.side) : src;
    const key = material.uuid + ':' + obj.castShadow + ':' + obj.receiveShadow;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { material, castShadow: obj.castShadow, receiveShadow: obj.receiveShadow, geos: [] };
      buckets.set(key, bucket);
    }

    let geo = obj.geometry.index ? obj.geometry.clone() : obj.geometry.toNonIndexed();
    // Keep only the attributes every merged geometry is guaranteed to share.
    for (const name of Object.keys(geo.attributes)) {
      if (name !== 'position' && name !== 'normal' && name !== 'uv') geo.deleteAttribute(name);
    }
    if (!geo.getAttribute('uv')) {
      geo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(geo.getAttribute('position').count * 2), 2));
    }
    geo.applyMatrix4(obj.matrixWorld);
    if (kind) {
      const c = (src as THREE.MeshBasicMaterial).color;
      const count = geo.getAttribute('position').count;
      const colors = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) { colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b; }
      geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
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
  return out;
}

// Frees GPU buffers for a removed segment. Materials and textures are shared, so they stay alive.
export function disposeSegment(segment: THREE.Object3D) {
  segment.traverse((obj) => {
    if (obj instanceof THREE.Mesh) obj.geometry.dispose();
  });
}
