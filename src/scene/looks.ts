// Per-scene lighting and colour-grade settings ("looks"). One strong coloured light per scene.
//
// Background/fog colours are deliberately not the colours you see on screen: they go through ACES tone
// mapping, the grade and the vignette. The values below were solved so the sky lands near the old palette
// (aisle fog d6cdc0, sky 7eb7e0, food court f6e8d0, beach sky 6ec4f0).
import { FOG_FAR, FOG_NEAR } from '../config';
import { Grade } from '../render/lut';
import { EnvKind } from '../render/environment';

export interface Look {
  background: number;
  fogNear: number;
  fogFar: number;
  hemiSky: number;
  hemiGround: number;
  hemiIntensity: number;
  sunColor: number;
  sunIntensity: number;
  sunPosition: [number, number, number];
  env: EnvKind;
  envIntensity: number;
  grade: Grade;
}

export const LOOKS: Record<number, Look> = {
  // 1. Cereal aisle: cool fluorescent light, teal shadows.
  1: {
    background: 0xddc5ad, fogNear: FOG_NEAR, fogFar: FOG_FAR,
    hemiSky: 0xf4ebe0, hemiGround: 0x6a5c4e, hemiIntensity: 0.6,
    sunColor: 0xe9f0e6, sunIntensity: 0.45, sunPosition: [-6, 22, 8],
    env: 'room', envIntensity: 0.3,
    grade: { lift: [0, 0.012, 0.01], gain: [0.99, 1, 1], saturation: 0.96, contrast: 1.02 },
  },
  // 2. Boardwalk: golden hour, warm highlights and cool shadows.
  2: {
    background: 0x5da4ff, fogNear: 22, fogFar: 85,
    hemiSky: 0xfff1dc, hemiGround: 0x6a8a6e, hemiIntensity: 1.05,
    sunColor: 0xffb27a, sunIntensity: 1.05, sunPosition: [8, 24, 6],
    env: 'golden', envIntensity: 0.6,
    grade: { lift: [0, 0.006, 0.022], gain: [1.04, 1, 0.94], saturation: 1.08, contrast: 1.04 },
  },
  // 3. Food court: tungsten warmth with magenta shadows.
  3: {
    background: 0xfffff9, fogNear: 26, fogFar: 74,
    hemiSky: 0xfff2dc, hemiGround: 0xa88a6a, hemiIntensity: 0.6,
    sunColor: 0xffcf8a, sunIntensity: 0.35, sunPosition: [-4, 18, 6],
    env: 'room', envIntensity: 0.3,
    grade: { lift: [0.02, 0, 0.02], gain: [1.05, 1, 0.92], saturation: 1.1, contrast: 1.03 },
  },
  // 4. Beach: bright noon sun.
  4: {
    background: 0x46b2ff, fogNear: 24, fogFar: 90,
    hemiSky: 0xfff4d6, hemiGround: 0xc9b07a, hemiIntensity: 0.55,
    sunColor: 0xfff6d8, sunIntensity: 0.6, sunPosition: [10, 26, 4],
    env: 'noon', envIntensity: 0.35,
    grade: { lift: [0, 0, 0.005], gain: [1.02, 1.01, 0.98], saturation: 1.08, contrast: 1.04 },
  },
  // 5. Parking garage: sodium/fluorescent, tight fog.
  5: {
    background: 0x6e675c, fogNear: 18, fogFar: 58,
    hemiSky: 0xffe6c4, hemiGround: 0x3a3830, hemiIntensity: 0.45,
    sunColor: 0xffd9a0, sunIntensity: 0.28, sunPosition: [0, 18, 4],
    env: 'room', envIntensity: 0.22,
    grade: { lift: [0.012, 0.008, 0], gain: [1.04, 0.97, 0.86], saturation: 0.9, contrast: 1.05 },
  },
  // 6. Train station: cool daylight under a canopy, steel blues.
  6: {
    background: 0x8aa0b4, fogNear: 20, fogFar: 70,
    hemiSky: 0xe8eef4, hemiGround: 0x5a646e, hemiIntensity: 0.7,
    sunColor: 0xd8e4f0, sunIntensity: 0.4, sunPosition: [-3, 20, 5],
    env: 'room', envIntensity: 0.28,
    grade: { lift: [0, 0.01, 0.02], gain: [0.96, 1, 1.04], saturation: 0.92, contrast: 1.04 },
  },
  // 7. Airport: bright terminal, cool glass and orange accents.
  7: {
    background: 0xc8d8e8, fogNear: 24, fogFar: 80,
    hemiSky: 0xf4f8fc, hemiGround: 0x8a94a0, hemiIntensity: 0.85,
    sunColor: 0xfff6e8, sunIntensity: 0.55, sunPosition: [6, 22, 8],
    env: 'noon', envIntensity: 0.4,
    grade: { lift: [0.005, 0.008, 0.015], gain: [1.02, 1.01, 1.04], saturation: 1.02, contrast: 1.03 },
  },
};
