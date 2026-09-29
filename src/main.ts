import './style.css';
import * as THREE from 'three';

function showError(msg: string) {
  let box = document.getElementById('err');
  if (!box) {
    box = document.createElement('div');
    box.id = 'err';
    document.getElementById('wrap')!.appendChild(box);
  }
  box.textContent = 'Error: ' + msg;
}
window.addEventListener('error', (e) => showError(e.message));
window.addEventListener('unhandledrejection', (e: any) => showError(String(e.reason)));

// ---------- palette ----------
const COL = {
  fog: 0xd6cdc0,
  floor: 0xc4b8a4, grout: 0xb3a690,
  shelf: 0x6d5846,
  shelfMetal: 0x8a8176, ceil: 0xc9c0b3, light: 0xfff4d2,
  player: 0xff5a3c, playerPants: 0x2a3140, playerSkin: 0xf0c4a0,
  talk: 0x3d9a68, text: 0xd4922a, selfie: 0xc94a56,
  head: 0xe8c09a, phone: 0x7ec8ff,
  goods: [0xe05a4f, 0xf0c14b, 0x4a9d6e, 0x3d7ea6, 0xc46b2d, 0x8b5a9f, 0xf4f0e6, 0x2f6f6a],
  sky: 0x7eb7e0, road: 0x3c424c, walk: 0xd9cbb0, curb: 0xc2b59a,
  stucco: [0xe8d5c4, 0xd4c4b0, 0xc9b8a4, 0xead9c8],
  window: 0x8ec8e8, palm: 0x2f7a4a, trunk: 0x8a5a32,
};
const SKINS = [0xf0c4a0, 0xe0b089, 0xc68642, 0x8d5524, 0xf5d0b0, 0xd4a574];
const PANTS = [0x2c3340, 0x3e4a3a, 0x4a3b32, 0x1f2a38, 0x5a4e45];
const HAIR = [0x1a1410, 0x3b2416, 0x5a3a22, 0x2b2b2b, 0x6e4a2e, 0xc8c2b4];
const BIKINIS = [0xff4d8a, 0xffef6a, 0x4fd2ff, 0xffffff, 0xff6b3d, 0xe85ad0, 0x2ad4c8];
const LONG_HAIR = [0x1a1410, 0x3b2416, 0xc8a050, 0x6e4a2e, 0x2b2b2b, 0xd4c4a0, 0x8b3a22];

// ---------- feel knobs ----------
const STEER_MAX_SPEED = 5.5;      // was 12 — a tap should nudge, not leap
const STEER_ACCEL = 48;           // was 140 — hold to get up to speed
const STEER_DECEL = 160;          // stop quickly when you let go
const STEER_REVERSE = 80;         // was 220 — A↔D is gentler
const STEER_TAP_BUFFER = 0.02;    // was 0.07 — don't keep sliding after a tap
const STEER_TOUCH_SPAN = 8;       // full-screen drag = this many world units (aisle is ~8)
const STEER_TOUCH_FOLLOW = 36;    // how fast we catch the finger
const STEER_TOUCH_DEAD_PX = 10;   // ignore tiny finger jitter
const STEER_FLICK = 0.55;         // leftover slide after a swipe (not a hold)
const STEER_LEAN = 0.22;
const STEER_YAW = 0.14;
const STEER_LEAN_SMOOTH = 18;

const CAM_FOV = 48;
const CAM_MIN_HFOV = 42;
const CAM_HEIGHT = 4.6;
const CAM_BACK_Z = 10.4;
const CAM_LOOK_Z = 0.5;
const CAM_LOOK_Y = 1.25;
const CAM_FOLLOW_X = 0.18;
const CAM_LOOK_X = 0.75;
const CAM_FOLLOW_RATE = 6;
const FOG_NEAR = 28;
const FOG_FAR = 72;

const SPEED = 6.5;                // walk stays put — crowd is the ramp
const CROWD_RAMP_DIST = 560;      // metres to go from 1 person to a full wave
const SPAWN_FILL_START = 1;
const SPAWN_FILL_END = 4;
const SPAWN_GAP = 1.1;
const SPAWN_Z = -18;              // appear just ahead in the fog (was -200)

const AISLE_W = 9.4;
const SHELF_X = 6.5;
const CLAMP_X = 4.0;
const SEG_LEN = 20, SEG_N = 10, WORLD_BACK = -SEG_N * SEG_LEN;

const POWERS: any = {
  shoulder: { name: 'SHOVE', yell: 'SHOVE!', cd: 2.4, reach: 8, halfW: 2.2, shake: 0.28 },
  cart:     { name: 'BAT',   yell: 'WHACK!', cd: 4.2, reach: 14, halfW: 4.4, shake: 0.5, rush: 1.5 },
  horn:     { name: 'HORN',  yell: 'HONK!', cd: 3.6, reach: 10, halfW: 7.2, shake: 0.35, radial: true },
  gun:      { name: 'GUN',   yell: 'GUN!', cd: 0, reach: 0, halfW: 0, shake: 0.15 },
  bomb:     { name: 'BOMB',  yell: 'BOOM!', cd: 5, reach: 99, halfW: 99, shake: 0.8 },
};
const LIVES_MAX = 5;
const TALK_DRIFT = 2.2;
const TALK_DRIFT_RATE = 1.55;
const CART_LAUNCH = 22;
const CART_GRAVITY = 16;
const GUN_DURATION = 10;
const GUN_RATE = 0.11;
const GUN_SPEED = 38;
const GUN_HIT_X = 0.95;
const GUN_HIT_Z = 1.0;
const GUN_STACK_MAX = 20;
const GUN_PACK_MORE = 1.2;        // 20% more people while spraying
const GUN_PACK_GAP = 1.05;
const GUN_PACK_FILL = 2;          // a pair in front, not a wall
const GUN_PACK_ROWS = 1;
const GUN_PACK_ROW_Z = 1.15;
const GUN_PACK_SQUEEZE = 0.5;     // pull them into the spray line
const GUN_PACK_Z_JITTER = 0.4;
const GUN_PACK_LANES = [1, 2, 3]; // extra slot for the 20% third
const GUN_CLEAR_NEAR = -5;        // already this close = blasted on pickup
const GUN_START_INVULN = 0.45;
const LEVEL2_AT = 500;            // total score to clear the aisle
const LEVEL_CLEAR_T = 3.4;
const LIVES_CAP = 6;
const INF_DRIFT = 1.9;
const INF_DRIFT_RATE = 1.15;
const LEVEL2_KIT = ['cart', 'horn', 'bomb'];

function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
function toward(cur: number, goal: number, step: number) {
  if (cur < goal) return Math.min(goal, cur + step);
  if (cur > goal) return Math.max(goal, cur - step);
  return goal;
}
function mat(color: number, extras?: any) {
  return new THREE.MeshLambertMaterial({ color, ...extras });
}

// ---------- renderer / scene ----------
const wrap = document.getElementById('wrap') as HTMLDivElement;
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
wrap.insertBefore(renderer.domElement, wrap.firstChild);

const scene = new THREE.Scene();
scene.background = new THREE.Color(COL.fog);
scene.fog = new THREE.Fog(COL.fog, FOG_NEAR, FOG_FAR);

const camera = new THREE.PerspectiveCamera(CAM_FOV, 1, 0.1, 200);
const camBase = new THREE.Vector3(0, CAM_HEIGHT, CAM_BACK_Z);
camera.position.copy(camBase);
camera.lookAt(0, CAM_LOOK_Y, CAM_LOOK_Z);

