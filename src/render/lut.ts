// Procedural colour-grading LUTs: one small 3D lookup table per scene look, generated in code.
import { LookupTexture } from 'postprocessing';

// All values are applied in display (sRGB) space, after tone mapping.
export interface Grade {
  lift: [number, number, number];  // added mostly to shadows (tints the darks)
  gain: [number, number, number];  // multiplied into highlights (tints the lights)
  saturation: number;              // 1 = unchanged
  contrast: number;                // 1 = unchanged
}

export const NEUTRAL_GRADE: Grade = { lift: [0, 0, 0], gain: [1, 1, 1], saturation: 1, contrast: 1 };

const LUT_SIZE = 16;
const cache = new Map<string, LookupTexture>();

function clamp01(v: number) {
  return v < 0 ? 0 : v > 1 ? 1 : v;
}

function gradeChannel(c: number, lift: number, gain: number, contrast: number) {
  const graded = c * gain + lift * (1 - c);
  return clamp01((graded - 0.5) * contrast + 0.5);
}

export function makeGradeLut(g: Grade): LookupTexture {
  const key = JSON.stringify(g);
  const cached = cache.get(key);
  if (cached) return cached;

  const lut = LookupTexture.createNeutral(LUT_SIZE);
  const data = lut.image.data as unknown as Float32Array;
  for (let i = 0; i < data.length; i += 4) {
    const r = gradeChannel(data[i], g.lift[0], g.gain[0], g.contrast);
    const gr = gradeChannel(data[i + 1], g.lift[1], g.gain[1], g.contrast);
    const b = gradeChannel(data[i + 2], g.lift[2], g.gain[2], g.contrast);
    const luma = 0.2126 * r + 0.7152 * gr + 0.0722 * b;
    data[i] = clamp01(luma + (r - luma) * g.saturation);
    data[i + 1] = clamp01(luma + (gr - luma) * g.saturation);
    data[i + 2] = clamp01(luma + (b - luma) * g.saturation);
  }
  // 8-bit data can be filtered on every GPU; float 3D textures cannot on some phones.
  lut.convertToUint8();
  cache.set(key, lut);
  return lut;
}
