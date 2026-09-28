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
};
const SKINS = [0xf0c4a0, 0xe0b089, 0xc68642, 0x8d5524, 0xf5d0b0, 0xd4a574];
const PANTS = [0x2c3340, 0x3e4a3a, 0x4a3b32, 0x1f2a38, 0x5a4e45];
const HAIR = [0x1a1410, 0x3b2416, 0x5a3a22, 0x2b2b2b, 0x6e4a2e, 0xc8c2b4];

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
  cart:     { name: 'CART',  yell: 'LAUNCH!', cd: 4.2, reach: 14, halfW: 4.4, shake: 0.5, rush: 1.5 },
  horn:     { name: 'HORN',  yell: 'SCATTER!', cd: 3.6, reach: 10, halfW: 7.2, shake: 0.35, radial: true },
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
const GUN_PACK_GAP = 1.05;        // just a bit busier than a normal wave
const GUN_PACK_FILL = 2;          // a pair in front, not a wall
const GUN_PACK_ROWS = 1;
const GUN_PACK_ROW_Z = 1.15;
const GUN_PACK_SQUEEZE = 0.5;     // pull them into the spray line
const GUN_PACK_Z_JITTER = 0.4;
const GUN_PACK_LANES = [1, 2];    // two center-left / center slots
const GUN_CLEAR_NEAR = -5;        // already this close = blasted on pickup
const GUN_START_INVULN = 0.45;

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

scene.add(new THREE.HemisphereLight(0xf4ebe0, 0x6a5c4e, 0.95));
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
for (let i = 0; i < SEG_N; i++) {
  const s = makeSegment(i); s.position.z = -i * SEG_LEN; scene.add(s); scroll.push(s);
}

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
  return g;
}

const player: any = makePerson(COL.player, true);
player.position.set(0, 0, 6.5);
scene.add(player);

const cartProp = new THREE.Group();
{
  const bask = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.85), mat(0xb8c0c6, { transparent: true, opacity: 0.35 }));
  bask.position.set(0, 0.85, 0.7); cartProp.add(bask);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.74, 0.05, 0.9), mat(0x8a9298));
  rim.position.set(0, 1.08, 0.7); cartProp.add(rim);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.7, 0.08), mat(0x8a9298));
  bar.position.set(0.28, 0.7, 1.05); cartProp.add(bar);
}
player.add(cartProp);
cartProp.visible = false;

const gunProp = new THREE.Group();
{
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.12, 0.42), mat(0x2c2c2c));
  body.position.set(0.22, 1.2, 0.35); gunProp.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.38), mat(0x555555));
  barrel.position.set(0.22, 1.22, 0.05); gunProp.add(barrel);
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
  if (d.phone) { d.phone.visible = true; d.phone.position.set(0, 0, 0.07); d.phone.rotation.set(0, 0, 0); }
  if (type === 'talk') {
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
function getZombie(): any {
  for (const z of pool) if (!z.active) return z;
  const g: any = makePerson(COL.talk, false);
  g.active = false; scene.add(g); pool.push(g); return g;
}

// ---------- pickups ----------
const pickPool: any[] = [];
function makePickupMesh() {
  const g: any = new THREE.Group();
  const cart = new THREE.Group();
  const bask = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.4, 0.7), mat(0x7fd0ff, { transparent: true, opacity: 0.55 }));
  bask.position.y = 0.55; cart.add(bask);
  const rim = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.06, 0.74), mat(0xe8f6ff));
  rim.position.y = 0.76; cart.add(rim);
  const horn = new THREE.Group();
  const cone = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.45, 8), mat(0xffd24a));
  cone.position.y = 0.7; cone.rotation.x = 0.5; horn.add(cone);
  const gun = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.16, 0.55), mat(0x3a3a3a));
  body.position.set(0, 0.62, 0); gun.add(body);
  const barrel = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.07, 0.45), mat(0x6a6a6a));
  barrel.position.set(0, 0.66, -0.35); gun.add(barrel);
  const bomb = new THREE.Group();
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mat(0x2a2a2a));
  ball.position.y = 0.55; bomb.add(ball);
  const fuse = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.18, 0.04), mat(0xff4466));
  fuse.position.y = 0.82; bomb.add(fuse);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.38, 0.04, 8, 16), mat(0xffee88));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.08;
  g.add(cart); g.add(horn); g.add(gun); g.add(bomb); g.add(ring);
  g.userData.cartVis = cart; g.userData.hornVis = horn;
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
const S = { menu: 'menu', play: 'play', over: 'over' } as const;
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
function echo(freq: number, dur: number, type: OscillatorType, vol: number, when: number, delay: number) {
  tone(freq, dur, type, vol, when);
  tone(freq * 0.97, dur * 0.85, type, vol * 0.45, when + delay);
}

