// Renderer, scene, camera rig, lights and resize handling.
import * as THREE from 'three';
import { CAM_BACK_Z, CAM_FOV, CAM_HEIGHT, CAM_LOOK_Y, CAM_LOOK_Z, CAM_MIN_HFOV, COL, FOG_FAR, FOG_NEAR } from '../config';
import { G } from '../state';

// ---------- renderer / scene ----------
export const wrap = document.getElementById('wrap') as HTMLDivElement;
export const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
wrap.insertBefore(renderer.domElement, wrap.firstChild);
export const scene = new THREE.Scene();
scene.background = new THREE.Color(COL.fog);
scene.fog = new THREE.Fog(COL.fog, FOG_NEAR, FOG_FAR);
export const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 200);
export const camBase = new THREE.Vector3(0, CAM_HEIGHT, CAM_BACK_Z);
camera.position.copy(camBase);
camera.lookAt(0, CAM_LOOK_Y, CAM_LOOK_Z);
export const hemi = new THREE.HemisphereLight(0xf4ebe0, 0x6a5c4e, 0.95);
scene.add(hemi);
export const sun = new THREE.DirectionalLight(0xfff2d4, 0.7);
sun.position.set(-6, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
const sc = sun.shadow.camera as THREE.OrthographicCamera;
sc.left = -20;
 sc.right = 20;
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