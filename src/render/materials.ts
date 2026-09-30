// Material helpers shared by every scene.
import * as THREE from 'three';
import { QUALITY } from './quality';

export interface PbrExtras {
  roughness?: number;
  metalness?: number;
  side?: THREE.Side;
  map?: THREE.Texture;
  normalMap?: THREE.Texture;
  normalScale?: THREE.Vector2;
}

// How strongly the environment map lights PBR materials. r160 has no scene.environmentIntensity,
// so every standard material carries its own value; setEnvIntensity() updates all of them at once.
let envIntensity = 0.5;
const allPbr = new Set<THREE.MeshStandardMaterial>();

// Every PBR material must be created through here so it follows the environment intensity.
export function pbr(params: THREE.MeshStandardMaterialParameters): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ roughness: 0.85, metalness: 0, envMapIntensity: envIntensity, ...params });
  allPbr.add(m);
  return m;
}

// A fresh (unshared) PBR material. Use this when the material will be modified per object.
export function mat(color: number, extras: PbrExtras = {}) {
  return pbr({ color, ...extras });
}

// Shared PBR material per colour, for static scenery that is never modified.
const cmCache = new Map<number, THREE.MeshStandardMaterial>();
export function cmat(hex: number) {
  let m = cmCache.get(hex);
  if (!m) { m = mat(hex); cmCache.set(hex, m); }
  return m;
}

export function setEnvIntensity(value: number) {
  envIntensity = value;
  allPbr.forEach((m) => { m.envMapIntensity = value; });
}

// Colour for unlit "light-emitting" things (neon, lamps, coins). With bloom on, the colour is pushed above 1.0
// so only these pass the bloom threshold; without bloom it stays a normal colour.
export function glowColor(hex: number, boost: number): THREE.Color {
  const c = new THREE.Color(hex);
  if (QUALITY.bloom) c.multiplyScalar(boost);
  return c;
}