const hemi = new THREE.HemisphereLight(0xf4ebe0, 0x6a5c4e, 0.95);
scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff2d4, 0.7);
sun.position.set(-6, 22, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
const sc = sun.shadow.camera as THREE.OrthographicCamera;
sc.left = -20; sc.right = 20; sc.top = 24; sc.bottom = -16; sc.near = 1; sc.far = 70;
scene.add(sun); scene.add(sun.target);

function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  camera.aspect = Math.max(w / Math.max(h, 1), 0.05);
  const minH = THREE.MathUtils.degToRad(CAM_MIN_HFOV);
  const vFromH = 2 * Math.atan(Math.tan(minH / 2) / camera.aspect);
  camera.fov = Math.max(CAM_FOV, THREE.MathUtils.radToDeg(vFromH));
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ---------- aisle ----------
const scroll: any[] = [];
const matFloor = mat(COL.floor);
const matGrout = mat(COL.grout);
const matShelf = mat(COL.shelf);
const matMetal = mat(COL.shelfMetal);
const matCeil = mat(COL.ceil);
const matLight = new THREE.MeshBasicMaterial({ color: COL.light });
const goodsMats = COL.goods.map((c) => mat(c));

function makeSegment(i: number): any {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, SEG_LEN), matFloor);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  for (let t = 0; t < 4; t++) {
    const line = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, 0.045), matGrout);
    line.rotation.x = -Math.PI / 2;
    line.position.set(0, 0.012, -SEG_LEN / 2 + 2.4 + t * 5);
    g.add(line);
  }
  [-1, 1].forEach((s) => {
    const back = new THREE.Mesh(new THREE.BoxGeometry(2.6, 3.3, SEG_LEN - 0.2), matShelf);
    back.position.set(s * SHELF_X, 1.65, 0);
    back.castShadow = true; back.receiveShadow = true; g.add(back);
    for (let r = 0; r < 4; r++) {
      const plank = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.07, SEG_LEN - 0.3), matMetal);
      plank.position.set(s * (SHELF_X - 1.15), 0.38 + r * 0.78, 0);
      g.add(plank);
      for (let p = 0; p < 4; p++) {
        const box = new THREE.Mesh(
          new THREE.BoxGeometry(0.62, 0.42, 1.35),
          goodsMats[(i + r + p + (s > 0 ? 3 : 0)) % goodsMats.length],
        );
        box.position.set(s * (SHELF_X - 1.2), 0.64 + r * 0.78, -SEG_LEN / 2 + 2.6 + p * 5);
        box.castShadow = true; g.add(box);
      }
    }
  });
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(AISLE_W + 12, 0.18, SEG_LEN), matCeil);
  ceil.position.y = 16.5; g.add(ceil);
  const fixture = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 8), matLight);
  fixture.position.set(0, 13.2, 0); g.add(fixture);
  return g;
}
const matSkyWin = new THREE.MeshBasicMaterial({ color: COL.window });
const matRoad = mat(COL.road);
const matWalk = mat(COL.walk);
const matCurb = mat(COL.curb);
const matTrunk = mat(COL.trunk);
const matPalm = mat(COL.palm);
const matBuild = COL.stucco.map((c) => mat(c));
const matLamp = mat(0xf4e4b8);
const matPole = mat(0x4a4e56);

function makeStreetSegment(i: number): any {
  const g = new THREE.Group();
  const road = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 2, SEG_LEN), matRoad);
  road.rotation.x = -Math.PI / 2; road.receiveShadow = true; g.add(road);
  [-1, 1].forEach((s) => {
    const walk = new THREE.Mesh(new THREE.PlaneGeometry(4.6, SEG_LEN), matWalk);
    walk.rotation.x = -Math.PI / 2;
    walk.position.set(s * (AISLE_W * 0.5 + 1.6), 0.01, 0);
    walk.receiveShadow = true; g.add(walk);
    const curb = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, SEG_LEN), matCurb);
    curb.position.set(s * (AISLE_W * 0.5 + 0.15), 0.06, 0); g.add(curb);
    const bcol = matBuild[(i + (s > 0 ? 2 : 0)) % matBuild.length];
    const bldg = new THREE.Mesh(new THREE.BoxGeometry(3.4, 7.2, SEG_LEN - 1.2), bcol);
    bldg.position.set(s * (SHELF_X + 0.4), 3.6, 0);
    bldg.castShadow = true; bldg.receiveShadow = true; g.add(bldg);
    for (let r = 0; r < 3; r++) {
      for (let w = 0; w < 3; w++) {
        const win = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.08), matSkyWin);
        win.position.set(s * (SHELF_X - 1.15), 1.4 + r * 1.85, -SEG_LEN / 2 + 4 + w * 4.2);
        g.add(win);
      }
    }
    const awn = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 3.2), mat(BIKINIS[(i + 2) % BIKINIS.length]));
    awn.position.set(s * (SHELF_X - 1.4), 2.55, -2 + (i % 2) * 4);
    awn.rotation.z = s * -0.18; g.add(awn);
    const lamp = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 4.2, 6), matPole);
    pole.position.y = 2.1; lamp.add(pole);
    const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.9), matPole);
    arm.position.set(-s * 0.4, 4.15, 0); lamp.add(arm);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 6), matLamp);
    bulb.position.set(-s * 0.75, 4.05, 0); lamp.add(bulb);
    lamp.position.set(s * (AISLE_W * 0.5 + 0.7), 0, -SEG_LEN / 2 + 5 + (i % 2) * 6);
    g.add(lamp);
    if (i % 2 === (s > 0 ? 0 : 1)) {
      const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.12, 2.4, 6), matTrunk);
      trunk.position.set(s * (SHELF_X - 2.2), 1.2, 4); g.add(trunk);
      const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.85, 8, 6), matPalm);
      leaves.scale.set(1.1, 0.45, 1.1);
      leaves.position.set(s * (SHELF_X - 2.2), 2.55, 4); g.add(leaves);
    }
  });
  for (let t = 0; t < 4; t++) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 1.4), mat(0xe8e0c8));
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(0, 0.02, -SEG_LEN / 2 + 2.2 + t * 5);
    g.add(dash);
  }
  return g;
}

let worldLevel = 1;
function setTheme(lv: number) {
  if (lv === 2) {
    scene.background = new THREE.Color(COL.sky);
    scene.fog = new THREE.Fog(COL.sky, 22, 85);
    hemi.color.setHex(0xfff1dc);
    hemi.groundColor.setHex(0x6a8a6e);
    hemi.intensity = 1.05;
    sun.intensity = 1.05;
    sun.position.set(8, 24, 6);
  } else {
    scene.background = new THREE.Color(COL.fog);
    scene.fog = new THREE.Fog(COL.fog, FOG_NEAR, FOG_FAR);
    hemi.color.setHex(0xf4ebe0);
    hemi.groundColor.setHex(0x6a5c4e);
    hemi.intensity = 0.95;
    sun.intensity = 0.7;
    sun.position.set(-6, 22, 8);
  }
}
function buildWorld(lv: number) {
  for (const s of scroll) scene.remove(s);
  scroll.length = 0;
  for (let i = 0; i < SEG_N; i++) {
    const s = lv === 2 ? makeStreetSegment(i) : makeSegment(i);
    s.position.z = -i * SEG_LEN; scene.add(s); scroll.push(s);
  }
  worldLevel = lv;
  setTheme(lv);
}
buildWorld(1);

// ---------- people (low-poly adult, shared geos) ----------
const GEO = {
  hip: new THREE.BoxGeometry(0.38, 0.16, 0.22),
  torso: new THREE.BoxGeometry(0.42, 0.52, 0.25),
  thigh: new THREE.CylinderGeometry(0.075, 0.09, 0.44, 8),
  calf: new THREE.CylinderGeometry(0.062, 0.075, 0.4, 8),
  shoe: new THREE.BoxGeometry(0.13, 0.08, 0.26),
  uarm: new THREE.CylinderGeometry(0.05, 0.058, 0.3, 7),
  larm: new THREE.CylinderGeometry(0.042, 0.05, 0.28, 7),
  hand: new THREE.SphereGeometry(0.05, 7, 6),
  neck: new THREE.CylinderGeometry(0.065, 0.075, 0.11, 7),
  head: new THREE.SphereGeometry(0.19, 12, 10),
  hair: new THREE.SphereGeometry(0.2, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.58),
  eye: new THREE.SphereGeometry(0.026, 6, 5),
  phone: new THREE.BoxGeometry(0.09, 0.17, 0.018),
  blob: new THREE.CircleGeometry(0.3, 12),
};
const matEye = mat(0x1c1410);
const matBlob = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.2 });
const matPhone = new THREE.MeshBasicMaterial({ color: COL.phone });

function limb(geo: THREE.BufferGeometry, color: number, y: number) {
  const m = new THREE.Mesh(geo, mat(color));
  m.position.y = y; m.castShadow = true;
  return m;
}

