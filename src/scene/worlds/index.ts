// World builder: picks the segment generator and theme for each level.
import * as THREE from 'three';
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
import { MergeOptions, mergeStatic } from './merge';
import { Strip, buildStrip, disposeStrip, scrollStrip } from './strip';
import { makeStreetSegment } from './street';

// How many distinct segments each level builds; the ring of SEG_N segments repeats them (see strip.ts).
const VARIANTS = 3;

// Baked contact shadow on vertical surfaces, per level.
const MERGE_OPTIONS: Record<number, MergeOptions> = {
  1: { groundAO: { height: 0.9, strength: 0.4 } },
  2: { groundAO: { height: 1.4, strength: 0.35 } },
  3: { groundAO: { height: 1.2, strength: 0.35 } },
  4: {},
};

let strip: Strip | null = null;

// Slide the whole world toward the camera by dz.
export function scrollWorld(dz: number) {
  if (strip) scrollStrip(strip, dz);
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

function makeVariant(lv: number, v: number) {
  const raw = lv === 4 ? makeBeachSegment(v)
    : lv === 3 ? makeFoodCourtSegment(v)
    : lv === 2 ? makeStreetSegment(v)
    : makeAisleSegment(v);
  return mergeStatic(raw, MERGE_OPTIONS[lv]); // a few merged meshes instead of dozens of small ones
}
export function buildWorld(lv: number) {
  if (strip) disposeStrip(strip);
  const variants = Array.from({ length: VARIANTS }, (_, v) => makeVariant(lv, v));
  strip = buildStrip(variants, (LOOKS[lv] ?? LOOKS[1]).fogFar);
  scene.add(strip.group);
  G.worldLevel = lv;
  setTheme(lv);
}
