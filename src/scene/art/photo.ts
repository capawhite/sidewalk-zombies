// Tileable photographic albedos, painted into a canvas (no image files).
//
// Used as repeating floor/ground maps and as the base of atlas tiles so scenery reads as real material
// instead of a flat fill. Everything is deterministic per (kind, seed) so worlds stay stable across reloads.
import * as THREE from 'three';
import { QUALITY } from '../../render/quality';
import { renderer } from '../../render/renderer';

export type PhotoKind =
  | 'linoleum' | 'asphalt' | 'concrete' | 'sand' | 'terrazzo' | 'plaster' | 'wood' | 'cardboard' | 'metal';

function hash2(ix: number, iy: number, seed: number) {
  let n = Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + seed;
  n = (n ^ (n >>> 13)) >>> 0;
  n = Math.imul(n, 1274126177);
  return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
}

function wrap(i: number, n: number) {
  return ((i % n) + n) % n;
}

function valueNoise(x: number, y: number, period: number, seed: number) {
  const x0 = Math.floor(x), y0 = Math.floor(y);
  const fx = x - x0, fy = y - y0;
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
  const a = hash2(wrap(x0, period), wrap(y0, period), seed);
  const b = hash2(wrap(x0 + 1, period), wrap(y0, period), seed);
  const c = hash2(wrap(x0, period), wrap(y0 + 1, period), seed);
  const d = hash2(wrap(x0 + 1, period), wrap(y0 + 1, period), seed);
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy;
}

function fbm(x: number, y: number, period: number, seed: number, octaves = 4) {
  let s = 0, a = 0.5, f = 1, n = 0;
  for (let i = 0; i < octaves; i++) {
    s += a * valueNoise(x * f, y * f, period * f, seed + i * 19);
    n += a; a *= 0.5; f *= 2;
  }
  return s / n;
}

function rgb(r: number, g: number, b: number): [number, number, number] {
  return [
    Math.max(0, Math.min(255, r | 0)),
    Math.max(0, Math.min(255, g | 0)),
    Math.max(0, Math.min(255, b | 0)),
  ];
}

function sample(kind: PhotoKind, u: number, v: number, period: number, seed: number): [number, number, number] {
  const n = fbm(u, v, period, seed);
  const n2 = fbm(u * 2.1 + 3, v * 2.1, period, seed + 7);
  if (kind === 'linoleum') {
    const tile = ((Math.floor(u * 2) + Math.floor(v * 2)) & 1) ? 1 : 0.94;
    const speck = hash2((u * 40) | 0, (v * 40) | 0, seed) > 0.97 ? 18 : 0;
    return rgb((196 + n * 22) * tile + speck, (186 + n * 18) * tile + speck * 0.6, (168 + n2 * 16) * tile);
  }
  if (kind === 'asphalt') {
    const stone = n2 > 0.62 ? 28 : 0;
    return rgb(48 + n * 22 + stone, 50 + n * 20 + stone, 54 + n * 18 + stone);
  }
  if (kind === 'concrete') {
    const agg = n2 > 0.7 ? 16 : n2 < 0.28 ? -12 : 0;
    return rgb(168 + n * 28 + agg, 166 + n * 24 + agg, 160 + n * 20 + agg);
  }
  if (kind === 'sand') {
    const grain = hash2((u * 64) | 0, (v * 64) | 0, seed) * 22;
    return rgb(220 + n * 18 - grain, 196 + n * 16 - grain * 0.7, 148 + n2 * 14 - grain * 0.5);
  }
  if (kind === 'terrazzo') {
    const chip = hash2((u * 18) | 0, (v * 18) | 0, seed);
    const chipC = chip > 0.82 ? [210, 90, 70] : chip > 0.7 ? [90, 140, 160] : chip > 0.6 ? [200, 190, 160] : null;
    if (chipC) return rgb(chipC[0], chipC[1], chipC[2]);
    return rgb(236 + n * 10, 226 + n * 10, 204 + n2 * 8);
  }
  if (kind === 'plaster') {
    return rgb(232 + n * 16, 220 + n * 14, 204 + n2 * 12);
  }
  if (kind === 'wood') {
    const rings = Math.sin((u + n * 0.35) * 6.2) * 0.5 + 0.5;
    const grain = fbm(u * 14, v * 0.7, period, seed + 3, 3);
    const k = 0.72 + rings * 0.18 + grain * 0.1;
    return rgb(168 * k, 122 * k, 72 * k);
  }
  if (kind === 'cardboard') {
    const flute = 0.92 + 0.08 * Math.sin(v * 22);
    return rgb((198 + n * 16) * flute, (154 + n * 12) * flute, (96 + n2 * 10) * flute);
  }
  // metal
  const scratch = Math.abs(Math.sin(v * 18 + n * 4)) > 0.97 ? 30 : 0;
  return rgb(140 + n * 24 + scratch, 144 + n * 22 + scratch, 148 + n2 * 20 + scratch);
}

const PERIOD = 8;

export function paintPhoto(ctx: CanvasRenderingContext2D, w: number, h: number, kind: PhotoKind, seed = 1) {
  const img = ctx.createImageData(w, h);
  const data = img.data;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = sample(kind, (x / w) * PERIOD, (y / h) * PERIOD, PERIOD, seed);
      const i = (y * w + x) * 4;
      data[i] = r; data[i + 1] = g; data[i + 2] = b; data[i + 3] = 255;
    }
  }
  // putImageData ignores the current transform, so paint into a temp canvas and drawImage
  // (Atlas.add translates/clips to the tile; photoMap draws onto an untransformed canvas).
  const tmp = document.createElement('canvas');
  tmp.width = w; tmp.height = h;
  tmp.getContext('2d')!.putImageData(img, 0, 0);
  ctx.drawImage(tmp, 0, 0);
}

const baseMaps = new Map<string, THREE.CanvasTexture>();

// A repeating albedo. Clones share the pixels; only `repeat` differs.
export function photoMap(kind: PhotoKind, size: number, repeatX: number, repeatY: number, seed = 1): THREE.CanvasTexture {
  const key = kind + ':' + size + ':' + seed;
  let base = baseMaps.get(key);
  if (!base) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    paintPhoto(c.getContext('2d')!, size, size, kind, seed);
    base = new THREE.CanvasTexture(c);
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.generateMipmaps = true;
    base.minFilter = THREE.LinearMipmapLinearFilter;
    base.anisotropy = QUALITY.normalMaps ? Math.min(4, renderer.capabilities.getMaxAnisotropy()) : 1;
    baseMaps.set(key, base);
  }
  const t = base.clone();
  t.needsUpdate = true;
  t.repeat.set(repeatX, repeatY);
  return t;
}
