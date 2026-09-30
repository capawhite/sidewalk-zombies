// Things every character has, drawn as one instanced mesh each: blob shadows and phones.
// That is two draw calls for the whole crowd instead of two per person.
import * as THREE from 'three';
import { COL } from '../config';
import { scene } from '../render/renderer';
import { phoneMatrix } from './person';
import { player } from './player';
import { pool } from './pools';

const MAX_INSTANCES = 64;

const blobGeometry = new THREE.CircleGeometry(0.3, 12);
blobGeometry.rotateX(-Math.PI / 2); // lie flat on the ground
const blobs = new THREE.InstancedMesh(
  blobGeometry, new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 }), MAX_INSTANCES,
);
const phones = new THREE.InstancedMesh(new THREE.BoxGeometry(0.09, 0.17, 0.018), new THREE.MeshBasicMaterial({ color: COL.phone }), MAX_INSTANCES);
for (const mesh of [blobs, phones]) {
  mesh.frustumCulled = false; // instances are spread over the whole scene; the default bounds would cull them
  mesh.count = 0;
  scene.add(mesh);
}

const m = new THREE.Matrix4(), scale = new THREE.Vector3();
const position = new THREE.Vector3(), identity = new THREE.Quaternion();

// Call once per frame after the simulation step and before rendering.
export function syncCrowdProps() {
  let nBlobs = 0, nPhones = 0;
  const add = (z: any) => {
    // The shadow stays on the ground and shrinks a little while the character is airborne.
    const s = Math.max(0.4, 1 - z.position.y * 0.25);
    m.compose(position.set(z.position.x, 0.02, z.position.z), identity, scale.setScalar(s));
    blobs.setMatrixAt(nBlobs++, m);
    if (z.userData.phone.visible && nPhones < MAX_INSTANCES && phoneMatrix(z, m)) phones.setMatrixAt(nPhones++, m);
  };
  add(player);
  for (const z of pool) if (z.active && z.visible && nBlobs < MAX_INSTANCES) add(z);
  blobs.count = nBlobs; blobs.instanceMatrix.needsUpdate = true;
  phones.count = nPhones; phones.instanceMatrix.needsUpdate = true;
}
