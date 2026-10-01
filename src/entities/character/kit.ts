// Character kits: the rigged glTF bodies (Quaternius, CC0), merged into one skinned mesh each, plus the
// phone poses baked into animation clips.
//
// Every body shares the same 31-bone rig, so poses are authored once as "where does the wrist go" targets and solved
// per body with a small two-bone IK. Nothing here runs per frame; per-character state lives in ../person.ts.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { clone as cloneSkinned } from 'three/examples/jsm/utils/SkeletonUtils.js';
import { pbr } from '../../render/materials';
import { applyClothingUvs, clothingAtlas } from './clothing';

export type BodyName = 'man' | 'woman' | 'tank' | 'dress';
// Each vertex belongs to one region; a character is recoloured by repainting a region's vertex colours.
export type Region = 'skin' | 'shirt' | 'pants' | 'shoes' | 'socks' | 'hair' | 'eyes';
export type PoseName = 'talk' | 'text' | 'film' | 'inf' | 'scared';
export type GripName = 'bat' | 'horn' | 'gun';

export const CHARACTER_HEIGHT = 2.0; // world units, matches the old procedural people

export interface Mount { position: THREE.Vector3; quaternion: THREE.Quaternion }
export interface PoseClips {
  pose: THREE.AnimationClip; // the arm / head bones held in the pose
  idle: THREE.AnimationClip; // Idle without those bones
  walk: THREE.AnimationClip; // Walk without those bones
  phone: Mount | null;       // where the phone sits relative to the right palm
}
export interface Kit {
  name: BodyName;
  scene: THREE.Group;   // template hierarchy, cloned once per character
  scale: number;        // rig units -> world units
  propScale: number;    // local scale that makes a prop parented to a bone come out at its authored world size
  geometry: THREE.BufferGeometry; // merged body; characters share everything except the colour attribute
  regionVerts: Record<Region, Uint32Array>;
  clips: { idle: THREE.AnimationClip; walk: THREE.AnimationClip; run: THREE.AnimationClip };
  poses: Record<PoseName, PoseClips>;
  bill: Mount;          // baseball-cap peak, relative to the head bone
  grips: Record<GripName, Mount>; // how the player's props sit in the right hand
  neckWorld: THREE.Quaternion; // rest orientation of the head's parent bone, to express head sway in character space
}

const BODIES: BodyName[] = ['man', 'woman', 'tank', 'dress'];
export const kits = {} as Record<BodyName, Kit>;

// One shared material for every character: fabric/skin in the map, tint in vertex colours.
export const characterMaterial = pbr({ vertexColors: true, roughness: 0.62 });
// Tripods and other crowd props share vertex colours but not the clothing map.
export const crowdPropMaterial = pbr({ vertexColors: true, roughness: 0.5 });

const REGION_OF_MATERIAL: Record<string, Region> = {
  Skin: 'skin', Shirt: 'shirt', Dress: 'shirt', Pants: 'pants', Shoes: 'shoes', Socks: 'socks',
  Hair: 'hair', HairBase: 'hair', Eyes: 'eyes',
};
const REGIONS: Region[] = ['skin', 'shirt', 'pants', 'shoes', 'socks', 'hair', 'eyes'];

let loading: Promise<void> | null = null;
export function loadCharacterKits(): Promise<void> {
  if (!loading) {
    const loader = new GLTFLoader();
    characterMaterial.map = clothingAtlas().texture;
    characterMaterial.needsUpdate = true;
    loading = Promise.all(BODIES.map(async (name) => {
      const gltf = await loader.loadAsync(`${import.meta.env.BASE_URL}models/${name}.glb`);
      kits[name] = buildKit(name, gltf);
    })).then(() => undefined);
  }
  return loading;
}

