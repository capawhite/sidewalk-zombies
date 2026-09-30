// Renderer, scene, camera rig, lights and resize handling.
import * as THREE from 'three';
import { CAM_BACK_Z, CAM_FOV, CAM_HEIGHT, CAM_LOOK_Y, CAM_LOOK_Z, CAM_MIN_HFOV, COL, FOG_FAR, FOG_NEAR } from '../config';
import { G } from '../state';
import { QUALITY } from './quality';

// ---------- renderer / scene ----------
export const wrap = document.getElementById('wrap') as HTMLDivElement;
// With post-processing the scene renders into an off-screen buffer, which does its own multisampling,
// so the canvas itself only needs antialiasing when the composer is off.
export const renderer = new THREE.WebGLRenderer({
  antialias: !QUALITY.postProcessing,
  stencil: false,
  powerPreference: 'high-performance',
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, QUALITY.maxPixelRatio));
renderer.outputColorSpace = THREE.SRGBColorSpace;
// Tone mapping lives in the composer when it is on (so it is not applied twice); otherwise the renderer does it.
renderer.toneMapping = QUALITY.postProcessing ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.shadowMap.enabled = QUALITY.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
// Post-processing renders several passes per frame, so draw stats are reset once per frame by the loop.
renderer.info.autoReset = false;
wrap.insertBefore(renderer.domElement, wrap.firstChild);
export const scene = new THREE.Scene();
scene.fog = new THREE.Fog(COL.fog, FOG_NEAR, FOG_FAR);
export const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 200);
export const camBase = new THREE.Vector3(0, CAM_HEIGHT, CAM_BACK_Z);
camera.position.copy(camBase);
camera.lookAt(0, CAM_LOOK_Y, CAM_LOOK_Z);
export const hemi = new THREE.HemisphereLight(0xf4ebe0, 0x6a5c4e, 0.95);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff2d4, 0.7);
sun.position.set(-6, 22, 8);
sun.castShadow = QUALITY.shadows;
sun.shadow.mapSize.set(QUALITY.shadowMapSize, QUALITY.shadowMapSize);
sun.shadow.bias = -0.0004;
sun.shadow.normalBias = 0.03;
// Tight frustum around the play area: the lane is about 11 units wide and everything that matters
// sits within roughly 45 units ahead of the camera.
const sc = sun.shadow.camera as THREE.OrthographicCamera;
sc.left = -12;
sc.right = 12;
sc.top = 24;
sc.bottom = -16;
sc.near = 1;
sc.far = 70;
scene.add(sun);
scene.add(sun.target);
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  camera.aspect = Math.max(w / Math.max(h, 1), 0.05);
  const minH = THREE.MathUtils.degToRad(CAM_MIN_HFOV);
  const vFromH = 2 * Math.atan(Math.tan(minH / 2) / camera.aspect);
  G.baseFov = Math.max(CAM_FOV, THREE.MathUtils.radToDeg(vFromH));
  camera.fov = G.baseFov + G.fovKick;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();