function makePerson(shirtColor: number, isPlayer: boolean): any {
  const g: any = new THREE.Group();
  const skin = isPlayer ? COL.playerSkin : SKINS[(Math.random() * SKINS.length) | 0];
  const pants = isPlayer ? COL.playerPants : PANTS[(Math.random() * PANTS.length) | 0];
  const hairC = isPlayer ? shirtColor : HAIR[(Math.random() * HAIR.length) | 0];

  const blob = new THREE.Mesh(GEO.blob, matBlob);
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; g.add(blob);

  function makeLeg(side: number) {
    const root = new THREE.Group();
    root.position.set(side * 0.11, 0.94, 0);
    root.add(limb(GEO.thigh, pants, -0.22));
    root.add(limb(GEO.calf, pants, -0.62));
    const shoe = new THREE.Mesh(GEO.shoe, mat(0x1a1a1a));
    shoe.position.set(0, -0.84, 0.04); shoe.castShadow = true; root.add(shoe);
    return root;
  }
  const lLeg = makeLeg(-1), rLeg = makeLeg(1);
  g.add(lLeg); g.add(rLeg);

  const hips = new THREE.Mesh(GEO.hip, mat(pants));
  hips.position.y = 0.94; hips.castShadow = true; g.add(hips);

  const upper = new THREE.Group();
  upper.position.y = 0.94;
  g.add(upper);

  const torso = new THREE.Mesh(GEO.torso, mat(shirtColor));
  torso.position.y = 0.36; torso.castShadow = true; upper.add(torso);

  function makeArm(side: number) {
    const root = new THREE.Group();
    root.position.set(side * 0.26, 0.56, 0);
    root.add(limb(GEO.uarm, shirtColor, -0.16));
    const low = new THREE.Group();
    low.position.y = -0.32;
    low.add(limb(GEO.larm, skin, -0.12));
    const hand = new THREE.Mesh(GEO.hand, mat(skin));
    hand.position.y = -0.28; low.add(hand);
    root.add(low);
    root.userData.low = low; root.userData.hand = hand;
    return root;
  }
  const lArm = makeArm(-1), rArm = makeArm(1);
  upper.add(lArm); upper.add(rArm);

  const neck = new THREE.Mesh(GEO.neck, mat(skin));
  neck.position.y = 0.68; upper.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.88;
  const skull = new THREE.Mesh(GEO.head, mat(skin));
  skull.scale.set(1, 1.12, 0.96); skull.castShadow = true; head.add(skull);
  const hair = new THREE.Mesh(GEO.hair, mat(hairC));
  hair.position.y = 0.04; head.add(hair);
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(GEO.eye, matEye);
    eye.position.set(s * 0.065, 0.02, 0.155); head.add(eye);
  });
  upper.add(head);

  if (!isPlayer) {
    const phone = new THREE.Mesh(GEO.phone, matPhone);
    rArm.userData.hand.add(phone);
    phone.position.set(0, 0, 0.07);
    g.userData.phone = phone;
  } else {
    hair.material = mat(shirtColor);
    const bill = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.03, 0.16), mat(shirtColor));
    bill.position.set(0, 0.08, 0.12); head.add(bill);
  }

  g.userData.head = head;
  g.userData.body = torso;
  g.userData.upper = upper;
  g.userData.lLeg = lLeg; g.userData.rLeg = rLeg;
  g.userData.lArm = lArm; g.userData.rArm = rArm;
  g.userData.inf = false;
  return g;
}

function makeInfluencer(): any {
  const g: any = new THREE.Group();
  const female = Math.random() < 0.86;
  const skin = SKINS[(Math.random() * SKINS.length) | 0];
  const kit = BIKINIS[(Math.random() * BIKINIS.length) | 0];
  const hairC = LONG_HAIR[(Math.random() * LONG_HAIR.length) | 0];

  const blob = new THREE.Mesh(GEO.blob, matBlob);
  blob.rotation.x = -Math.PI / 2; blob.position.y = 0.02; g.add(blob);

  function makeLeg(side: number) {
    const root = new THREE.Group();
    root.position.set(side * (female ? 0.13 : 0.11), 0.94, 0);
    root.add(limb(GEO.thigh, skin, -0.22));
    root.add(limb(GEO.calf, skin, -0.62));
    const shoe = new THREE.Mesh(GEO.shoe, mat(female ? 0xf2d4a8 : 0x1a1a1a));
    shoe.position.set(0, -0.84, 0.05); shoe.scale.set(0.9, 0.7, 1.05); shoe.castShadow = true; root.add(shoe);
    return root;
  }
  const lLeg = makeLeg(-1), rLeg = makeLeg(1);
  g.add(lLeg); g.add(rLeg);

  const hips = new THREE.Mesh(new THREE.BoxGeometry(female ? 0.46 : 0.38, 0.16, 0.24), mat(skin));
  hips.position.y = 0.94; hips.castShadow = true; g.add(hips);
  const bottom = new THREE.Mesh(new THREE.BoxGeometry(female ? 0.44 : 0.36, 0.12, 0.22), mat(kit));
  bottom.position.y = 0.93; g.add(bottom);

  const upper = new THREE.Group();
  upper.position.y = 0.94;
  g.add(upper);

  const torso = new THREE.Mesh(new THREE.BoxGeometry(female ? 0.34 : 0.4, 0.48, 0.2), mat(skin));
  torso.position.y = 0.36; torso.castShadow = true; upper.add(torso);
  if (female) {
    [-1, 1].forEach((s) => {
      const cup = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), mat(kit));
      cup.scale.set(1.05, 0.85, 0.9);
      cup.position.set(s * 0.1, 0.48, 0.08); cup.castShadow = true; upper.add(cup);
    });
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.04), mat(kit));
    strap.position.set(0, 0.58, 0.02); upper.add(strap);
  } else {
    const tank = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.3, 0.22), mat(kit));
    tank.position.y = 0.42; upper.add(tank);
  }

  function makeArm(side: number) {
    const root = new THREE.Group();
    root.position.set(side * (female ? 0.24 : 0.26), 0.56, 0);
    root.add(limb(GEO.uarm, skin, -0.16));
    const low = new THREE.Group();
    low.position.y = -0.32;
    low.add(limb(GEO.larm, skin, -0.12));
    const hand = new THREE.Mesh(GEO.hand, mat(skin));
    hand.position.y = -0.28; low.add(hand);
    root.add(low);
    root.userData.low = low; root.userData.hand = hand;
    return root;
  }
  const lArm = makeArm(-1), rArm = makeArm(1);
  upper.add(lArm); upper.add(rArm);

  const neck = new THREE.Mesh(GEO.neck, mat(skin));
  neck.position.y = 0.68; upper.add(neck);

  const head = new THREE.Group();
  head.position.y = 0.88;
  const skull = new THREE.Mesh(GEO.head, mat(skin));
  skull.scale.set(female ? 0.96 : 1, 1.12, 0.96); skull.castShadow = true; head.add(skull);
  const hair = new THREE.Mesh(GEO.hair, mat(hairC));
  hair.position.y = 0.05; hair.scale.set(1.08, 1.05, 1.08); head.add(hair);
  if (female) {
    const fall = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), mat(hairC));
    fall.scale.set(0.85, 1.35, 0.7);
    fall.position.set(0, -0.12, -0.1); head.add(fall);
  }
  [-1, 1].forEach((s) => {
    const eye = new THREE.Mesh(GEO.eye, matEye);
    eye.position.set(s * 0.065, 0.02, 0.155); head.add(eye);
  });
  const shades = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.05, 0.06), mat(0x1a1a1a));
  shades.position.set(0, 0.04, 0.16); head.add(shades);
  upper.add(head);

  const tri = new THREE.Group();
  const matBlack = mat(0x222226);
  const matSilver = mat(0x9aa3ab);
  [-1, 0, 1].forEach((s) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.02, 1.05, 5), matBlack);
    leg.position.set(s * 0.14, 0.52, 0.55 + Math.abs(s) * 0.04);
    leg.rotation.z = s * 0.28;
    leg.rotation.x = 0.18;
    tri.add(leg);
  });
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.42, 6), matSilver);
  pole.position.set(0, 1.22, 0.58); tri.add(pole);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.018, 6, 14), mat(0xf4f0e6));
  ring.position.set(0, 1.46, 0.5); tri.add(ring);
  const cam = new THREE.Mesh(GEO.phone, matPhone);
  cam.position.set(0, 1.46, 0.48);
  cam.rotation.x = 0.35;
  tri.add(cam);
  g.add(tri);

  g.userData.head = head;
  g.userData.body = torso;
  g.userData.upper = upper;
  g.userData.lLeg = lLeg; g.userData.rLeg = rLeg;
  g.userData.lArm = lArm; g.userData.rArm = rArm;
  g.userData.phone = cam;
  g.userData.inf = true;
  g.userData.female = female;
  return g;
}

const player: any = makePerson(COL.player, true);
player.position.set(0, 0, 6.5);
scene.add(player);