// ---------- merging the glTF's per-material meshes into one skinned mesh ----------
type Attr = THREE.BufferAttribute | THREE.InterleavedBufferAttribute;
function component(attr: Attr, i: number, k: number): number {
  return k === 0 ? attr.getX(i) : k === 1 ? attr.getY(i) : k === 2 ? attr.getZ(i) : attr.getW(i);
}
// glTF attributes may be quantised; copy them into plain float / uint16 arrays so the meshes can be merged.
function copyAttr(attr: Attr, Type: typeof Float32Array | typeof Uint16Array, size: number): THREE.BufferAttribute {
  const out = new Type(attr.count * size);
  for (let i = 0; i < attr.count; i++) for (let k = 0; k < size; k++) out[i * size + k] = component(attr, i, k);
  return new THREE.BufferAttribute(out, size);
}

function buildKit(name: BodyName, gltf: any): Kit {
  const scene: THREE.Group = gltf.scene;
  const meshes: THREE.SkinnedMesh[] = [];
  scene.traverse((o) => { if ((o as THREE.SkinnedMesh).isSkinnedMesh) meshes.push(o as THREE.SkinnedMesh); });
  const host = meshes[0];
  const bones = host.skeleton.bones;
  const hasShoes = meshes.some((m) => (m.material as THREE.Material).name === 'Shoes');

  // Region of every vertex, in merge order.
  const parts = meshes.map((m) => {
    const g = new THREE.BufferGeometry();
    const src = m.geometry;
    g.setAttribute('position', copyAttr(src.getAttribute('position'), Float32Array, 3));
    g.setAttribute('normal', copyAttr(src.getAttribute('normal'), Float32Array, 3));
    g.setAttribute('skinIndex', copyAttr(src.getAttribute('skinIndex'), Uint16Array, 4));
    g.setAttribute('skinWeight', copyAttr(src.getAttribute('skinWeight'), Float32Array, 4));
    g.setIndex(src.index!);
    return { geo: g, region: REGION_OF_MATERIAL[(m.material as THREE.Material).name] ?? 'skin' };
  });
  const merged = mergeGeometries(parts.map((p) => p.geo))!;

  const regionList: Record<Region, number[]> = { skin: [], shirt: [], pants: [], shoes: [], socks: [], hair: [], eyes: [] };
  let vertex = 0;
  const skinIndex = merged.getAttribute('skinIndex');
  const skinWeight = merged.getAttribute('skinWeight');
  for (const part of parts) {
    const n = part.geo.getAttribute('position').count;
    for (let i = 0; i < n; i++, vertex++) {
      let region = part.region;
      // Bodies without shoes get sneakers: skin weighted mostly to a foot bone is painted as shoes.
      if (region === 'skin' && !hasShoes) {
        let best = 0;
        for (let k = 1; k < 4; k++) if (component(skinWeight, vertex, k) > component(skinWeight, vertex, best)) best = k;
        const bone = bones[component(skinIndex, vertex, best)];
        if (bone.name === 'FootL' || bone.name === 'FootR') region = 'shoes';
      }
      regionList[region].push(vertex);
    }
  }
  const regionVerts = {} as Record<Region, Uint32Array>;
  for (const r of REGIONS) regionVerts[r] = Uint32Array.from(regionList[r]);
  applyClothingUvs(merged, regionVerts);

  // The merged mesh replaces the first one; the others are dropped from the template.
  host.geometry = merged;
  host.material = characterMaterial;
  for (const m of meshes.slice(1)) {
    if (!m.bindMatrix.equals(host.bindMatrix)) console.warn(`${name}: mesh ${m.name} has a different bind matrix`);
    m.removeFromParent();
  }
  scene.updateMatrixWorld(true);

  const height = new THREE.Box3().setFromObject(scene).getSize(new THREE.Vector3()).y;
  const anims = gltf.animations as THREE.AnimationClip[];
  const clip = (n: string) => anims.find((a) => a.name === n)!;
  const kit: Kit = {
    name, scene, scale: CHARACTER_HEIGHT / height, propScale: 1, geometry: merged, regionVerts,
    clips: { idle: clip('Idle'), walk: clip('Walk'), run: clip('Run') },
    poses: {} as Record<PoseName, PoseClips>,
    bill: { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() },
    neckWorld: new THREE.Quaternion(),
    grips: {} as Record<GripName, Mount>,
  };
  // The armature node is scaled (100 in these files), so bones inherit that scale on top of the character scale.
  kit.propScale = 1 / (kit.scale * scene.getObjectByName('Head')!.getWorldScale(new THREE.Vector3()).x);
  bakePoses(kit);
  return kit;
}

