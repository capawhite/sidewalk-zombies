// People: one skinned mesh per character, animated with an AnimationMixer.
//
// The bodies and baked poses come from ./character/kit.ts. Here a character is a Group holding a cloned rig and its
// mixer. Blob shadows and phones are drawn by ./crowdProps.ts. Gameplay code only uses the functions exported below.
import * as THREE from 'three';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { BIKINIS, COL, HAIR, LONG_HAIR, PANTS, SKINS } from '../config';
import { mat } from '../render/materials';
import { clamp, rand } from '../util';
import { characterMaterial, crowdPropMaterial, kits, type BodyName, type GripName, type Kit, type PoseName, type Region } from './character/kit';

const billGeometry = new THREE.BoxGeometry(0.17, 0.02, 0.13);

const CAP_COLOR = 0xd8362b;
const PLAYER_WALK_SPEED = 1.15; // brisk walk — not a run cycle
const WALK_SPEED = 1.3;  // crowd walk cycle playback rate (the clip is 1.04 s long)

// Everything a character needs after it is built. Lives in group.userData.rig.
interface Rig {
  kit: Kit;
  root: THREE.Object3D;
  mixer: THREE.AnimationMixer;
  colors: THREE.BufferAttribute;
  head: THREE.Object3D;
  palm: THREE.Object3D;                 // right palm bone
  phoneHolder: THREE.Object3D;          // what the phone is positioned relative to (the palm; the group for a tripod camera)
  phoneAt: THREE.Matrix4 | null;        // phone relative to phoneHolder, null when the pose has no phone
  sway: [number, number, number]; // extra head [pitch, yaw, roll] on top of the animation
  run: THREE.AnimationAction | null;
  walk: THREE.AnimationAction | null;
  idle: THREE.AnimationAction | null;
  pose: THREE.AnimationAction | null;
}

// ---------- colouring ----------
const tmpColor = new THREE.Color();
function paint(rig: Rig, region: Region, hex: number) {
  tmpColor.setHex(hex);
  const data = rig.colors.array as Float32Array;
  for (const v of rig.kit.regionVerts[region]) { data[v * 3] = tmpColor.r; data[v * 3 + 1] = tmpColor.g; data[v * 3 + 2] = tmpColor.b; }
  rig.colors.needsUpdate = true;
}
export function setShirtColor(z: any, hex: number) {
  paint(z.userData.rig, 'shirt', hex);
}

// ---------- building ----------
interface Look { skin: number; shirt: number; pants: number; hair: number; shoes?: number }

function addBody(g: THREE.Group, name: BodyName, look: Look, facing: number): Rig {
  const kit = kits[name];
  if (!kit) throw new Error('Character models are not loaded yet');
  const root = cloneSkinned(kit.scene) as THREE.Group;
  root.scale.setScalar(kit.scale);
  root.rotation.y = facing;
  let mesh!: THREE.SkinnedMesh;
  root.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) mesh = o as THREE.SkinnedMesh; });

  // Characters share the merged geometry's buffers and only own their colour attribute.
  const geometry = new THREE.BufferGeometry();
  geometry.index = kit.geometry.index;
  for (const attr of ['position', 'normal', 'uv', 'skinIndex', 'skinWeight']) geometry.setAttribute(attr, kit.geometry.getAttribute(attr));
  const colors = new THREE.BufferAttribute(new Float32Array(kit.geometry.getAttribute('position').count * 3), 3);
  colors.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute('color', colors);
  mesh.geometry = geometry;
  mesh.material = characterMaterial;
  mesh.castShadow = true;
  mesh.frustumCulled = false; // the bind-pose bounds do not follow the animation
  g.add(root);

  const rig: Rig = {
    kit, root, mixer: new THREE.AnimationMixer(root), colors, head: root.getObjectByName('Head')!, palm: root.getObjectByName('PalmR')!, phoneHolder: g, phoneAt: null,
    sway: [0, 0, 0], run: null, walk: null, idle: null, pose: null,
  };
  paint(rig, 'skin', look.skin);
  paint(rig, 'shirt', look.shirt);
  paint(rig, 'pants', look.pants);
  paint(rig, 'hair', look.hair);
  paint(rig, 'shoes', look.shoes ?? 0x1a1a1a);
  paint(rig, 'socks', 0xe6e2da);
  paint(rig, 'eyes', 0x1c1410);
  g.userData.rig = rig;
  g.userData.head = rig.head;
  g.userData.phone = { visible: true }; // gameplay clears this when the character is knocked
  g.userData.inf = false;
  return rig;
}

function mount(object: THREE.Object3D, parent: THREE.Object3D, at: { position: THREE.Vector3; quaternion: THREE.Quaternion }, kit: Kit) {
  object.scale.setScalar(kit.propScale);
  object.position.copy(at.position);
  object.quaternion.copy(at.quaternion);
  parent.add(object);
}