function makeBatModel() {
  const g = new THREE.Group();
  const metal = mat(0xd8e2ea);
  const tape = mat(0x2a241c);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), tape);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.32, 8), tape);
  handle.position.y = 0.18;
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.07, 0.36, 8), metal);
  shaft.position.y = 0.51;
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.074, 0.52, 8), metal);
  barrel.position.y = 0.94;
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.074, 8, 6), metal);
  cap.position.y = 1.19;
  const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.045, 8), mat(0x3d8ec9));
  stripe.position.y = 0.76;
  g.add(knob); g.add(handle); g.add(shaft); g.add(barrel); g.add(cap); g.add(stripe);
  [knob, handle, shaft, barrel, cap, stripe].forEach((m) => { m.castShadow = true; });
  return g;
}
function makeHornModel() {
  const g = new THREE.Group();
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), mat(0xe23b2f));
  bulb.position.set(-0.2, 0, 0);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.055, 0.13, 8), mat(0x1a1a1a));
  neck.rotation.z = Math.PI / 2;
  neck.position.set(-0.04, 0, 0);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.05, 0.3, 12), mat(0xffd24a));
  bell.rotation.z = Math.PI / 2;
  bell.position.set(0.18, 0, 0);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.028, 6, 14), mat(0xffe27a));
  lip.rotation.y = Math.PI / 2;
  lip.position.set(0.33, 0, 0);
  g.add(bulb); g.add(neck); g.add(bell); g.add(lip);
  [bulb, neck, bell, lip].forEach((m) => { m.castShadow = true; });
  return g;
}

const batProp = makeBatModel();
batProp.position.set(0.36, 0.7, 0.18);
batProp.rotation.set(-0.95, 0.2, -0.55);
player.add(batProp);
batProp.visible = false;

const hornProp = makeHornModel();
hornProp.scale.setScalar(0.55);
hornProp.position.set(0.32, 1.28, 0.28);
hornProp.rotation.set(0.15, -0.4, 0.35);
player.add(hornProp);
hornProp.visible = false;

const gunProp = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.42), mat(0x2c2c2c));
  body.position.set(0.22, 1.2, 0.35); gunProp.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.38), mat(0x555555));
  barrel.position.set(0.22, 1.22, 0.05); gunProp.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.22, 0.12), mat(0x1a1a1a));
  grip.position.set(0.22, 1.04, 0.42); gunProp.add(grip);
}
player.add(gunProp);
gunProp.visible = false;

const scareRing = new THREE.Mesh(
  new THREE.RingGeometry(0.25, 0.5, 28),
  new THREE.MeshBasicMaterial({ color: 0xffd24a, transparent: true, opacity: 0, side: THREE.DoubleSide }),
);
scareRing.rotation.x = -Math.PI / 2;
scene.add(scareRing);
let scareT = 0;

const TYPES: any = {
  talk: { color: COL.talk },
  text: { color: COL.text },
  selfie: { color: COL.selfie, blocker: true },
  inf: { color: 0xff4d8a },
};

function applyPose(z: any, type: string) {
  const d = z.userData;
  const rLow = d.rArm.userData.low, lLow = d.lArm.userData.low;
  if (d.upper) d.upper.rotation.set(0, 0, 0);
  d.lArm.rotation.set(0, 0, 0.12);
  d.rArm.rotation.set(0, 0, -0.12);
  if (rLow) rLow.rotation.set(0, 0, 0);
  if (lLow) lLow.rotation.set(0, 0, 0);
  d.head.rotation.set(0, 0, 0);
  if (d.phone && type !== 'inf') { d.phone.visible = true; d.phone.position.set(0, 0, 0.07); d.phone.rotation.set(0, 0, 0); }
  if (type === 'inf') {
    if (d.upper) d.upper.rotation.set(0, 0.08, 0.06);
    d.head.rotation.set(-0.12, 0, 0);
    d.rArm.rotation.set(-0.35, 0.15, -1.15);
    if (rLow) rLow.rotation.set(-0.4, 0, 0);
    d.lArm.rotation.set(-1.55, -0.2, 0.35);
    if (lLow) lLow.rotation.set(-0.5, 0, 0);
    if (d.phone) { d.phone.visible = true; d.phone.rotation.set(0.35, 0, 0); }
  } else if (type === 'talk') {
    if (d.upper) d.upper.rotation.x = 0;
    d.head.rotation.set(0.02, 0.06, 0.12);
    d.rArm.rotation.set(-2.15, 0.5, -0.85);
    if (rLow) rLow.rotation.set(-1.45, 0, 0);
    d.lArm.rotation.set(0.15, 0, 0.22);
    if (d.phone) { d.phone.position.set(0.05, 0.05, 0.02); d.phone.rotation.set(0.5, 1.15, 1.35); }
  } else if (type === 'text') {
    if (d.upper) d.upper.rotation.x = 0;
    d.head.rotation.set(-0.78, 0.05, 0);
    d.rArm.rotation.set(-1.05, 0.22, -0.32);
    if (rLow) rLow.rotation.set(-1.2, 0, 0.12);
    d.lArm.rotation.set(-0.98, -0.18, 0.38);
    if (lLow) lLow.rotation.set(-1.1, 0, -0.08);
    if (d.phone) { d.phone.position.set(0.02, -0.02, 0.08); d.phone.rotation.set(-0.45, 0.18, 0.12); }
  } else {
    if (d.upper) d.upper.rotation.x = -0.08;
    d.head.rotation.set(0.12, 0, 0);
    d.rArm.rotation.set(-2.45, 0.08, -0.12);
    if (rLow) rLow.rotation.set(-0.2, 0, 0);
    if (d.phone) { d.phone.position.set(0, 0.02, 0.08); d.phone.rotation.set(0.15, 0, 0); }
  }
}
const pool: any[] = [];
function getZombie(type: string): any {
  const inf = type === 'inf';
  for (const z of pool) if (!z.active && !!z.userData.inf === inf) return z;
  const g: any = inf ? makeInfluencer() : makePerson(COL.talk, false);
  g.active = false; scene.add(g); pool.push(g); return g;
}

// ---------- pickups ----------
const pickPool: any[] = [];
function makePickupMesh() {
  const g: any = new THREE.Group();
  const bat = makeBatModel();
  bat.scale.setScalar(0.72);
  bat.position.y = 0.08;
  bat.rotation.set(0.15, 0.6, 0.22);
  const horn = makeHornModel();
  horn.position.y = 0.58;
  horn.rotation.y = 0.35;
  const gun = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.55), mat(0x3a3a3a));
  body.position.set(0, 0.62, 0); gun.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.45), mat(0x6a6a6a));
  barrel.position.set(0, 0.66, -0.35); gun.add(barrel);
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.24, 0.14), mat(0x1a1a1a));
  grip.position.set(0, 0.44, 0.16); gun.add(grip);
  const bomb = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0x2a2a2a));
  ball.position.y = 0.55; bomb.add(ball);
  const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), mat(0xff4466));
  fuse.position.y = 0.82; bomb.add(fuse);
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 6), mat(0xffee66));
  spark.position.y = 0.94; bomb.add(spark);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 16), mat(0xffee88));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.08;
  g.add(bat); g.add(horn); g.add(gun); g.add(bomb); g.add(ring);
  g.userData.cartVis = bat; g.userData.hornVis = horn;
  g.userData.gunVis = gun; g.userData.bombVis = bomb; g.userData.ring = ring;
  return g;
}
function getPickup(): any {
  for (const p of pickPool) if (!p.active) return p;
  const g: any = makePickupMesh();
  g.active = false; g.visible = false; scene.add(g); pickPool.push(g); return g;
}

const bullets: any[] = [];
const matBullet = new THREE.MeshBasicMaterial({ color: 0xffee66 });
const geoBullet = new THREE.SphereGeometry(0.09, 6, 6);
function getBullet(): any {
  for (const b of bullets) if (!b.active) return b;
  const m: any = new THREE.Mesh(geoBullet, matBullet);
  m.active = false; m.visible = false; scene.add(m); bullets.push(m); return m;
}
function fireGun() {
  const b = getBullet();
  b.active = true; b.visible = true;
  b.position.set(player.position.x + 0.15, 1.28, player.position.z - 0.6);
  sfxGun();
}

// ---------- state ----------
const S = { menu: 'menu', play: 'play', clear: 'clear', over: 'over' } as const;
type StateT = typeof S[keyof typeof S];
let state: StateT = S.menu;
let dist = 0, speed = SPEED, lives = LIVES_MAX, combo = 0, bestCombo = 0, invuln = 0, shake = 0;
let shoveCd = 0, lastCd = POWERS.shoulder.cd, power = 'shoulder', cartRush = 0;
let gunT = 0, gunCd = 0;
const powerQ: string[] = [];
let vx = 0, lean = 0, tapLeft = 0, tapRight = 0;
let pointerActive = false, pointerX = 0, pointerOriginX = 0, touchAnchorX = 0;
let pointerLastX = 0, pointerLastT = 0, pointerFlick = 0;
let last = performance.now();
const keys: any = {};
let best = 0; try { best = parseInt(localStorage.getItem('sz_best') || '0', 10) || 0; } catch (e) {}
let level = 1, clearT = 0;