// ---------- poses ----------
// Targets are in rig units (the rig is about 4.8 tall; x is the character's left, z is forward). Wrist targets are
// relative to the head bone (or the hips), `pole` says which way the elbow should point.
type V3 = [number, number, number];
interface ArmGoal { ref: 'head' | 'hips'; at: V3; pole: V3 }
interface PhoneGoal { mid?: boolean; slide: number; eyes: V3; up: V3 }
interface PoseSpec {
  l?: ArmGoal; r?: ArmGoal;
  neck?: V3; head?: V3;      // extra rotation as [pitch (nod down +), yaw, roll], about world axes
  phone?: PhoneGoal;
}
const POSES: Record<PoseName, PoseSpec> = {
  // Phone at the right ear.
  talk: {
    r: { ref: 'head', at: [-0.40, 0.12, 0.06], pole: [-0.4, -1, -0.5] },
    head: [0, 0.06, 0.12],
    phone: { slide: 0.12, eyes: [0, 0.3, 0], up: [0, 1, -0.1] },
  },
  // Both hands in front of the chest, head down over the phone.
  text: {
    l: { ref: 'head', at: [0.19, -0.80, 0.70], pole: [0.5, -1, -0.3] },
    r: { ref: 'head', at: [-0.19, -0.80, 0.70], pole: [-0.5, -1, -0.3] },
    neck: [0.25, 0, 0], head: [0.45, 0.04, 0],
    phone: { mid: true, slide: 0.1, eyes: [0, 0.3, 0.35], up: [0, 0.6, 0.8] },
  },
  // Right arm out in front holding the phone at face height (filming / selfie).
  film: {
    r: { ref: 'head', at: [-0.26, 0.05, 1.05], pole: [-0.6, -1, -0.2] },
    head: [0.05, 0, 0],
    phone: { slide: 0.12, eyes: [0, 0.3, 0.35], up: [0, 1, 0.1] },
  },
  // Influencer: hand on hip, other hand gesturing at the tripod camera.
  inf: {
    l: { ref: 'head', at: [0.42, -0.6, 0.55], pole: [0.6, -1, -0.1] },
    r: { ref: 'hips', at: [-0.55, 0.62, 0.10], pole: [-1, 0, -0.3] },
    head: [-0.1, 0, -0.05],
  },
  // Hit by the horn: both arms thrown up.
  scared: {
    l: { ref: 'head', at: [0.55, 0.85, 0.15], pole: [1, 0, 0] },
    r: { ref: 'head', at: [-0.55, 0.85, 0.15], pole: [-1, 0, 0] },
  },
};

const X = new THREE.Vector3(1, 0, 0), Y = new THREE.Vector3(0, 1, 0), Z = new THREE.Vector3(0, 0, 1);
const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpV = new THREE.Vector3(), tmpV2 = new THREE.Vector3();

