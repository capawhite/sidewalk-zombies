// Image-based lighting: RoomEnvironment for interiors, small HDR sky panoramas for outdoors.
// The panoramas in public/env are CC0 (Poly Haven) shrunk with tools/downsample-hdri.mjs.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { QUALITY } from './quality';
import { renderer, scene } from './renderer';

export type EnvKind = 'room' | 'golden' | 'noon';

const HDR_FILES: Record<Exclude<EnvKind, 'room'>, string> = {
  golden: 'env/golden_hour.hdr',
  noon: 'env/noon_sky.hdr',
};

const pmrem = new THREE.PMREMGenerator(renderer);
const ready = new Map<EnvKind, THREE.Texture>();
let wanted: EnvKind = 'room';
const loading = new Set<EnvKind>();

function roomTexture(): THREE.Texture {
  let t = ready.get('room');
  if (!t) {
    t = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
    ready.set('room', t);
  }
  return t;
}

function loadHdr(kind: Exclude<EnvKind, 'room'>) {
  if (loading.has(kind)) return;
  loading.add(kind);
  new RGBELoader().load(import.meta.env.BASE_URL + HDR_FILES[kind], (hdr) => {
    hdr.mapping = THREE.EquirectangularReflectionMapping;
    ready.set(kind, pmrem.fromEquirectangular(hdr).texture);
    hdr.dispose();
    if (wanted === kind) scene.environment = ready.get(kind)!;
  });
}

// Selects the environment for the current world. Outdoor panoramas load in the background,
// so the room environment stands in until they arrive.
export function setEnvironment(kind: EnvKind) {
  wanted = kind;
  if (!QUALITY.envMap) { scene.environment = null; return; }
  const cached = ready.get(kind);
  if (cached) { scene.environment = cached; return; }
  scene.environment = roomTexture();
  if (kind !== 'room') loadHdr(kind);
}