const slotsX = [-3.4, -1.7, 0, 1.7, 3.4];
let spawnTimer = 0;
let scoreAcc = 0;
let pickTimer = 0;

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space') { e.preventDefault(); doShove(); }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keys.left = false; tapLeft = STEER_TAP_BUFFER; }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = false; tapRight = STEER_TAP_BUFFER; }
});
wrap.addEventListener('pointerdown', (e) => {
  if (state !== S.play) return;
  if ((e.target as HTMLElement).id === 'shove') return;
  pointerActive = true;
  pointerX = pointerOriginX = pointerLastX = e.clientX;
  pointerLastT = performance.now();
  pointerFlick = 0;
  touchAnchorX = player.position.x;
  try { wrap.setPointerCapture(e.pointerId); } catch (err) {}
  audioResume();
});
wrap.addEventListener('pointermove', (e) => {
  if (!pointerActive) return;
  const t = performance.now();
  const dtm = (t - pointerLastT) / 1000;
  if (dtm > 0.0001) pointerFlick = (e.clientX - pointerLastX) / dtm;
  pointerX = pointerLastX = e.clientX;
  pointerLastT = t;
});
window.addEventListener('pointerup', () => {
  if (pointerActive) {
    const flickU = (pointerFlick / Math.max(wrap.clientWidth, 1)) * STEER_TOUCH_SPAN * STEER_FLICK;
    vx = clamp(flickU, -9, 9);
  }
  pointerActive = false;
});
document.getElementById('shove')!.addEventListener('click', doShove);
document.getElementById('start')!.addEventListener('click', start);
document.getElementById('again')!.addEventListener('click', start);

// ---------- audio ----------
let AC: AudioContext | null = null;
let master: DynamicsCompressorNode | null = null;
let noiseBuf: AudioBuffer | null = null;