// Put one of the player's props (bat, horn, gun) into the right hand; it then follows the arm. `size` scales the prop.
export function holdInRightHand(player: any, prop: THREE.Object3D, grip: GripName, size = 1) {
  const rig: Rig = player.userData.rig;
  mount(prop, rig.root.getObjectByName('PalmR')!, rig.kit.grips[grip], rig.kit);
  prop.scale.multiplyScalar(size);
}

// Crowd bodies rotate through this list (no randomness, so the seeded game stream is unaffected).
const CROWD_BODIES: BodyName[] = ['man', 'woman', 'man', 'tank', 'woman', 'dress'];
let crowdMade = 0;

function startPlayerGait(g: any, rig: Rig) {
  // Prefer the walk clip so the player reads as weaving through the crowd, not sprinting.
  if (rig.run) { rig.run.stop(); rig.run = null; }
  rig.pose?.stop();
  g.userData.playerWalk = true;
  rig.walk = rig.mixer.clipAction(rig.kit.clips.walk).play();
  rig.idle = rig.mixer.clipAction(rig.kit.clips.idle).play();
  rig.walk.setEffectiveWeight(1);
  rig.idle.setEffectiveWeight(0);
  rig.walk.timeScale = PLAYER_WALK_SPEED;
  rig.mixer.update(0);
}

// `into` lets the player module hand in its (already exported) group once the models have loaded.
export function makePerson(shirtColor: number, isPlayer: boolean, into?: THREE.Group): any {
  const g: any = into ?? new THREE.Group();
  const look: Look = isPlayer
    ? { skin: COL.playerSkin, shirt: shirtColor, pants: COL.playerPants, hair: CAP_COLOR }
    : { skin: SKINS[(rand() * SKINS.length) | 0], shirt: shirtColor, pants: PANTS[(rand() * PANTS.length) | 0], hair: HAIR[(rand() * HAIR.length) | 0] };
  if (isPlayer) {
    // The walker faces away from the camera.
    const rig = addBody(g, 'man', look, Math.PI);
    const bill = new THREE.Mesh(billGeometry, mat(CAP_COLOR));
    mount(bill, rig.head, rig.kit.bill, rig.kit);
    g.userData.bill = bill;
    startPlayerGait(g, rig);
  } else {
    const rig = addBody(g, CROWD_BODIES[crowdMade++ % CROWD_BODIES.length], look, 0);
    rig.phoneHolder = rig.palm;
  }
  return g;
}

/** Stage 5: rebuild the player body/colours for an equipped look. Props are re-parented by the caller. */
export function applyPlayerLook(
  g: any,
  opts: { body: BodyName; skin: number; shirt: number; pants: number; hair: number; shoes?: number; cap?: boolean },
  props: THREE.Object3D[],
) {
  const prev: Rig | undefined = g.userData.rig;
  for (const p of props) { if (p.parent) p.parent.remove(p); }
  if (prev) {
    if (g.userData.bill && g.userData.bill.parent) g.userData.bill.parent.remove(g.userData.bill);
    g.remove(prev.root);
    prev.mixer.stopAllAction();
  }
  const look: Look = {
    skin: opts.skin, shirt: opts.shirt, pants: opts.pants, hair: opts.hair, shoes: opts.shoes,
  };
  const rig = addBody(g, opts.body, look, Math.PI);
  if (opts.cap !== false) {
    const bill = new THREE.Mesh(billGeometry, mat(opts.hair));
    mount(bill, rig.head, rig.kit.bill, rig.kit);
    g.userData.bill = bill;
  } else {
    g.userData.bill = null;
  }
  startPlayerGait(g, rig);
}

export function makeInfluencer(): any {
  const g: any = new THREE.Group();
  const female = rand() < 0.86;
  const skin = SKINS[(rand() * SKINS.length) | 0];
  const kit = BIKINIS[(rand() * BIKINIS.length) | 0];
  const hairC = LONG_HAIR[(rand() * LONG_HAIR.length) | 0];
  addBody(g, female ? 'dress' : 'man', {
    skin, shirt: kit, pants: female ? kit : 0xe8dcc4, hair: hairC, shoes: female ? 0xf2d4a8 : 0x1a1a1a,
  }, 0);

  // Tripod with a ring light, standing in front of the influencer. Its camera is drawn as the influencer's "phone".
  const tripod = new THREE.Mesh(tripodGeometry(), crowdPropMaterial);
  tripod.castShadow = true;
  g.add(tripod);
  g.userData.inf = true;
  g.userData.female = female;
  return g;
}

