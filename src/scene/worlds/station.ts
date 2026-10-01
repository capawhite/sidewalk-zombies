// Level 6: train station platform.
//
// A concrete platform with yellow safety lines, overhead canopy, benches, and timetable boards.
// Crowd joke: everyone staring at arrivals while blocking the walkway.
import * as THREE from 'three';
import { AISLE_W, SEG_LEN } from '../../config';
import { cmat, glowColor, mat } from '../../render/materials';
import { SUBTLE_NORMAL, grainNormal } from '../../render/textures';
import { photoMap } from '../art/photo';
import { makeRng, shadedGround } from '../kit/parts';
import { addBench, addLuggage } from './props';

const PLATFORM_W = AISLE_W + 6;
const CANOPY_Y = 5.4;

const matFloor = mat(0xffffff, {
  map: photoMap('concrete', 256, PLATFORM_W / 3, SEG_LEN / 3, 41),
  roughness: 0.88,
  normalMap: grainNormal('coarse', PLATFORM_W / 1.5, SEG_LEN / 1.5),
  normalScale: SUBTLE_NORMAL,
});
matFloor.vertexColors = true;
const matYellow = mat(0xf0d24a);
const matCanopy = mat(0x3a3e46, { roughness: 0.65 });
const matGlass = new THREE.MeshStandardMaterial({
  color: 0x8ab4c8, roughness: 0.35, metalness: 0.1, transparent: true, opacity: 0.45,
});
const matBoard = mat(0x1a222c);
const matLit = new THREE.MeshBasicMaterial({ color: glowColor(0x7ec8ff, 2.2) });

const smooth = (t: number) => { const x = Math.min(1, Math.max(0, t)); return x * x * (3 - 2 * x); };

export function makeStationSegment(variant: number): THREE.Group {
  const rnd = makeRng(9200 + variant * 131);
  const g = new THREE.Group();

  g.add(shadedGround(matFloor, PLATFORM_W, SEG_LEN, (x) => 1 - 0.35 * smooth((Math.abs(x) - 3.2) / 1.4), 40));

  // Yellow safety strips flanking the walk lane.
  [-1, 1].forEach((s) => {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, SEG_LEN - 0.4), matYellow);
    strip.position.set(s * 3.55, 0.02, 0);
    g.add(strip);
  });

  // Platform edge "tracks" (dark recess) outside the strip.
  [-1, 1].forEach((s) => {
    const track = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, SEG_LEN), cmat(0x1a1c20));
    track.position.set(s * 5.4, -0.02, 0);
    g.add(track);
    for (let t = 0; t < 5; t++) {
      const sleeper = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.1, 0.22), cmat(0x4a3a28));
      sleeper.position.set(s * 5.4, 0.02, -SEG_LEN / 2 + 2 + t * 4);
      g.add(sleeper);
    }
  });

  // Overhead canopy + fluorescent tubes.
  const canopy = new THREE.Mesh(new THREE.BoxGeometry(PLATFORM_W - 1.2, 0.12, SEG_LEN - 0.5), matCanopy);
  canopy.position.y = CANOPY_Y;
  g.add(canopy);
  for (let i = 0; i < 3; i++) {
    const tube = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.06, 4.8), matLit);
    tube.position.set(-2.4 + i * 2.4, CANOPY_Y - 0.35, -2 + (variant % 2) * 3);
    g.add(tube);
  }
  [-1, 1].forEach((s) => {
    for (let p = 0; p < 3; p++) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, CANOPY_Y, 6), cmat(0x5a6068));
      post.position.set(s * 4.2, CANOPY_Y / 2, -SEG_LEN / 2 + 3.5 + p * 6);
      post.castShadow = true;
      g.add(post);
    }
  });

  // Timetable boards on pillars.
  for (let b = 0; b < 2; b++) {
    const side = b === 0 ? -1 : 1;
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.2, 0.08), matBoard);
    board.position.set(side * 2.6, 2.2, -SEG_LEN / 2 + 5 + b * 7 + variant);
    g.add(board);
    for (let row = 0; row < 4; row++) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.08, 0.02), cmat(row % 2 ? 0x3aee88 : 0xe8e4dc));
      line.position.set(side * 2.6, 2.55 - row * 0.22, -SEG_LEN / 2 + 5 + b * 7 + variant + 0.05);
      g.add(line);
    }
  }

  // Glass windbreaks between benches.
  [-1, 1].forEach((s) => {
    for (let w = 0; w < 2; w++) {
      const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.6, 2.2), matGlass);
      glass.position.set(s * 2.1, 0.9, -SEG_LEN / 2 + 4 + w * 8);
      g.add(glass);
      addBench(g, s * 2.55, -SEG_LEN / 2 + 4.5 + w * 8, s > 0 ? Math.PI : 0);
    }
  });

  if (variant === 1) {
    addLuggage(g, -1.2, 2.5, 0.4, 0x8a2a3a);
    addLuggage(g, 1.5, -3.2, -0.3, 0x2a5a8a);
  }
  if (variant === 2) {
    const kiosk = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.9), cmat(0x3a4650));
    kiosk.position.set(0, 0.9, 1.5);
    g.add(kiosk);
    const screen = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.55, 0.04), matLit);
    screen.position.set(0, 1.35, 1.96);
    g.add(screen);
  }

  // Scattered coffee cups / trash for platform grit (tiny).
  for (let i = 0; i < 3; i++) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.12, 6), cmat(0xe8e0d4));
    cup.position.set((rnd() - 0.5) * 4, 0.06, (rnd() - 0.5) * (SEG_LEN - 4));
    g.add(cup);
  }

  return g;
}