function audioResume() {
  try {
    if (!AC) {
      AC = new (window.AudioContext || (window as any).webkitAudioContext)();
      master = AC.createDynamicsCompressor();
      master.threshold.value = -16;
      master.knee.value = 10;
      master.ratio.value = 6;
      master.attack.value = 0.003;
      master.release.value = 0.14;
      master.connect(AC.destination);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function bus() { return master || AC!.destination; }

function tone(freq: number, dur: number, type: OscillatorType, vol: number, when = 0, freqEnd?: number) {
  if (!AC) return;
  const t = AC.currentTime + when;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(bus());
  o.start(t); o.stop(t + dur + 0.03);
}
function holdTone(
  freq: number, dur: number, type: OscillatorType, vol: number, when = 0,
  filt: BiquadFilterType = 'bandpass', ffreq = 700, q = 3, freqEnd?: number,
) {
  if (!AC) return;
  const t = AC.currentTime + when;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  const f = AC.createBiquadFilter(); f.type = filt; f.Q.value = q;
  f.frequency.setValueAtTime(ffreq, t);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.014);
  g.gain.setValueAtTime(vol, t + Math.max(0.04, dur * 0.62));
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(f); f.connect(g); g.connect(bus());
  o.start(t); o.stop(t + dur + 0.05);
}
function burst(dur: number, vol: number, ffreq: number, when = 0, kind: BiquadFilterType = 'lowpass', ffreqEnd?: number, q = 1) {
  if (!AC || !noiseBuf) return;
  const t = AC.currentTime + when;
  const src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = kind; f.Q.value = q;
  f.frequency.setValueAtTime(ffreq, t);
  if (ffreqEnd) f.frequency.exponentialRampToValueAtTime(Math.max(20, ffreqEnd), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(bus());
  src.start(t); src.stop(t + dur + 0.03);
}

function sfxShove() {
  burst(0.12, 0.22, 240, 0, 'lowpass', 55);
  burst(0.05, 0.1, 1600, 0, 'bandpass', 400, 2);
  tone(68, 0.18, 'sine', 0.22);
  tone(36, 0.26, 'sine', 0.14);
}

function sfxCart() {
  burst(0.1, 0.1, 2400, 0, 'highpass', 500);
  burst(0.055, 0.22, 2100, 0.045, 'bandpass', 380, 5);
  tone(210, 0.07, 'triangle', 0.09, 0.045, 80);
  tone(72, 0.2, 'sine', 0.16, 0.045);
  burst(0.12, 0.08, 700, 0.08, 'lowpass', 120);
}

function sfxHorn() {
  const blast = (at: number, dur: number, vol: number) => {
    holdTone(392, dur, 'sawtooth', vol * 0.16, at, 'bandpass', 620, 4.2);
    holdTone(494, dur, 'sawtooth', vol * 0.14, at, 'bandpass', 780, 4.5);
    holdTone(396, dur, 'square', vol * 0.07, at, 'bandpass', 640, 3.4);
    holdTone(498, dur, 'square', vol * 0.06, at, 'bandpass', 800, 3.6);
    holdTone(196, dur, 'sine', vol * 0.1, at, 'lowpass', 280, 0.8);
    burst(dur * 0.9, vol * 0.05, 1100, at, 'bandpass', 850, 2.5);
  };
  blast(0, 0.42, 1);
  blast(0.5, 0.32, 0.82);
}

function sfxGun() {
  const j = Math.random();
  burst(0.028, 0.18, 4200 + j * 900, 0, 'highpass', 500);
  burst(0.05, 0.14, 1100 + j * 200, 0, 'bandpass', 220, 1.8);
  tone(95 + j * 25, 0.04, 'square', 0.07);
  tone(48, 0.07, 'sine', 0.09);
  burst(0.018, 0.07, 6500, 0.035, 'highpass');
}

function sfxBomb() {
  burst(0.035, 0.38, 5000, 0, 'highpass', 700);
  burst(0.09, 0.26, 1600, 0.012, 'bandpass', 280, 1.1);
  burst(0.85, 0.34, 320, 0.02, 'lowpass', 42);
  burst(1.35, 0.24, 110, 0.04, 'lowpass', 22);
  tone(52, 1.05, 'sine', 0.34, 0.02, 14);
  tone(28, 1.4, 'sine', 0.22, 0.05, 10);
  tone(78, 0.32, 'sawtooth', 0.07, 0.03, 22);
  burst(0.22, 0.12, 2800, 0.07, 'highpass', 400);
  burst(0.2, 0.1, 900, 0.16, 'bandpass', 250, 1.6);
  burst(0.55, 0.14, 90, 0.28, 'lowpass', 28);
}

function sfxPickup(kind: string) {
  if (kind === 'cart') { tone(196, 0.08, 'triangle', 0.08); tone(247, 0.1, 'triangle', 0.07, 0.07); burst(0.06, 0.08, 900, 0.04, 'bandpass'); }
  else if (kind === 'gun') { burst(0.05, 0.08, 1800, 0, 'highpass'); tone(140, 0.06, 'square', 0.06); tone(210, 0.05, 'square', 0.05, 0.06); }
  else if (kind === 'bomb') { tone(98, 0.12, 'sine', 0.09); tone(73, 0.18, 'sine', 0.08, 0.1); burst(0.1, 0.06, 400, 0.08, 'lowpass'); }
  else { tone(392, 0.08, 'triangle', 0.07); tone(494, 0.12, 'triangle', 0.06, 0.09); }
}
function sfxBump() {
  burst(0.16, 0.2, 190, 0, 'lowpass', 50);
  tone(120, 0.14, 'sine', 0.12, 0, 55);
  tone(70, 0.22, 'triangle', 0.08, 0.03, 40);
}
function sfxNear(n: number) {
  const f = 620 + Math.min(n, 12) * 28;
  tone(f, 0.07, 'triangle', 0.055);
  tone(f * 1.5, 0.09, 'sine', 0.03, 0.05);
}
function sfxOver() {
  burst(0.35, 0.16, 180, 0, 'lowpass', 40);
  tone(98, 0.4, 'sine', 0.12, 0, 40);
  tone(73, 0.5, 'sine', 0.1, 0.12, 28);
}
function sfxFanfare() {
  holdTone(392, 0.16, 'triangle', 0.09, 0, 'lowpass', 2000, 0.5);
  holdTone(523, 0.18, 'triangle', 0.09, 0.14, 'lowpass', 2000, 0.5);
  holdTone(659, 0.24, 'triangle', 0.1, 0.3, 'lowpass', 2000, 0.5);
  holdTone(784, 0.4, 'triangle', 0.11, 0.5, 'lowpass', 2000, 0.5);
}
function playPower(kind: string) {
  if (kind === 'cart') sfxCart();
  else if (kind === 'horn') sfxHorn();
  else if (kind === 'gun') { /* per-shot */ }
  else if (kind === 'bomb') sfxBomb();
  else sfxShove();
}

// ---------- HUD ----------
const elScore = document.getElementById('score')!, elLives = document.getElementById('lives')!,
  elFlash = document.getElementById('flash')!, elShove = document.getElementById('shove')!,
  elCool = document.getElementById('cool')!, elShoveName = document.getElementById('shoveName')!,
  elShoveHint = document.getElementById('shoveHint')!, elShoveQ = document.getElementById('shoveQ')!,
  elCurtain = document.getElementById('curtain')!, elLevel = document.getElementById('level')!;
function drawLives() {
  elLives.innerHTML = '';
  const n = Math.max(LIVES_MAX, lives);
  for (let i = 0; i < n; i++) {
    const h = document.createElement('div');
    h.className = 'heart' + (i >= lives ? ' gone' : '');
    elLives.appendChild(h);
  }
}
function flash(msg: string, color: string) {
  elFlash.textContent = msg; elFlash.style.color = color;
  elFlash.classList.remove('show'); void (elFlash as HTMLElement).offsetWidth; elFlash.classList.add('show');
}
function peekPower(): string {
  return gunT > 0 ? 'gun' : 'shoulder';
}
function waitingPower(): string {
  return powerQ[0] || '';
}
function refreshPowerHud() {
  power = peekPower();
  if (gunT <= 0) elShoveName.textContent = POWERS[power].name;
  elShove.classList.remove('power-cart', 'power-horn', 'power-gun', 'power-bomb');
  if (power === 'gun') elShove.classList.add('power-gun');
  const wait = waitingPower();
  elShoveHint.textContent = wait ? 'THEN ' + POWERS[wait].name : 'SPACE';
  if (powerQ.length) {
    elShoveQ.textContent = '+' + powerQ.length;
    elShoveQ.classList.remove('hide');
  } else elShoveQ.classList.add('hide');
  batProp.visible = cartRush > 0;
  hornProp.visible = scareT > 0 && power !== 'gun';
  gunProp.visible = power === 'gun' || gunT > 0;
}
function setPower(next: string) {
  powerQ.length = 0;
  if (next !== 'shoulder' && next !== 'gun') powerQ.push(next);
  refreshPowerHud();
}
function collectPower(kind: string) {
  if (kind === 'gun') {
    startGun(gunT > 0);
    return;
  }
  if (gunT > 0) {
    powerQ.push(kind);
    refreshPowerHud();
    flash(POWERS[kind].name + ' QUEUED', '#' + PICK_COL[kind].toString(16).padStart(6, '0'));
    return;
  }
  fireWeapon(kind);
}
function flushWeaponQueue() {
  const pending = powerQ.splice(0, powerQ.length);
  refreshPowerHud();
  for (const k of pending) fireWeapon(k);
}

// ---------- spawning ----------
function crowd(): number {
  return Math.min(dist / CROWD_RAMP_DIST, 1);
}
function spawnWave() {
  const packing = gunT > 0;
  const c = crowd();
  let fill = packing
    ? GUN_PACK_FILL
    : SPAWN_FILL_START + Math.floor(c * (SPAWN_FILL_END - SPAWN_FILL_START + 0.001));
  if (packing && Math.random() < (GUN_PACK_MORE - 1)) fill += 1;
  if (!packing && Math.random() < c * 0.28) fill = Math.min(fill + 1, SPAWN_FILL_END);
  fill = Math.min(fill, 5);
  let chosen: number[];
  if (packing) {
    chosen = GUN_PACK_LANES.slice(0, fill);
  } else {
    const idx = [0, 1, 2, 3, 4];
    for (let i = idx.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0;[idx[i], idx[j]] = [idx[j], idx[i]]; }
    chosen = idx.slice(0, fill);
  }
  const rows = packing ? GUN_PACK_ROWS : 1;
  const jitter = packing ? GUN_PACK_Z_JITTER : 3;
  for (let row = 0; row < rows; row++) {
    for (const s of chosen) {
      const r = Math.random();
      const type = packing
        ? (level === 2 ? 'inf' : 'text')
        : level === 2
          ? 'inf'
          : (r < 0.42 ? 'talk' : r < 0.75 ? 'text' : 'selfie');
      const x = packing ? slotsX[s] * GUN_PACK_SQUEEZE : slotsX[s];
      spawnZombie(x, type, SPAWN_Z + row * GUN_PACK_ROW_Z + Math.random() * jitter);
    }
  }
}
function spawnZombie(x: number, type: string, zPos?: number) {
  const z = getZombie(type); const def = TYPES[type] || TYPES.inf;
  z.active = true; z.visible = true; z.userData.type = type; z.userData.def = def;
  z.userData.hit = false; z.userData.passed = false; z.userData.knocked = false; z.userData.tripT = 0;
  z.userData.driftPhase = Math.random() * 6.28; z.userData.baseX = x;
  z.userData.knockVx = 0; z.userData.knockVy = 0; z.userData.fx = '';
  z.position.set(x, 0, zPos ?? (SPAWN_Z + Math.random() * 3));
  z.rotation.set(0, 0, 0);
  if (type !== 'inf') (z.userData.body.material as THREE.MeshLambertMaterial).color.setHex(def.color);
  applyPose(z, type);
}
const PICK_COL: any = { cart: 0x7fd0ff, horn: 0xffd24a, gun: 0xff8a2a, bomb: 0xff4466 };
function spawnPickup() {
  const p = getPickup();
  const r = Math.random();
  const kind = r < 0.26 ? 'cart' : r < 0.5 ? 'horn' : r < 0.76 ? 'gun' : 'bomb';
  p.userData.kind = kind;
  p.userData.cartVis.visible = kind === 'cart';
  p.userData.hornVis.visible = kind === 'horn';
  p.userData.gunVis.visible = kind === 'gun';
  p.userData.bombVis.visible = kind === 'bomb';
  p.userData.ring.material.color.setHex(PICK_COL[kind]);
  p.active = true; p.visible = true;
  const x = slotsX[(Math.random() * slotsX.length) | 0];
  p.position.set(x, 0, SPAWN_Z + 2);
}

// ---------- knock / shove ----------
function knockOff(z: any, dx: number, fx: string) {
  const d = z.userData;
  d.knocked = true; d.tripT = 0; d.hit = true; d.fx = fx;
  const dir = dx === 0 ? (z.position.x >= 0 ? 1 : -1) : Math.sign(dx);
  if (fx === 'cart') {
    d.knockVx = dir * (2 + Math.random() * 2);
    d.knockVy = CART_LAUNCH;
  } else if (fx === 'horn') {
    d.knockVx = dir * (13 + Math.random() * 4);
    d.knockVy = 2;
    d.lArm.rotation.set(-2.5, 0, 0.3);
    d.rArm.rotation.set(-2.5, 0, -0.3);
  } else if (fx === 'gun') {
    d.knockVx = dir * (3 + Math.random() * 2);
    d.knockVy = 6;
  } else if (fx === 'bomb') {
    d.knockVx = (Math.random() - 0.5) * 22;
    d.knockVy = 10 + Math.random() * 10;
  } else {
    d.knockVx = dir * (9 + Math.random() * 3);
    d.knockVy = 3.2;
  }
  if (d.phone) d.phone.visible = false;
}
function thinForGun() {
  const live: any[] = [];
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    live.push(z);
  }
  live.sort((a, b) => b.position.z - a.position.z);
  let kept = 0;
  let got = 0;
  for (const z of live) {
    const close = z.position.z > GUN_CLEAR_NEAR;
    const off = Math.abs(z.position.x) > 2.2;
    if (close || off || kept >= GUN_PACK_FILL) {
      knockOff(z, z.position.x - player.position.x, 'gun');
      got++;
    } else {
      kept++;
      z.userData.baseX *= GUN_PACK_SQUEEZE;
      z.position.x *= GUN_PACK_SQUEEZE;
    }
  }
  if (got) {
    combo += got; bestCombo = Math.max(bestCombo, combo);
    score(got * 8);
  }
  spawnTimer = 0.55;
}
function startGun(stack = false) {
  audioResume();
  if (stack && gunT > 0) {
    gunT = Math.min(gunT + GUN_DURATION, GUN_STACK_MAX);
    flash('GUN +' + GUN_DURATION + 's', '#ff8a2a');
  } else {
    gunT = GUN_DURATION; gunCd = 0;
    thinForGun();
    invuln = Math.max(invuln, GUN_START_INVULN);
    flash('GUN ' + GUN_DURATION + 's', '#ff8a2a');
  }
  refreshPowerHud();
}
function fireWeapon(kind: string) {
  if (state !== S.play) return;
  audioResume();
  if (kind === 'gun') { startGun(gunT > 0); return; }
  if (kind === 'bomb') {
    playPower('bomb');
    scareT = 0.45;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xff4466);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
    let got = 0;
    for (const z of pool) {
      if (!z.active || z.userData.knocked) continue;
      knockOff(z, z.position.x - player.position.x, 'bomb');
      got++;
    }
    if (got) {
      combo += got; bestCombo = Math.max(bestCombo, combo);
      flash('BOOM! +' + got * 20, '#ff4466');
      score(got * 20);
    } else flash('BOOM!', '#ff4466');
    shake = Math.min(shake + 0.85, 1);
    refreshPowerHud();
    return;
  }
  const p = POWERS[kind];
  if (!p) return;
  playPower(kind);
  if (p.rush) cartRush = p.rush;
  if (kind === 'horn') {
    scareT = 0.4;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xffd24a);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
    hornProp.visible = true;
  }
  if (kind === 'cart') batProp.visible = true;
  let got = 0;
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    const dz = z.position.z - player.position.z, dx = z.position.x - player.position.x;
    let hit = false;
    if (p.radial) hit = dz < 3 && dz > -p.reach && Math.hypot(dx, Math.min(0, dz)) < p.halfW;
    else hit = dz < 0.5 && dz > -p.reach && Math.abs(dx) < p.halfW;
    if (hit) { knockOff(z, dx, kind); got++; }
  }
  if (got) {
    combo += got; bestCombo = Math.max(bestCombo, combo);
    flash(p.yell + ' +' + got * 15, kind === 'horn' ? '#ffd24a' : kind === 'cart' ? '#7fd0ff' : 'var(--accent)');
    score(got * 15);
  } else flash(p.yell, kind === 'horn' ? '#ffd24a' : kind === 'cart' ? '#7fd0ff' : 'var(--accent)');
  shake = Math.min(shake + p.shake, 0.85);
  refreshPowerHud();
}
function doShove() {
  if (state !== S.play) return;
  if (gunT > 0) return;
  if (shoveCd > 0) return;
  audioResume();
  const p = POWERS.shoulder;
  shoveCd = p.cd; lastCd = p.cd;
  playPower('shoulder');
  let got = 0;
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    const dz = z.position.z - player.position.z, dx = z.position.x - player.position.x;
    if (dz < 0.5 && dz > -p.reach && Math.abs(dx) < p.halfW) { knockOff(z, dx, 'shove'); got++; }
  }
  if (got) {
    combo += got; bestCombo = Math.max(bestCombo, combo);
    flash(p.yell + ' +' + got * 15, 'var(--accent)');
    score(got * 15);
  }
  shake = Math.min(shake + p.shake, 0.85);
}
function score(n: number) { scoreAcc += n; }

