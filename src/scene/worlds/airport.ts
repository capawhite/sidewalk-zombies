// Level 7: airport departures hall (endless finale).
//
// Polished floors, glass curtain walls, check-in counters, departure boards, and abandoned luggage.
// Crowd joke: scooters, navigators, and people who stopped dead under the gate screens.
import * as THREE from 'three';
import { AISLE_W, SEG_LEN } from '../../config';
import { cmat, glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { photoMap } from '../art/photo';
import { makeRng, shadedGround } from '../kit/parts';
import { addLuggage } from './props';

const HALL_W = AISLE_W + 10;
const CEIL_Y = 7.2;

const matFloor = mat(0xffffff, {
  map: photoMap('plaster', 256, HALL_W / 4, SEG_LEN / 4, 55),
  roughness: 0.35,
  normalMap: grainNormal('fine', HALL_W / 2, SEG_LEN / 2),
  normalScale: SUBTLE_NORMAL,
});
matFloor.vertexColors = true;
const matGlass = new THREE.MeshStandardMaterial({
  color: 0xb8d4e8, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.38,
});
const matSteel = mat(0x7a8490, { roughness: 0.45 });
const matCounter = mat(0xd8d2c4, { roughness: 0.55 });
const matBoard = mat(0x0e1620);
const matScreen = new THREE.MeshBasicMaterial({ color: glowColor(0x4a9fd8, 2.6) });
const matAccent = mat(0xff6a3c);

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

export function makeAirportSegment(variant: number): THREE.Group {
  const rnd = makeRng(9700 + variant * 149);
  const g = new THREE.Group();

  g.add(shadedGround(matFloor, HALL_W, SEG_LEN, (x) => 1 - 0.25 * smooth((Math.abs(x) - 4) / 1.5), 48));

  // Lane dashes — "queue ropes" painted on the floor.
  for (let d = 0; d < 3; d++) {
    const dash = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.02, SEG_LEN - 1), matAccent);
    dash.position.set(-2.4 + d * 2.4, 0.015, 0);
    g.add(dash);
  }

  // Glass walls + steel mullions on both sides.
  [-1, 1].forEach((s) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(0.12, CEIL_Y - 0.4, SEG_LEN - 0.2), matGlass);
    wall.position.set(s * (AISLE_W * 0.5 + 2.8), (CEIL_Y - 0.4) / 2, 0);
    g.add(wall);
    for (let m = 0; m < 4; m++) {
      const mull = new THREE.Mesh(new THREE.BoxGeometry(0.14, CEIL_Y - 0.3, 0.14), matSteel);
      mull.position.set(s * (AISLE_W * 0.5 + 2.8), (CEIL_Y - 0.3) / 2, -SEG_LEN / 2 + 2.5 + m * 5);
      g.add(mull);
    }
  });

  // Ceiling grid + skylight strips.
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(HALL_W, 0.15, SEG_LEN), cmat(0xe8eef2));
  ceil.position.y = CEIL_Y;
  g.add(ceil);
  for (let i = 0; i < 2; i++) {
    const sky = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.05, SEG_LEN - 1), new THREE.MeshBasicMaterial({
      color: glowColor(0xdcecff, 1.6),
    }));
    sky.position.set(-1.8 + i * 3.6, CEIL_Y - 0.2, 0);
    g.add(sky);
  }

  // Check-in counters along the sides.
  [-1, 1].forEach((s) => {
    for (let c = 0; c < 2; c++) {
      const zc = -SEG_LEN / 2 + 4 + c * 8 + (variant % 2) * 1.5;
      const desk = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.05, 2.4), matCounter);
      desk.position.set(s * 4.6, 0.52, zc);
      desk.castShadow = true;
      g.add(desk);
      const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.06), matScreen);
      screen.position.set(s * 4.6, 1.45, zc);
      g.add(screen);
      const belt = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.12, 1.8), cmat(0x2a2e34));
      belt.position.set(s * 4.6, 0.95, zc);
      g.add(belt);
    }
  });

  // Big departure board hanging over the lane.
  const board = new THREE.Mesh(new THREE.BoxGeometry(5.2, 1.6, 0.2), matBoard);
  board.position.set(0, 4.2, -SEG_LEN / 2 + 6 + variant * 2);
  g.add(board);
  for (let row = 0; row < 5; row++) {
    const line = new THREE.Mesh(
      new THREE.BoxGeometry(4.6, 0.14, 0.03),
      cmat(row === 0 ? 0xff6a3c : (row % 2 ? 0x3aee88 : 0xe8e4dc)),
    );
    line.position.set(0, 4.7 - row * 0.24, -SEG_LEN / 2 + 6 + variant * 2 + 0.12);
    g.add(line);
  }

  // Abandoned luggage clutter.
  const bags = 3 + (variant % 2);
  for (let i = 0; i < bags; i++) {
    const cols = [0x2a5a8a, 0x8a2a3a, 0x2a8a5a, 0x3a3a3a, 0xc4a028];
    addLuggage(
      g,
      (rnd() - 0.5) * 3.5,
      -SEG_LEN / 2 + 3 + rnd() * (SEG_LEN - 6),
      rnd() * Math.PI * 2,
      cols[(variant * 3 + i) % cols.length],
    );
  }

  // Rope stanchions hinting at a queue that spilled into the walkway.
  if (variant !== 1) {
    for (let i = 0; i < 4; i++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 1.0, 6), cmat(0xc0c4c8));
      post.position.set(-1.5 + (i % 2) * 3, 0.5, -2 + Math.floor(i / 2) * 4);
      g.add(post);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.06, 8), cmat(0x3a3e44));
      base.position.set(post.position.x, 0.03, post.position.z);
      g.add(base);
    }
  }

  return g;
}