function rotateWorld(bone: THREE.Object3D, delta: THREE.Quaternion) {
  bone.getWorldQuaternion(tmpQ).premultiply(delta);
  bone.parent!.getWorldQuaternion(tmpQ2).invert();
  bone.quaternion.copy(tmpQ2.multiply(tmpQ));
  bone.updateMatrixWorld(true);
}
// Rotate `bone` about its own origin so that the segment bone -> child points along `dir`.
function aim(bone: THREE.Object3D, child: THREE.Object3D, dir: THREE.Vector3) {
  bone.getWorldPosition(tmpV);
  child.getWorldPosition(tmpV2);
  tmpV2.sub(tmpV).normalize();
  rotateWorld(bone, new THREE.Quaternion().setFromUnitVectors(tmpV2, dir.clone().normalize()));
}
function tilt(bone: THREE.Object3D, [pitch, yaw, roll]: V3) {
  rotateWorld(bone, new THREE.Quaternion().setFromAxisAngle(X, pitch));
  rotateWorld(bone, new THREE.Quaternion().setFromAxisAngle(Y, yaw));
  rotateWorld(bone, new THREE.Quaternion().setFromAxisAngle(Z, roll));
}
// Two-bone IK: put the palm at `target`, with the elbow bent towards `pole`.
function solveArm(rig: THREE.Object3D, side: 'L' | 'R', target: THREE.Vector3, pole: THREE.Vector3) {
  const upper = rig.getObjectByName('UpperArm' + side)!, lower = rig.getObjectByName('LowerArm' + side)!, palm = rig.getObjectByName('Palm' + side)!;
  const s = upper.getWorldPosition(new THREE.Vector3());
  const a = s.distanceTo(lower.getWorldPosition(new THREE.Vector3()));
  const b = lower.getWorldPosition(new THREE.Vector3()).distanceTo(palm.getWorldPosition(new THREE.Vector3()));
  const to = target.clone().sub(s);
  const d = THREE.MathUtils.clamp(to.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  const n = to.normalize();
  const along = (a * a - b * b + d * d) / (2 * d);
  const height = Math.sqrt(Math.max(a * a - along * along, 0));
  const bend = pole.clone().addScaledVector(n, -pole.dot(n)).normalize();
  const elbow = s.clone().addScaledVector(n, along).addScaledVector(bend, height);
  const wrist = s.clone().addScaledVector(n, d);
  aim(upper, lower, elbow.clone().sub(s));
  aim(lower, palm, wrist.sub(elbow));
}
const v3 = ([x, y, z]: V3) => new THREE.Vector3(x, y, z);

// Position/orientation of a world-space transform relative to `bone`.
function relativeTo(bone: THREE.Object3D, position: THREE.Vector3, quaternion: THREE.Quaternion): Mount {
  bone.updateWorldMatrix(true, false);
  const inv = bone.matrixWorld.clone().invert();
  const m = new THREE.Matrix4().compose(position, quaternion, new THREE.Vector3(1, 1, 1)).premultiply(inv);
  const out: Mount = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() };
  m.decompose(out.position, out.quaternion, new THREE.Vector3());
  return out;
}

function phoneMount(rig: THREE.Object3D, goal: PhoneGoal): Mount {
  const palmR = rig.getObjectByName('PalmR')!, palmL = rig.getObjectByName('PalmL')!;
  const head = rig.getObjectByName('Head')!;
  const pR = palmR.getWorldPosition(new THREE.Vector3());
  const dir = rig.getObjectByName('MiddleHandR')!.getWorldPosition(new THREE.Vector3()).sub(pR).normalize();
  const center = goal.mid ? pR.clone().add(palmL.getWorldPosition(new THREE.Vector3())).multiplyScalar(0.5) : pR.clone();
  center.addScaledVector(dir, goal.slide);
  const eyes = head.getWorldPosition(new THREE.Vector3()).add(v3(goal.eyes));
  // The screen faces the eyes; the phone's long axis follows `up`.
  const zAxis = eyes.sub(center).normalize();
  const up = v3(goal.up);
  const yAxis = up.addScaledVector(zAxis, -up.dot(zAxis)).normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
  return relativeTo(palmR, center, q);
}

function trackFor(bone: THREE.Object3D) {
  const q = bone.quaternion;
  return new THREE.QuaternionKeyframeTrack(`${bone.name}.quaternion`, [0, 1], [q.x, q.y, q.z, q.w, q.x, q.y, q.z, q.w]);
}
const without = (clip: THREE.AnimationClip, names: Set<string>, tag: string) =>
  new THREE.AnimationClip(`${clip.name}_${tag}`, clip.duration, clip.tracks.filter((t) => !names.has(t.name.split('.')[0])));