let tripodGeo: THREE.BufferGeometry | null = null;
function tripodGeometry() {
  if (tripodGeo) return tripodGeo;
  const parts: THREE.BufferGeometry[] = [];
  const part = (geo: THREE.BufferGeometry, color: number, x: number, y: number, z: number, rx = 0, rz = 0) => {
    geo.applyMatrix4(new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, 0, rz)), new THREE.Vector3(1, 1, 1)));
    const c = new THREE.Color(color), n = geo.getAttribute('position').count, rgb = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { rgb[i * 3] = c.r; rgb[i * 3 + 1] = c.g; rgb[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new THREE.BufferAttribute(rgb, 3));
    parts.push(geo);
  };
  [-1, 0, 1].forEach((s) => {
    part(new THREE.CylinderGeometry(0.014, 0.02, 1.05, 5), 0x222226, s * 0.14, 0.52, 0.55 + Math.abs(s) * 0.04, 0.18, s * 0.28);
  });
  part(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), 0x9aa3ab, 0, 1.22, 0.58);
  part(new THREE.TorusGeometry(0.16, 0.018, 6, 14), 0xf4f0e6, 0, 1.46, 0.5);
  // mergeGeometries needs every part to have the same attributes and indexing
  tripodGeo = mergeGeometries(parts.map((g) => g.toNonIndexed().deleteAttribute('uv')))!;
  return tripodGeo;
}

// The influencer's phone is the camera on the tripod.
const tripodCamera = new THREE.Matrix4().compose(
  new THREE.Vector3(0, 1.46, 0.48), new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, 0, 0)), new THREE.Vector3(1, 1, 1),
);

// ---------- poses and animation ----------
// Switch a pooled character to the pose for a zombie type (or 'scared').
export function applyPose(z: any, type: string) {
  const d = z.userData;
  const rig: Rig = d.rig;
  const name: PoseName =
    type === 'selfie' || type === 'photo' ? 'film'
    : type === 'text' || type === 'nav' || type === 'scooter' || type === 'delivery' ? 'text'
    : type === 'inf' ? 'inf'
    : type === 'scared' ? 'scared'
    : 'talk'; // talk, couple, tour, dog, default
  const clips = rig.kit.poses[name];
  rig.mixer.stopAllAction();
  rig.pose = rig.mixer.clipAction(clips.pose).play();
  rig.walk = rig.mixer.clipAction(clips.walk).play();
  rig.idle = rig.mixer.clipAction(clips.idle).play();
  // Start each character at its own point of the walk cycle so a row of them does not march in step.
  const phase = ((d.driftPhase ?? 0) / 6.28) % 1;
  rig.walk.time = phase * clips.walk.duration;
  rig.idle.time = phase * clips.idle.duration;
  rig.sway = [0, 0, 0];
  if (d.inf) rig.phoneAt = tripodCamera;
  else if (clips.phone) {
    rig.phoneAt = (rig.phoneAt ?? new THREE.Matrix4()).compose(clips.phone.position, clips.phone.quaternion, tmpScale.setScalar(rig.kit.propScale));
  } else rig.phoneAt = null;
  d.phone.visible = true;
  // Walk-cycle rate hints (scooters hustle; photographers saunter).
  if (rig.walk) {
    rig.walk.timeScale = type === 'scooter' || type === 'delivery' ? 1.55
      : type === 'tour' ? 0.7
      : type === 'dog' ? 1.15
      : type === 'photo' ? 0.85
      : 1;
  }
  rig.mixer.update(0);
}

// World matrix for this character's phone, or false if it has none right now (used by crowdProps).
const tmpScale = new THREE.Vector3();
export function phoneMatrix(z: any, out: THREE.Matrix4): boolean {
  const rig: Rig = z.userData.rig;
  if (!rig.phoneAt) return false;
  rig.phoneHolder.updateWorldMatrix(true, false);
  out.multiplyMatrices(rig.phoneHolder.matrixWorld, rig.phoneAt);
  return true;
}

// Extra head rotation was used for talk/nav flavours; disabled — on some kits it compounded
// into a continuous head spin. Keep the API so call sites stay harmless.
export function setHeadSway(z: any, _pitch: number, _yaw: number, _roll: number) {
  const s = z.userData.rig?.sway;
  if (s) { s[0] = 0; s[1] = 0; s[2] = 0; }
}

// Advance a character's animation. `amt` is how much it walks: about 0.05 = standing, 0.5 = brisk walk.
// Legacy run-cycle players skip blending; walk-gait players blend like the crowd.
export function animatePerson(z: any, dt: number, amt: number) {
  const rig: Rig = z.userData.rig;
  if (rig.run) { rig.mixer.update(dt); return; }
  const w = clamp(amt * 2.6, 0, 1);
  rig.walk!.setEffectiveWeight(w);
  rig.idle!.setEffectiveWeight(1 - w);
  // Keep the player's set gait rate; crowd uses the shared walk tempo.
  if (!z.userData.playerWalk) rig.walk!.timeScale = WALK_SPEED;
  rig.mixer.update(dt);
}