function gait(z: any, t: number, amt: number) {
  const d = z.userData;
  if (!d.lLeg) return;
  const sw = Math.sin(t) * amt;
  d.lLeg.rotation.x = sw;
  d.rLeg.rotation.x = -sw;
  if (d.knocked || d.type === 'text' || d.type === 'selfie' || d.type === 'talk' || d.type === 'inf') return;
  d.lArm.rotation.x = -sw * 0.7;
  d.rArm.rotation.x = sw * 0.7;
}

function beginClear() {
  if (state !== S.play || level !== 1) return;
  state = S.clear;
  clearT = LEVEL_CLEAR_T;
  elShove.classList.add('hide');
  elCurtain.classList.remove('hide');
  void elCurtain.offsetWidth;
  elCurtain.classList.add('show');
  sfxFanfare();
}
function enterLevel2() {
  level = 2;
  lives = Math.min(lives + 1, LIVES_CAP);
  for (const k of LEVEL2_KIT) powerQ.push(k);
  refreshPowerHud();
  drawLives();
  elLevel.textContent = 'Lv 2';
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const b of bullets) { b.active = false; b.visible = false; }
  buildWorld(2);
  spawnTimer = 0.45; pickTimer = 2.4;
  cartRush = 0; scareT = 0;
  spawnWave();
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  elShove.classList.remove('hide');
  state = S.play;
  flushWeaponQueue();
  invuln = Math.max(invuln, 1.35);
}

// ---------- lifecycle ----------
function start() {
  audioResume();
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  dist = 0; speed = SPEED; lives = LIVES_MAX; combo = 0; bestCombo = 0; invuln = 0; shake = 0;
  shoveCd = 0; lastCd = POWERS.shoulder.cd; cartRush = 0; scareT = 0; gunT = 0; gunCd = 0; scoreAcc = 0;
  powerQ.length = 0;
  level = 1; clearT = 0;
  elLevel.textContent = 'Lv 1';
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  if (worldLevel !== 1) buildWorld(1);
  for (const b of bullets) { b.active = false; b.visible = false; }
  spawnTimer = SPAWN_GAP; pickTimer = 2.2;
  spawnWave();
  vx = 0; lean = 0; tapLeft = 0; tapRight = 0;
  pointerActive = false; pointerFlick = 0; touchAnchorX = 0;
  player.position.set(0, 0, 6.5); player.rotation.set(0, 0, 0);
  setPower('shoulder');
  state = S.play;
  document.getElementById('menu')!.classList.add('hide');
  document.getElementById('over')!.classList.add('hide');
  elShove.classList.remove('hide');
  drawLives(); elScore.textContent = '0';
  last = performance.now();
}
function gameOver(cause: string) {
  state = S.over; elShove.classList.add('hide');
  elCurtain.classList.remove('show'); elCurtain.classList.add('hide');
  batProp.visible = false; hornProp.visible = false; gunProp.visible = false; gunT = 0; powerQ.length = 0;
  const total = Math.floor(dist) + scoreAcc;
  if (total > best) { best = total; try { localStorage.setItem('sz_best', String(best)); } catch (e) {} }
  document.getElementById('fScore')!.textContent = String(total);
  document.getElementById('fBest')!.textContent = String(best);
  document.getElementById('fCombo')!.textContent = String(bestCombo);
  const msgs: any = {
    selfie: ['Blindsided by a selfie.', 'A filming influencer got you. Classic.'],
    text: ['Out-drifted by a texter.', 'They never even looked up.'],
    talk: ['A caller drifted into you.', 'They never paused the chat.'],
    inf: ['Walked into a ring light.', 'She never stopped filming.'],
  };
  const m = msgs[cause] || msgs.talk;
  document.getElementById('overMsg')!.textContent = m[(Math.random() * m.length) | 0];
  document.getElementById('over')!.classList.remove('hide');
  sfxOver();
}

