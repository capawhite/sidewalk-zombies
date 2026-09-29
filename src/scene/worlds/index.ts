// World builder: picks the segment generator and theme for each level.
import * as THREE from 'three';
import { COL, FOG_FAR, FOG_NEAR, SEG_LEN, SEG_N } from '../../config';
import { hemi, scene, sun } from '../../render/renderer';
import { G } from '../../state';
import { makeAisleSegment } from './aisle';
import { makeBeachSegment } from './beach';
import { makeFoodCourtSegment } from './foodcourt';
import { makeStreetSegment } from './street';

// ---------- aisle ----------
export const scroll: any[] = [];

// Slide every world segment toward the camera by dz, wrapping the far ones back to the start.
export function scrollWorld(dz: number) {
  for (const s of scroll) {
    s.position.z += dz;
    if (s.position.z > SEG_LEN) s.position.z -= SEG_N * SEG_LEN;
  }
}
function setTheme(lv: number) {
  if (lv === 4) {
    scene.background = new THREE.Color(0x6ec4f0);
    scene.fog = new THREE.Fog(0x6ec4f0, 24, 90);
    hemi.color.setHex(0xfff4d6);
    hemi.groundColor.setHex(0xc9b07a);
    hemi.intensity = 1.15;
    sun.intensity = 1.2;
    sun.position.set(10, 26, 4);
  } else if (lv === 3) {
    scene.background = new THREE.Color(0xf6e8d0);
    scene.fog = new THREE.Fog(0xf6e8d0, 26, 74);
    hemi.color.setHex(0xfff2dc);
    hemi.groundColor.setHex(0xa88a6a);
    hemi.intensity = 1.1;
    sun.intensity = 0.5;
    sun.position.set(-4, 18, 6);
  } else if (lv === 2) {
    scene.background = new THREE.Color(COL.sky);
    scene.fog = new THREE.Fog(COL.sky, 22, 85);
    hemi.color.setHex(0xfff1dc);
    hemi.groundColor.setHex(0x6a8a6e);
    hemi.intensity = 1.05;
    sun.intensity = 1.05;
    sun.position.set(8, 24, 6);
  } else {
    scene.background = new THREE.Color(COL.fog);
    scene.fog = new THREE.Fog(COL.fog, FOG_NEAR, FOG_FAR);
    hemi.color.setHex(0xf4ebe0);
    hemi.groundColor.setHex(0x6a5c4e);
    hemi.intensity = 0.95;
    sun.intensity = 0.7;
    sun.position.set(-6, 22, 8);
  }
}
function makeWorldSeg(lv: number, i: number) {
  if (lv === 4) return makeBeachSegment(i);
  if (lv === 3) return makeFoodCourtSegment(i);
  if (lv === 2) return makeStreetSegment(i);
  return makeAisleSegment(i);
}
export function buildWorld(lv: number) {
  for (const s of scroll) scene.remove(s);
  scroll.length = 0;
  for (let i = 0; i < SEG_N; i++) {
    const s = makeWorldSeg(lv, i);
    s.position.z = -i * SEG_LEN; scene.add(s); scroll.push(s);
  }
  G.worldLevel = lv;
  setTheme(lv);
}