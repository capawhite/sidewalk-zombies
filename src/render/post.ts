// Post-processing: bloom, ACES tone mapping, LUT colour grade and vignette, gated by the quality tier.
// Low tier skips the composer entirely and renders straight to the canvas (renderer tone mapping is used).
import * as THREE from 'three';
import {
  BloomEffect, EffectComposer, EffectPass, LUT3DEffect, RenderPass, ToneMappingEffect, ToneMappingMode,
  VignetteEffect,
} from 'postprocessing';
import { Grade, NEUTRAL_GRADE, makeGradeLut } from './lut';
import { QUALITY } from './quality';
import { camera, renderer, scene, wrap } from './renderer';

let composer: EffectComposer | null = null;
let lutEffect: LUT3DEffect | null = null;

if (QUALITY.postProcessing) {
  composer = new EffectComposer(renderer, {
    frameBufferType: THREE.HalfFloatType,
    multisampling: QUALITY.msaaSamples,
  });
  composer.addPass(new RenderPass(scene, camera));

  const effects: any[] = [];
  if (QUALITY.bloom) {
    // Only things brighter than 1.0 (neon, lamps, coins) bloom; normal lit surfaces stay below that.
    effects.push(new BloomEffect({
      mipmapBlur: true, intensity: 0.7, radius: 0.65, levels: 5,
      luminanceThreshold: 1.0, luminanceSmoothing: 0.25,
    }));
  }
  effects.push(new ToneMappingEffect({ mode: ToneMappingMode.ACES_FILMIC }));
  if (QUALITY.lut) {
    lutEffect = new LUT3DEffect(makeGradeLut(NEUTRAL_GRADE));
    effects.push(lutEffect);
  }
  effects.push(new VignetteEffect({ offset: 0.32, darkness: 0.55 }));
  composer.addPass(new EffectPass(camera, ...effects));

  // The CSS vignette in the page is replaced by the real one (its gun-fire glow stays).
  wrap.classList.add('postfx');

  const fit = () => composer!.setSize(wrap.clientWidth, wrap.clientHeight, false);
  window.addEventListener('resize', fit);
  fit();
}

// Swaps the colour grade for the current scene (no-op when the LUT is off).
export function setGrade(grade: Grade) {
  if (lutEffect) lutEffect.lut = makeGradeLut(grade);
}

// Draws one frame. Stats are reset here so draw-call counts cover every pass of the frame.
export function renderFrame(dt: number) {
  renderer.info.reset();
  if (composer) composer.render(dt);
  else renderer.render(scene, camera);
}