function bakePoses(kit: Kit) {
  const rig = cloneSkinned(kit.scene);
  rig.updateMatrixWorld(true);
  const bone = (n: string) => rig.getObjectByName(n)!;
  const restQ = new Map<THREE.Object3D, THREE.Quaternion>();
  rig.traverse((o) => { if ((o as THREE.Bone).isBone) restQ.set(o, o.quaternion.clone()); });
  const head0 = bone('Head').getWorldPosition(new THREE.Vector3());
  const hips0 = bone('Hips').getWorldPosition(new THREE.Vector3());

  bone('Head').parent!.getWorldQuaternion(kit.neckWorld);
  // Cap peak: forehead, a little above the head bone.
  kit.bill = relativeTo(bone('Head'), head0.clone().add(new THREE.Vector3(0, 0.44, 0.34)), new THREE.Quaternion().setFromAxisAngle(X, 0.15));

  // Props held in the right hand. They are fixed to the palm, so they are placed while the character is in the run pose
  // where the right forearm points furthest forward, and follow the arm as it pumps. `axis` is the prop's own pointing
  // direction, `dir` where that should point at that moment (character space, +z forward), `back` how far (world
  // units) the grip is from the prop's origin.
  const runner = new THREE.AnimationMixer(rig);
  runner.clipAction(kit.clips.run).play();
  const forearm = (): THREE.Vector3 => bone('PalmR').getWorldPosition(new THREE.Vector3()).sub(bone('LowerArmR').getWorldPosition(new THREE.Vector3())).normalize();
  let holdTime = 0, forward = -2;
  for (let i = 0; i < 24; i++) {
    runner.setTime((kit.clips.run.duration * i) / 24);
    rig.updateMatrixWorld(true);
    const f = forearm().dot(Z);
    if (f > forward) { forward = f; holdTime = (kit.clips.run.duration * i) / 24; }
  }
  runner.setTime(holdTime);
  rig.updateMatrixWorld(true);
  const palm = bone('PalmR').getWorldPosition(new THREE.Vector3());
  const grip = (axis: THREE.Vector3, dir: V3, back: number): Mount => {
    const d = v3(dir).normalize();
    const q = new THREE.Quaternion().setFromUnitVectors(axis, d);
    return relativeTo(bone('PalmR'), palm.clone().addScaledVector(d, -back / kit.scale), q);
  };
  kit.grips.bat = grip(Y, [0, 0.8, 0.6], 0.2);
  kit.grips.horn = grip(X, [0, 0.4, 0.9], 0);
  kit.grips.gun = grip(new THREE.Vector3(0, 0, -1), [0, 0.05, 1], 0);
  runner.stopAllAction();
  runner.uncacheRoot(rig);
  restQ.forEach((q, o) => o.quaternion.copy(q));
  rig.updateMatrixWorld(true);

  for (const name of Object.keys(POSES) as PoseName[]) {
    const spec = POSES[name];
    restQ.forEach((q, o) => o.quaternion.copy(q));
    rig.updateMatrixWorld(true);
    const affected = new Set<string>();
    for (const side of ['L', 'R'] as const) {
      const goal = side === 'L' ? spec.l : spec.r;
      if (!goal) continue;
      const origin = goal.ref === 'head' ? head0 : hips0;
      solveArm(rig, side, origin.clone().add(v3(goal.at)), v3(goal.pole));
      affected.add('UpperArm' + side); affected.add('LowerArm' + side);
    }
    if (spec.neck) { tilt(bone('Neck'), spec.neck); affected.add('Neck'); }
    if (spec.head) { tilt(bone('Head'), spec.head); affected.add('Head'); }
    const tracks = [...affected].map((n) => trackFor(bone(n)));
    kit.poses[name] = {
      pose: new THREE.AnimationClip(`pose_${name}`, 1, tracks),
      idle: without(kit.clips.idle, affected, name),
      walk: without(kit.clips.walk, affected, name),
      phone: spec.phone ? phoneMount(rig, spec.phone) : null,
    };
  }
}
