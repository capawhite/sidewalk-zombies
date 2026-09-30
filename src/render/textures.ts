// Small procedural textures (generated once, no image files): subtle normal maps for floors and sand.
import * as THREE from 'three';
import { QUALITY } from './quality';

const TEXTURE_SIZE = 128;
const base = new Map<string, THREE.Texture>();

// Tileable fine-grain height field -> normal map. Wrapping neighbours keeps the tile seamless.
function makeGrainNormal(seed: number, blurPasses: number, strength: number): THREE.Texture {
  const n = TEXTURE_SIZE;
  let a = seed >>> 0;
  const rnd = () => { // small deterministic PRNG so the grain looks the same every run
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  let height = new Float32Array(n * n);
  for (let i = 0; i < height.length; i++) height[i] = rnd();
  for (let p = 0; p < blurPasses; p++) {
    const next = new Float32Array(n * n);
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        let sum = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) sum += height[((y + dy + n) % n) * n + ((x + dx + n) % n)];
        }
        next[y * n + x] = sum / 9;
      }
    }
    height = next;
  }
  const data = new Uint8Array(n * n * 4);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      const dx = height[y * n + ((x + 1) % n)] - height[y * n + ((x - 1 + n) % n)];
      const dy = height[((y + 1) % n) * n + x] - height[((y - 1 + n) % n) * n + x];
      const nx = -dx * strength, ny = -dy * strength, nz = 1;
      const len = Math.hypot(nx, ny, nz);
      const i = (y * n + x) * 4;
      data[i] = ((nx / len) * 0.5 + 0.5) * 255;
      data[i + 1] = ((ny / len) * 0.5 + 0.5) * 255;
      data[i + 2] = ((nz / len) * 0.5 + 0.5) * 255;
      data[i + 3] = 255;
    }
  }
  const tex = new THREE.DataTexture(data, n, n, THREE.RGBAFormat);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

export type GrainKind = 'fine' | 'coarse';

// A normal map repeated repeatX x repeatY times over a surface, or undefined when the tier skips normal maps.
// Textures share one image per kind; only the repeat differs.
export function grainNormal(kind: GrainKind, repeatX: number, repeatY: number): THREE.Texture | undefined {
  if (!QUALITY.normalMaps) return undefined;
  let tex = base.get(kind);
  if (!tex) {
    tex = kind === 'fine' ? makeGrainNormal(11, 1, 24) : makeGrainNormal(29, 2, 60);
    base.set(kind, tex);
  }
  const t = tex.clone();
  t.needsUpdate = true;
  t.repeat.set(repeatX, repeatY);
  return t;
}

// Normal map strength that reads as "subtle": most surfaces should barely notice it.
export const SUBTLE_NORMAL = new THREE.Vector2(0.35, 0.35);