// ---------- loop ----------
function tick(now: number) {
  requestAnimationFrame(tick);
  let dt = (now - last) / 1000; last = now;
  if (dt < 0) dt = 0;
  if (dt > 0.05) dt = 0.05;

  if (state === S.play) {
    speed = SPEED;
    dist += speed * dt;
    const total = Math.floor(dist) + scoreAcc;
    elScore.textContent = String(total);
    if (level === 1 && total >= LEVEL2_AT) beginClear();

    if (tapLeft > 0) tapLeft -= dt;
    if (tapRight > 0) tapRight -= dt;
    const prevX = player.position.x;
    if (pointerActive) {
      let dxPx = pointerX - pointerOriginX;
      if (Math.abs(dxPx) < STEER_TOUCH_DEAD_PX) dxPx = 0;
      const targetX = clamp(
        touchAnchorX + (dxPx / Math.max(wrap.clientWidth, 1)) * STEER_TOUCH_SPAN,
        -CLAMP_X, CLAMP_X,
      );
      player.position.x = toward(player.position.x, targetX, STEER_TOUCH_FOLLOW * dt);
      vx = 0;
    } else {
      let inp = 0;
      if (keys.left || tapLeft > 0) inp -= 1;
      if (keys.right || tapRight > 0) inp += 1;
      const targetVx = inp * STEER_MAX_SPEED;
      const reversing = inp !== 0 && vx !== 0 && Math.sign(inp) !== Math.sign(vx);
      const rate = inp === 0 ? STEER_DECEL : reversing ? STEER_REVERSE : STEER_ACCEL;
      vx = toward(vx, targetVx, rate * dt);
      player.position.x += vx * dt;
    }
    if (player.position.x > CLAMP_X) { player.position.x = CLAMP_X; vx = 0; }
    if (player.position.x < -CLAMP_X) { player.position.x = -CLAMP_X; vx = 0; }
    const instV = (player.position.x - prevX) / Math.max(dt, 0.0001);
    lean += (clamp(instV / 8, -1, 1) - lean) * Math.min(1, dt * STEER_LEAN_SMOOTH);
    player.rotation.z = -lean * STEER_LEAN;
    player.rotation.y = lean * STEER_YAW;
    gait(player, now * 0.014, 0.55);
    batProp.visible = cartRush > 0;
    hornProp.visible = scareT > 0;

    for (const s of scroll) {
      s.position.z += speed * dt;
      if (s.position.z > SEG_LEN) s.position.z -= SEG_N * SEG_LEN;
    }

    spawnTimer -= dt;
    if (spawnTimer <= 0) {
      spawnWave();
      spawnTimer = gunT > 0
        ? GUN_PACK_GAP + Math.random() * 0.08
        : SPAWN_GAP + Math.random() * 0.2;
    }
    pickTimer -= dt;
    if (pickTimer <= 0) {
      spawnPickup();
      pickTimer = 6.5 + Math.random() * 2;
    }

    if (shoveCd > 0) { shoveCd -= dt; if (shoveCd < 0) shoveCd = 0; }
    if (gunT > 0) {
      gunT -= dt; gunCd -= dt;
      elShoveName.textContent = 'GUN ' + Math.max(0, Math.ceil(gunT));
      (elCool as HTMLElement).style.transform = 'scaleY(' + (1 - Math.min(1, gunT / GUN_DURATION)) + ')';
      gunProp.visible = true;
      if (gunCd <= 0) { fireGun(); gunCd = GUN_RATE; }
      if (gunT <= 0) {
        gunT = 0;
        if (powerQ.length) flushWeaponQueue();
        else refreshPowerHud();
      }
    } else {
      (elCool as HTMLElement).style.transform = 'scaleY(' + shoveCd / lastCd + ')';
    }
    if (invuln > 0) invuln -= dt;
    if (cartRush > 0) { cartRush -= dt; if (cartRush < 0) cartRush = 0; }
    if (scareT > 0) {
      scareT -= dt;
      const u = 1 - scareT / 0.4;
      scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
      scareRing.scale.setScalar(1 + u * 10);
      (scareRing.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.7 * (1 - u));
    } else (scareRing.material as THREE.MeshBasicMaterial).opacity = 0;

    const pz = player.position.z, px = player.position.x;
    for (const b of bullets) {
      if (!b.active) continue;
      b.position.z -= GUN_SPEED * dt;
      if (b.position.z < SPAWN_Z - 6) { b.active = false; b.visible = false; continue; }
      for (const z of pool) {
        if (!z.active || z.userData.knocked) continue;
        if (Math.abs(z.position.x - b.position.x) < GUN_HIT_X && Math.abs(z.position.z - b.position.z) < GUN_HIT_Z) {
          knockOff(z, z.position.x - b.position.x, 'gun');
          combo++; bestCombo = Math.max(bestCombo, combo); score(8);
          b.active = false; b.visible = false;
          break;
        }
      }
    }
    for (const pk of pickPool) {
      if (!pk.active) continue;
      pk.position.z += speed * dt;
      pk.position.y = 0.15 + Math.abs(Math.sin(now * 0.004)) * 0.12;
      pk.rotation.y += dt * 1.6;
      if (pk.position.z > 16) { pk.active = false; pk.visible = false; continue; }
      if (Math.abs(pk.position.z - pz) < 1.1 && Math.abs(pk.position.x - px) < 1.0) {
        pk.active = false; pk.visible = false;
        const kind = pk.userData.kind;
        sfxPickup(kind);
        collectPower(kind);
      }
    }

    for (const z of pool) {
      if (!z.active) continue;
      const d = z.userData;
      if (d.knocked) {
        d.tripT += dt;
        if (d.fx === 'cart' || d.fx === 'gun' || d.fx === 'bomb') {
          z.position.x += d.knockVx * dt;
          z.position.y += d.knockVy * dt;
          d.knockVy -= CART_GRAVITY * dt;
          z.rotation.x += dt * 7;
          z.rotation.z += dt * 9;
          if (z.position.y > 22 || z.position.y < -1 || d.tripT > 2.2) { z.active = false; z.visible = false; }
        } else if (d.fx === 'horn') {
          z.position.x += d.knockVx * dt;
          z.position.z += speed * dt * 0.35;
          z.position.y = Math.abs(Math.sin(d.tripT * 22)) * 0.18;
          z.rotation.y += dt * 10;
          if (d.tripT > 0.95 || Math.abs(z.position.x) > 13) { z.active = false; z.visible = false; }
        } else {
          z.position.x += d.knockVx * dt;
          z.position.z += speed * dt * 0.25;
          z.rotation.z += d.knockVx * dt * 0.35;
          z.rotation.x += dt * 5;
          z.position.y = Math.max(0, Math.sin(Math.min(1, d.tripT / 0.4) * Math.PI) * 1.1);
          if (d.tripT > 1.15 || Math.abs(z.position.x) > 13) { z.active = false; z.visible = false; }
        }
        continue;
      }
      z.position.z += speed * dt;
      if ((d.type === 'talk' || d.type === 'inf') && gunT <= 0) {
        const rate = d.type === 'inf' ? INF_DRIFT_RATE : TALK_DRIFT_RATE;
        const amp = d.type === 'inf' ? INF_DRIFT : TALK_DRIFT;
        d.driftPhase += dt * rate;
        z.position.x = d.baseX + Math.sin(d.driftPhase) * amp;
        z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
        z.rotation.y = Math.sin(d.driftPhase) * (d.type === 'inf' ? 0.35 : 0.45);
        if (d.type === 'talk') d.head.rotation.set(0.02, 0.06, 0.1 + Math.sin(now * 0.008) * 0.04);
        else d.head.rotation.set(-0.12, Math.sin(d.driftPhase) * 0.08, 0);
      } else if (d.type === 'text' || d.type === 'talk' || d.type === 'inf') {
        z.position.x = d.baseX;
        z.rotation.y = 0;
      }
      gait(z, now * 0.008 + d.driftPhase, d.type === 'selfie' ? 0.05 : d.type === 'text' ? 0.5 : d.type === 'inf' ? 0.28 : 0.35);

      const dz = z.position.z - pz, dx = z.position.x - px;
      if (cartRush > 0 && Math.abs(dz) < 1.2 && Math.abs(dx) < 1.7) {
        knockOff(z, dx, 'cart'); combo++; bestCombo = Math.max(bestCombo, combo); score(12);
        continue;
      }
      if (!d.hit && Math.abs(dz) < 1.05 && Math.abs(dx) < 1.15) {
        d.hit = true;
        if (invuln <= 0) {
          lives--; combo = 0; invuln = 1.1; shake = Math.min(shake + 0.6, 0.9);
          drawLives(); sfxBump();
          knockOff(z, dx, 'shove');
          if (lives <= 0) gameOver(d.type);
        }
      }
      if (!d.passed && z.position.z > pz + 0.6) {
        d.passed = true;
        if (!d.hit) {
          const gap = Math.abs(dx);
          if (gap < 2.1) {
            combo++; bestCombo = Math.max(bestCombo, combo);
            const bonus = 10 + Math.min(combo, 20) * 2;
            score(bonus);
            if (combo >= 3) flash('NICE ×' + combo + '  +' + bonus, gap < 1.6 ? 'var(--accent)' : 'var(--talk)');
            sfxNear(combo);
          }
        }
      }
      if (z.position.z > 16) { z.active = false; z.visible = false; }
    }
  }

  if (state === S.clear) {
    clearT -= dt;
    if (clearT <= 0) enterLevel2();
  }

  const tx = state === S.play ? player.position.x * CAM_FOLLOW_X : 0;
  camera.position.x += (tx - camera.position.x) * Math.min(1, dt * CAM_FOLLOW_RATE);
  camera.position.z = camBase.z;
  if (shake > 0) {
    camera.position.x += (Math.random() - 0.5) * shake;
    camera.position.y = camBase.y + (Math.random() - 0.5) * shake;
    shake = Math.max(0, shake - dt * 2.2);
  } else camera.position.y += (camBase.y - camera.position.y) * 0.1;
  const lookX = state === S.play ? player.position.x * CAM_LOOK_X : 0;
  camera.lookAt(lookX, CAM_LOOK_Y, CAM_LOOK_Z);

  if (state !== S.play) {
    for (const s of scroll) { s.position.z += 1.4 * dt; if (s.position.z > SEG_LEN) s.position.z -= SEG_N * SEG_LEN; }
  }

  renderer.render(scene, camera);
}

drawLives();
setPower('shoulder');
requestAnimationFrame(tick);
