// Quality tiers: one place that decides how much GPU work the renderer is allowed to do.
//
// Pick a tier with ?quality=low|medium|high (remembered in localStorage), otherwise it is guessed
// from the device. Nothing else in the game should look at the device: read TIER / QUALITY instead.

export type Tier = 'low' | 'medium' | 'high';

export interface QualitySettings {
  maxPixelRatio: number;   // cap on devicePixelRatio
  postProcessing: boolean; // EffectComposer: tone mapping + LUT + vignette (+ bloom)
  bloom: boolean;
  lut: boolean;
  msaaSamples: number;     // multisampling for the composer (renderer AA is used when post is off)
  shadows: boolean;        // real shadow map (blob shadows under characters are always on)
  shadowMapSize: number;
  envMap: boolean;         // image-based lighting for PBR materials
  normalMaps: boolean;
}

const SETTINGS: Record<Tier, QualitySettings> = {
  low: { maxPixelRatio: 1.25, postProcessing: false, bloom: false, lut: false, msaaSamples: 0, shadows: false, shadowMapSize: 512, envMap: true, normalMaps: false },
  medium: { maxPixelRatio: 1.5, postProcessing: true, bloom: true, lut: true, msaaSamples: 2, shadows: true, shadowMapSize: 1024, envMap: true, normalMaps: true },
  high: { maxPixelRatio: 2, postProcessing: true, bloom: true, lut: true, msaaSamples: 4, shadows: true, shadowMapSize: 2048, envMap: true, normalMaps: true },
};

const STORAGE_KEY = 'sz_quality';

function isTier(v: string | null): v is Tier {
  return v === 'low' || v === 'medium' || v === 'high';
}

function guessTier(): Tier {
  const isTouchDevice = window.matchMedia('(pointer: coarse)').matches;
  if (!isTouchDevice) return 'high';
  // navigator.deviceMemory is Chrome/Android only; iPhones report neither, and are fast enough for medium.
  const memoryGb = (navigator as any).deviceMemory as number | undefined;
  const cores = navigator.hardwareConcurrency || 4;
  if ((memoryGb !== undefined && memoryGb <= 4) || cores <= 4) return 'low';
  return 'medium';
}

function pickTier(): Tier {
  const fromUrl = new URLSearchParams(location.search).get('quality');
  if (isTier(fromUrl)) {
    try { localStorage.setItem(STORAGE_KEY, fromUrl); } catch (e) { /* private mode */ }
    return fromUrl;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (isTier(saved)) return saved;
  } catch (e) { /* private mode */ }
  return guessTier();
}

export const TIER: Tier = pickTier();
export const QUALITY: QualitySettings = SETTINGS[TIER];
