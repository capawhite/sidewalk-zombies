// Level 5: parking garage.
//
// A drive aisle with painted stalls, pillars, parked cars and overhead fluorescents. Signs and stall
// marks come from one atlas (art/garageAtlas.ts); cars and structure are plain-coloured so they merge.
import * as THREE from 'three';
import { AISLE_W, SEG_LEN } from '../../config';
import { cmat, glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { garageKit } from '../art/garageAtlas';
import { photoMap } from '../art/photo';
import { Face } from '../kit/atlas';
import { atlasBox, atlasPlane, makeRng, shadedGround } from '../kit/parts';

const STALL_X = 5.6;
const PILLAR_X = 4.7;
const CAR_X = 6.55;
const CEIL_Y = 9.2;

const matFloor = mat(0xffffff, {
  map: photoMap('concrete', 256, (AISLE_W + 12) / 3, SEG_LEN / 3, 18),
  roughness: 0.85,
  normalMap: grainNormal('coarse', (AISLE_W + 12) / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
matFloor.vertexColors = true;
const matCeil = mat(0xb8b4aa, { roughness: 0.9 });
const matLight = new THREE.MeshBasicMaterial({ color: glowColor(0xfff1c8, 2.8) });

const CARS = [0xe8e4dc, 0x3a3e46, 0xc94a56, 0x3d7ea6, 0x2a3140, 0xd4c4a0];

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

function addCar(g: THREE.Group, x: number, z: number, rotY: number, color: number) {
  const car = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.48, 4.1), cmat(color));
  body.position.y = 0.42; car.add(body);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.55, 0.42, 2.1), cmat(color));
  cabin.position.set(0, 0.84, -0.15); car.add(cabin);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(1.46, 0.34, 1.95), cmat(0x6a8494));
  glass.position.set(0, 0.86, -0.15); car.add(glass);
  for (const [sx, sz] of [[-0.72, 1.25], [0.72, 1.25], [-0.72, -1.35], [0.72, -1.35]]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.22, 8), cmat(0x1a1a1a));
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(sx, 0.28, sz);
    car.add(wheel);
  }
  const lampL = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.12, 0.08), cmat(0xf4f0e6));
  lampL.position.set(-0.55, 0.48, 2.08); car.add(lampL);
  const lampR = lampL.clone(); lampR.position.x = 0.55; car.add(lampR);
  car.position.set(x, 0, z);
  car.rotation.y = rotY;
  g.add(car);
}

export function makeGarageSegment(variant: number): THREE.Group {
  const { atlas, material } = garageKit();
  const rnd = makeRng(8100 + variant * 113);
  const g = new THREE.Group();

  g.add(shadedGround(matFloor, AISLE_W + 12, SEG_LEN, (x) => 1 - 0.38 * smooth((Math.abs(x) - 3.6) / 1.3), 48));

  const ceil = new THREE.Mesh(new THREE.BoxGeometry(AISLE_W + 12, 0.18, SEG_LEN), matCeil);
  ceil.position.y = CEIL_Y; g.add(ceil);

  for (let t = 0; t < 3; t++) {
    const tube = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.08, 5.2), matLight);
    tube.position.set(-2.2 + t * 2.2, CEIL_Y - 0.55, -SEG_LEN / 2 + 5 + (variant % 2) * 4);
    g.add(tube);
    const housing = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.06, 5.4), cmat(0x8a8880));
    housing.position.set(-2.2 + t * 2.2, CEIL_Y - 0.48, -SEG_LEN / 2 + 5 + (variant % 2) * 4);
    g.add(housing);
  }

  [-1, 1].forEach((s) => {
    const laneFace: Face = s < 0 ? 'px' : 'nx';
    g.add(atlasBox(material, atlas.rect('wall'), 2.4, CEIL_Y, SEG_LEN - 0.08, s * (STALL_X + 2.15), CEIL_Y / 2, 0, {
      bottom: 0.75, castShadow: true, receiveShadow: true,
    }));

    // Stall marks and a bumper at the back of each bay.
    for (let b = 0; b < 4; b++) {
      const zc = -SEG_LEN / 2 + 2.5 + b * 5;
      g.add(atlasBox(material, atlas.rect('stripe'), 1.7, 0.02, 0.08, s * STALL_X, 0.015, zc - 2.2, { omit: ['ny'] }));
      g.add(atlasBox(material, atlas.rect('stripe'), 1.7, 0.02, 0.08, s * STALL_X, 0.015, zc + 2.2, { omit: ['ny'] }));
      g.add(atlasBox(material, atlas.rect('bumper'), 0.12, 0.18, 1.6, s * (STALL_X + 0.95), 0.1, zc, {
        faces: { [laneFace]: atlas.rect('bumper') },
      }));
      addCar(g, s * CAR_X, zc + (rnd() - 0.5) * 0.4, s > 0 ? 0 : Math.PI, CARS[(variant * 4 + b + (s > 0 ? 2 : 0)) % CARS.length]);
    }

    // Pillars between bays.
    for (let p = 0; p < 3; p++) {
      const zc = -SEG_LEN / 2 + 5 + p * 5;
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.42, CEIL_Y, 0.42), cmat(0xc4c0b6));
      pillar.position.set(s * PILLAR_X, CEIL_Y / 2, zc);
      pillar.castShadow = true;
      g.add(pillar);
      g.add(atlasBox(material, atlas.rect('bumper'), 0.48, 0.22, 0.48, s * PILLAR_X, 0.14, zc));
    }

    if (variant === 0) {
      g.add(atlasPlane(material, atlas.rect('signP2'), 2.4, 1.15, s * (STALL_X + 0.92), 2.15, -4, -s * Math.PI / 2));
    }
    if (variant === 1) {
      g.add(atlasPlane(material, atlas.rect('signExit'), 2.2, 0.7, s * (STALL_X + 0.92), 2.4, 3, -s * Math.PI / 2));
    }
  });

  // Floor arrows pointing toward the camera so the drive aisle reads.
  for (let a = 0; a < 2; a++) {
    const zc = -SEG_LEN / 2 + 6 + a * 8;
    const arrow = atlasBox(material, atlas.rect('arrow'), 0.7, 0.02, 1.1, (variant % 2 ? -1 : 1) * 1.6, 0.02, zc, { omit: ['ny'] });
    g.add(arrow);
  }

  if (variant === 2) {
    const booth = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.5, 0.7), cmat(0x4a4e46));
    booth.position.set(-STALL_X, 0.75, 1.2); g.add(booth);
    g.add(atlasPlane(material, atlas.rect('pay'), 0.85, 0.58, -STALL_X + 0.46, 1.15, 1.2, Math.PI / 2));
  }

  return g;
}
