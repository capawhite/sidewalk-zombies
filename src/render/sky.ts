// Sky backdrop: a big inside-out sphere instead of scene.background.
// scene.background is NOT tone mapped by the renderer but IS by the composer, which would make the sky
// look different per quality tier. A real mesh goes through the same tone mapping as everything else.
import * as THREE from 'three';
import { scene } from './renderer';

const skyMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.BackSide, fog: false, depthWrite: false });
const skyDome = new THREE.Mesh(new THREE.SphereGeometry(150, 12, 8), skyMaterial);
skyDome.renderOrder = -1000;
skyDome.frustumCulled = false;
scene.add(skyDome);

export function setSkyColor(hex: number) {
  skyMaterial.color.setHex(hex);
}
