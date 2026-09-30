// World builder: picks the segment generator and theme for each level.
import * as THREE from 'three';
import { SEG_LEN, SEG_N } from '../../config';
import { setEnvironment } from '../../render/environment';
import { setEnvIntensity } from '../../render/materials';
import { setGrade } from '../../render/post';
import { hemi, scene, sun } from '../../render/renderer';
import { setSkyColor } from '../../render/sky';
import { LOOKS } from '../looks';
import { G } from '../../state';
import { makeAisleSegment } from './aisle';
import { makeBeachSegment } from './beach';
import { makeFoodCourtSegment } from './foodcourt';
import { mergeStatic, disposeSegment } from './merge';
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
// Applies the lighting, fog, environment map and colour grade for a level.
function setTheme(lv: number) {
  const look = LOOKS[lv] ?? LOOKS[1];
  setSkyColor(look.background);
  scene.fog = new THREE.Fog(look.background, look.fogNear, look.fogFar);
  hemi.color.setHex(look.hemiSky);
  hemi.groundColor.setHex(look.hemiGround);
  hemi.intensity = look.hemiIntensity;
  sun.color.setHex(look.sunColor);
  sun.intensity = look.sunIntensity;
  sun.position.set(...look.sunPosition);
  setEnvironment(look.env);
  setEnvIntensity(look.envIntensity);
  setGrade(look.grade);
}
function makeWorldSeg(lv: number, i: number) {
  const raw = lv === 4 ? makeBeachSegment(i)
    : lv === 3 ? makeFoodCourtSegment(i)
    : lv === 2 ? makeStreetSegment(i)
    : makeAisleSegment(i);
  return mergeStatic(raw); // a few merged meshes instead of dozens of small ones
}
export function buildWorld(lv: number) {
  for (const s of scroll) { scene.remove(s); disposeSegment(s); }
  scroll.length = 0;
  for (let i = 0; i < SEG_N; i++) {
    const s = makeWorldSeg(lv, i);
    s.position.z = -i * SEG_LEN; scene.add(s); scroll.push(s);
  }
  G.worldLevel = lv;
  setTheme(lv);
}