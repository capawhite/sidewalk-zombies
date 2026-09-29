// Material helpers shared by every scene.
import * as THREE from 'three';

export function mat(color: number, extras?: any) {
  return new THREE.MeshLambertMaterial({ color, ...extras });
}
const cmCache: any = {};
export function cmat(hex: number) { return cmCache[hex] || (cmCache[hex] = mat(hex)); }