function sfxShove() {
  burst(0.14, 0.2, 220, 0, 'lowpass', 70);
  tone(72, 0.16, 'sine', 0.2);
  tone(38, 0.22, 'sine', 0.12);
  tone(180, 0.07, 'triangle', 0.06, 0.03, 90);
}
function sfxCart() {
  burst(0.08, 0.12, 3200, 0, 'bandpass', 1800, 4);
  burst(0.07, 0.1, 2400, 0.05, 'bandpass', 1400, 5);
  burst(0.28, 0.14, 280, 0, 'lowpass', 1800);
  tone(90, 0.28, 'sawtooth', 0.07, 0, 280);
  tone(620, 0.1, 'triangle', 0.07, 0.18);
  tone(880, 0.12, 'triangle', 0.055, 0.26);
}
function sfxHorn() {
  tone(311, 0.14, 'square', 0.11);
  tone(318, 0.14, 'square', 0.07);
  tone(233, 0.22, 'square', 0.12, 0.12);
  tone(239, 0.22, 'square', 0.07, 0.12);
  echo(880, 0.1, 'sawtooth', 0.045, 0.28, 0.08);
  tone(720, 0.16, 'sawtooth', 0.04, 0.32, 380);
}
function sfxGun() {
  const j = Math.random();
  burst(0.045, 0.09, 2200 + j * 800, 0, 'bandpass', 900, 3);
  tone(190 + j * 40, 0.035, 'square', 0.055);
  tone(90, 0.04, 'sine', 0.04);
}
function sfxBomb() {
  burst(0.45, 0.28, 140, 0, 'lowpass', 40);
  burst(0.12, 0.16, 900, 0.02, 'bandpass', 400, 2);
  tone(56, 0.5, 'sine', 0.2, 0, 18);
  tone(120, 0.18, 'sawtooth', 0.08, 0, 40);
  burst(0.22, 0.1, 60, 0.12, 'lowpass', 30);
}
function sfxPickup(kind: string) {
  if (kind === 'cart') { tone(523, 0.08, 'triangle', 0.07); tone(659, 0.09, 'triangle', 0.07, 0.07); tone(784, 0.12, 'triangle', 0.06, 0.14); }
  else if (kind === 'gun') { burst(0.05, 0.08, 1800, 0, 'highpass'); tone(140, 0.06, 'square', 0.06); tone(210, 0.05, 'square', 0.05, 0.06); }
  else if (kind === 'bomb') { tone(98, 0.12, 'sine', 0.09); tone(73, 0.18, 'sine', 0.08, 0.1); burst(0.1, 0.06, 400, 0.08, 'lowpass'); }
  else { tone(494, 0.07, 'square', 0.06); tone(370, 0.1, 'square', 0.055, 0.08); }
}
function sfxBump() {
  burst(0.16, 0.18, 180, 0, 'lowpass', 60);
  tone(140, 0.14, 'sine', 0.12, 0, 70);
  tone(90, 0.2, 'triangle', 0.07, 0.04, 50);
}
function sfxNear(n: number) {
  const f = 620 + Math.min(n, 12) * 28;
  tone(f, 0.07, 'triangle', 0.055);
  tone(f * 1.5, 0.09, 'sine', 0.03, 0.05);
}
function sfxOver() {
  tone(220, 0.28, 'sawtooth', 0.1, 0, 70);
  tone(160, 0.35, 'sawtooth', 0.08, 0.12, 42);
  burst(0.3, 0.14, 200, 0.08, 'lowpass', 50);
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
  elShoveHint = document.getElementById('shoveHint')!, elShoveQ = document.getElementById('shoveQ')!;
function drawLives() {
  elLives.innerHTML = '';
  for (let i = 0; i < LIVES_MAX; i++) {
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
  return gunT > 0 ? 'gun' : (powerQ[0] || 'shoulder');
}
function waitingPower(): string {
  return powerQ[gunT > 0 ? 0 : 1] || '';
}
function refreshPowerHud() {
  power = peekPower();
  if (gunT <= 0) elShoveName.textContent = POWERS[power].name;
  elShove.classList.remove('power-cart', 'power-horn', 'power-gun', 'power-bomb');
  if (power === 'cart') elShove.classList.add('power-cart');
  if (power === 'horn') elShove.classList.add('power-horn');
  if (power === 'gun') elShove.classList.add('power-gun');
  if (power === 'bomb') elShove.classList.add('power-bomb');
  const wait = waitingPower();
  elShoveHint.textContent = wait ? 'THEN ' + POWERS[wait].name : 'SPACE';
  const held = powerQ.length + (gunT > 0 ? 1 : 0);
  if (held > 1) {
    elShoveQ.textContent = '+' + (held - 1);
    elShoveQ.classList.remove('hide');
  } else elShoveQ.classList.add('hide');
  cartProp.visible = power === 'cart' || cartRush > 0;
  gunProp.visible = power === 'gun' || gunT > 0;
}
function setPower(next: string) {
  powerQ.length = 0;
  if (next !== 'shoulder' && next !== 'gun') powerQ.push(next);
  refreshPowerHud();
}
function queuePower(kind: string) {
  if (kind === 'gun') {
    startGun(gunT > 0);
    return;
  }
  powerQ.push(kind);
  refreshPowerHud();
  const hex = '#' + PICK_COL[kind].toString(16).padStart(6, '0');
  if (gunT > 0 || powerQ.length > 1) flash(POWERS[kind].name + ' QUEUED', hex);
  else flash(POWERS[kind].name + ' READY', hex);
}
function consumeReadyPower() {
  if (powerQ[0] === power) powerQ.shift();
  refreshPowerHud();
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
        ? 'text'
        : (r < 0.42 ? 'talk' : r < 0.75 ? 'text' : 'selfie');
      const x = packing ? slotsX[s] * GUN_PACK_SQUEEZE : slotsX[s];
      spawnZombie(x, type, SPAWN_Z + row * GUN_PACK_ROW_Z + Math.random() * jitter);
    }
  }
}
function spawnZombie(x: number, type: string, zPos?: number) {
  const z = getZombie(); const def = TYPES[type];
  z.active = true; z.visible = true; z.userData.type = type; z.userData.def = def;
  z.userData.hit = false; z.userData.passed = false; z.userData.knocked = false; z.userData.tripT = 0;
  z.userData.driftPhase = Math.random() * 6.28; z.userData.baseX = x;
  z.userData.knockVx = 0; z.userData.knockVy = 0; z.userData.fx = '';
  z.position.set(x, 0, zPos ?? (SPAWN_Z + Math.random() * 3));
  z.rotation.set(0, 0, 0);
  (z.userData.body.material as THREE.MeshLambertMaterial).color.setHex(def.color);
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
function detonate() {
  audioResume();
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
  shoveCd = POWERS.bomb.cd; lastCd = POWERS.bomb.cd;
  consumeReadyPower();
}
function doShove() {
  if (state !== S.play) return;
  if (gunT > 0) return;
  audioResume();
  if (power === 'gun') { startGun(); return; }
  if (power === 'bomb') { detonate(); return; }
  if (shoveCd > 0) return;
  const p = POWERS[power];
  const fx = power === 'shoulder' ? 'shove' : power;
  shoveCd = p.cd; lastCd = p.cd;
  playPower(power);
  if (p.rush) cartRush = p.rush;
  if (power === 'horn') {
    scareT = 0.4;
    (scareRing.material as THREE.MeshBasicMaterial).color.setHex(0xffd24a);
    scareRing.position.set(player.position.x, 0.08, player.position.z - 2);
  }
  let got = 0;
  for (const z of pool) {
    if (!z.active || z.userData.knocked) continue;
    const dz = z.position.z - player.position.z, dx = z.position.x - player.position.x;
    let hit = false;
    if (p.radial) hit = dz < 3 && dz > -p.reach && Math.hypot(dx, Math.min(0, dz)) < p.halfW;
    else hit = dz < 0.5 && dz > -p.reach && Math.abs(dx) < p.halfW;
    if (hit) { knockOff(z, dx, fx); got++; }
  }
  if (got) {
    combo += got; bestCombo = Math.max(bestCombo, combo);
    flash(p.yell + ' +' + got * 15, power === 'horn' ? '#ffd24a' : power === 'cart' ? '#7fd0ff' : 'var(--accent)');
    score(got * 15);
  }
  shake = Math.min(shake + p.shake, 0.85);
  if (power !== 'shoulder') consumeReadyPower();
  cartProp.visible = cartRush > 0;
}
function score(n: number) { scoreAcc += n; }

function gait(z: any, t: number, amt: number) {
  const d = z.userData;
  if (!d.lLeg) return;
  const sw = Math.sin(t) * amt;
  d.lLeg.rotation.x = sw;
  d.rLeg.rotation.x = -sw;
  if (d.knocked || d.type === 'text' || d.type === 'selfie' || d.type === 'talk') return;
  d.lArm.rotation.x = -sw * 0.7;
  d.rArm.rotation.x = sw * 0.7;
}

// ---------- lifecycle ----------
function start() {
  audioResume();
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  dist = 0; speed = SPEED; lives = LIVES_MAX; combo = 0; bestCombo = 0; invuln = 0; shake = 0;
  shoveCd = 0; lastCd = POWERS.shoulder.cd; cartRush = 0; scareT = 0; gunT = 0; gunCd = 0; scoreAcc = 0;
  powerQ.length = 0;
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
  cartProp.visible = false; gunProp.visible = false; gunT = 0; powerQ.length = 0;
  const total = Math.floor(dist) + scoreAcc;
  if (total > best) { best = total; try { localStorage.setItem('sz_best', String(best)); } catch (e) {} }
  document.getElementById('fScore')!.textContent = String(total);
  document.getElementById('fBest')!.textContent = String(best);
  document.getElementById('fCombo')!.textContent = String(bestCombo);
  const msgs: any = {
    selfie: ['Blindsided by a selfie.', 'A filming influencer got you. Classic.'],
    text: ['Out-drifted by a texter.', 'They never even looked up.'],
    talk: ['A caller drifted into you.', 'They never paused the chat.'],
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
    elScore.textContent = String(Math.floor(dist) + scoreAcc);

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
    cartProp.visible = power === 'cart' || cartRush > 0;

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
        refreshPowerHud();
        if (power !== 'shoulder') {
          flash(POWERS[power].name + ' READY', '#' + PICK_COL[power].toString(16).padStart(6, '0'));
        }
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
        queuePower(kind);
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
      if (d.type === 'talk' && gunT <= 0) {
        d.driftPhase += dt * TALK_DRIFT_RATE;
        z.position.x = d.baseX + Math.sin(d.driftPhase) * TALK_DRIFT;
        z.position.x = clamp(z.position.x, -CLAMP_X, CLAMP_X);
        z.rotation.y = Math.sin(d.driftPhase) * 0.45;
        d.head.rotation.set(0.02, 0.06, 0.1 + Math.sin(now * 0.008) * 0.04);
      } else if (d.type === 'text' || d.type === 'talk') {
        z.position.x = d.baseX;
        z.rotation.y = 0;
      }
      gait(z, now * 0.008 + d.driftPhase, d.type === 'selfie' ? 0.05 : d.type === 'text' ? 0.5 : 0.35);

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
