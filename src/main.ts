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
const GUN_HIT_X = 0.38;            // only the bullet line, not a shotgun cone
const GUN_HIT_Z = 0.55;
const GUN_FRONT = 0.5;             // must be ahead — never the people at your hips
const GUN_STACK_MAX = 20;
const GUN_PACK_MORE = 1.2;
const GUN_PACK_GAP = 1.05;
const GUN_PACK_FILL = 2;
const GUN_PACK_ROWS = 1;
const GUN_PACK_ROW_Z = 1.15;
const GUN_PACK_SQUEEZE = 0.5;
const GUN_PACK_LANES = [1, 2, 3];
const GUN_PACK_Z_JITTER = 0.4;
const GUN_START_INVULN = 0.45;
const LIVES_CAP = 6;
const INF_DRIFT = 1.9;
const INF_DRIFT_RATE = 1.15;
const COIN_VALUE = 12;
const COIN_GAP = 3.1;
const COIN_1UP = 40;

function stageOf(lv = level) {
  return STAGES[lv - 1] || STAGES[STAGES.length - 1];
}

const STAGES: any[] = [
  {
    id: 1, name: 'CEREAL AISLE', world: 'aisle', crowd: 'aisle', clearAt: 500,
    kit: ['cart', 'horn', 'bomb'],
    curtain: {
      kicker: '★ AISLE ACE ★', title: 'YOU MADE IT!',
      sub: "Cereal's cleared. Next: the boardwalk — ring lights, tripods, and people who think you're a lamp post.",
      go: 'Hit the boardwalk →',
    },
  },
  {
    id: 2, name: 'THE BOARDWALK', world: 'street', crowd: 'inf', clearAt: 1100,
    kit: ['gun', 'cart', 'bomb'],
    curtain: {
      kicker: '★ BOARDWALK STAR ★', title: 'INFLUENCED!',
      sub: "You survived the selfies. Next: the food court — coupons, GPS, and folks who walk like the map is the floor.",
      go: 'Hit the food court →',
    },
  },
  {
    id: 3, name: 'FOOD COURT', world: 'mall', crowd: 'mall', clearAt: 1800,
    kit: ['horn', 'gun', 'bomb'],
    curtain: {
      kicker: '★ MALL RAT ★', title: 'SALE SURVIVED!',
      sub: "Food-court cleared. Next: the beach — towels, umbrellas, and phones brighter than the sun.",
      go: 'Hit the beach →',
    },
  },
  {
    id: 4, name: 'THE BEACH', world: 'beach', crowd: 'beach', clearAt: 0,
    kit: ['cart', 'horn', 'gun'],
    curtain: null,
  },
];

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

let baseFov = CAM_FOV, fovKick = 0, hitStop = 0;
function resize() {
  const w = wrap.clientWidth, h = wrap.clientHeight;
  renderer.setSize(w, h, false);
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  camera.aspect = Math.max(w / Math.max(h, 1), 0.05);
  const minH = THREE.MathUtils.degToRad(CAM_MIN_HFOV);
  const vFromH = 2 * Math.atan(Math.tan(minH / 2) / camera.aspect);
  baseFov = Math.max(CAM_FOV, THREE.MathUtils.radToDeg(vFromH));
  camera.fov = baseFov + fovKick;
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

// ---------- food court ----------
const texCache: any = {};
const cmCache: any = {};
function cmat(hex: number) { return cmCache[hex] || (cmCache[hex] = mat(hex)); }
function labelTex(text: string, bg: string, fg: string, w = 256, h = 64, stripe = ''): any {
  const key = text + bg + fg;
  if (texCache[key]) return texCache[key];
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = bg; x.fillRect(0, 0, w, h);
  if (stripe) { x.fillStyle = stripe; x.fillRect(0, 0, w, 7); x.fillRect(0, h - 7, w, 7); }
  x.fillStyle = fg;
  x.font = '800 ' + Math.floor(h * 0.56) + 'px "Bricolage Grotesque", "Arial Black", sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, w / 2, h / 2 + 2, w - 16);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache[key] = t;
  return t;
}
function menuTex(seed: number): any {
  const key = 'menu' + (seed % 3);
  if (texCache[key]) return texCache[key];
  const w = 256, h = 128;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d')!;
  x.fillStyle = '#20232a'; x.fillRect(0, 0, w, h);
  x.fillStyle = '#ffe27a'; x.font = '800 22px "Arial Black", sans-serif'; x.textAlign = 'left';
  x.fillText('MENU', 12, 26);
  const dots = ['#ff6b5a', '#7fd0ff', '#ffd24a', '#7ee08a'];
  for (let r = 0; r < 4; r++) {
    const y = 48 + r * 20;
    x.fillStyle = dots[(r + seed) % 4]; x.fillRect(12, y - 8, 12, 12);
    x.fillStyle = '#6b7280'; x.fillRect(32, y - 5, 90 + ((r * 37 + seed * 23) % 70), 6);
    x.fillStyle = '#fff'; x.font = '700 14px Arial, sans-serif';
    x.fillText('$' + (3 + ((r * 2 + seed) % 7)) + '.99', 196, y + 2);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  texCache[key] = t;
  return t;
}
let fcFloor: any = null;
function fcFloorMat() {
  if (fcFloor) return fcFloor;
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const x = c.getContext('2d')!;
  x.fillStyle = '#efe3cc'; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#d3b98f'; x.fillRect(0, 0, 64, 64); x.fillRect(64, 64, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set((AISLE_W + 10) / 2, SEG_LEN / 2);
  fcFloor = new THREE.MeshLambertMaterial({ map: t });
  return fcFloor;
}
const FC_STALLS: any[] = [
  { name: 'BURGERS', bg: '#d63b2f', fg: '#fff3d0', icon: 'burger' },
  { name: 'PIZZA', bg: '#2f8f4e', fg: '#fff3d0', icon: 'pizza' },
  { name: 'TACOS', bg: '#e8a21e', fg: '#3a1c00', icon: 'taco' },
  { name: 'SUSHI', bg: '#2b4a7a', fg: '#ffffff', icon: 'sushi' },
  { name: 'ICE CREAM', bg: '#ee7fb0', fg: '#ffffff', icon: 'cone' },
  { name: 'COFFEE', bg: '#6b4630', fg: '#ffe9c8', icon: 'cup' },
  { name: 'NOODLES', bg: '#c4302b', fg: '#ffe08a', icon: 'bowl' },
  { name: 'SMOOTHIES', bg: '#7e57c2', fg: '#ffffff', icon: 'cup2' },
];
function makeFoodIcon(kind: string): any {
  const g = new THREE.Group();
  const add = (geo: any, color: number, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geo, cmat(color)); m.position.set(x, y, z); g.add(m); return m;
  };
  if (kind === 'burger') {
    add(new THREE.SphereGeometry(0.4, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), 0xd9903a, 0, 0.16, 0);
    add(new THREE.CylinderGeometry(0.42, 0.42, 0.1, 12), 0x5a3018, 0, 0.1, 0);
    add(new THREE.BoxGeometry(0.76, 0.03, 0.76), 0xffd24a, 0, 0.16, 0);
    add(new THREE.CylinderGeometry(0.4, 0.34, 0.1, 12), 0xd9903a, 0, 0.0, 0);
  } else if (kind === 'pizza') {
    const s = add(new THREE.CylinderGeometry(0.55, 0.55, 0.08, 3), 0xf0b64a, 0, 0.3, 0);
    s.rotation.x = Math.PI / 2;
    add(new THREE.SphereGeometry(0.09, 6, 5), 0xc9302a, -0.12, 0.42, 0.06);
    add(new THREE.SphereGeometry(0.09, 6, 5), 0xc9302a, 0.14, 0.44, 0.06);
    add(new THREE.SphereGeometry(0.08, 6, 5), 0xc9302a, 0.0, 0.2, 0.06);
  } else if (kind === 'taco') {
    const s = add(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 12, 1, true, 0, Math.PI), 0xf0c14b, 0, 0.36, 0);
    s.rotation.set(Math.PI / 2, 0, Math.PI / 2);
    (s.material as any) = new THREE.MeshLambertMaterial({ color: 0xf0c14b, side: THREE.DoubleSide });
    add(new THREE.SphereGeometry(0.22, 7, 5), 0x4a9d6e, 0, 0.42, 0);
    add(new THREE.SphereGeometry(0.11, 6, 5), 0xd6402f, 0.15, 0.5, 0.1);
  } else if (kind === 'sushi') {
    add(new THREE.BoxGeometry(0.7, 0.3, 0.42), 0xffffff, 0, 0.15, 0);
    add(new THREE.BoxGeometry(0.76, 0.12, 0.46), 0xff7a4a, 0, 0.36, 0);
    add(new THREE.BoxGeometry(0.72, 0.31, 0.1), 0x20242a, 0, 0.16, 0);
  } else if (kind === 'cone') {
    const c = add(new THREE.ConeGeometry(0.3, 0.72, 8), 0xe6b06a, 0, 0.36, 0);
    c.rotation.x = Math.PI;
    add(new THREE.SphereGeometry(0.34, 9, 7), 0xff8fbf, 0, 0.82, 0);
    add(new THREE.SphereGeometry(0.06, 6, 5), 0xd6202f, 0, 1.2, 0);
  } else if (kind === 'bowl') {
    add(new THREE.SphereGeometry(0.46, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xc4302b, 0, 0.44, 0);
    const n = add(new THREE.TorusGeometry(0.26, 0.07, 6, 10), 0xf6dc7a, 0, 0.44, 0);
    n.rotation.x = Math.PI / 2;
  } else {
    const col = kind === 'cup' ? 0xf4efe4 : 0x7e57c2;
    add(new THREE.CylinderGeometry(0.3, 0.22, 0.66, 10), col, 0, 0.33, 0);
    add(new THREE.CylinderGeometry(0.32, 0.32, 0.06, 10), kind === 'cup' ? 0x6b4630 : 0xff8fbf, 0, 0.69, 0);
    add(new THREE.BoxGeometry(0.05, 0.4, 0.05), kind === 'cup' ? 0xe05a4f : 0x4fd2ff, 0.08, 0.95, 0);
  }
  return g;
}
const matNeon = new THREE.MeshBasicMaterial({ color: 0xffd27a });
const matGlass = new THREE.MeshLambertMaterial({ color: 0xbfe4f0, transparent: true, opacity: 0.32 });
const FC_W = 5.7;                    // inner face of the food-court walls
function buildStall(g: any, s: number, zc: number, st: any, i: number) {
  const bg = new THREE.Color(st.bg).getHex();
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.0, 8.6), cmat(bg));
  counter.position.set(s * (FC_W - 0.4), 0.5, zc); g.add(counter);
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.08, 8.8), cmat(0xf7efe0));
  top.position.set(s * (FC_W - 0.4), 1.04, zc); g.add(top);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.55, 8.4), matGlass);
  glass.position.set(s * (FC_W - 0.55), 1.4, zc); g.add(glass);
  const reg = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.26, 0.36), cmat(0x2a2e36));
  reg.position.set(s * (FC_W - 0.3), 1.22, zc + 2.6); g.add(reg);
  const n = 5, L = 8.6 / n;
  for (let k = 0; k < n; k++) {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.07, L), cmat(k % 2 ? 0xffffff : bg));
    slab.position.set(s * (FC_W - 0.7), 3.05, zc - 4.3 + L * (k + 0.5));
    slab.rotation.z = s * 0.3; g.add(slab);
  }
  const board = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.05), new THREE.MeshBasicMaterial({ map: menuTex(i + (st.name.length)) }));
  board.position.set(s * (FC_W - 0.03), 2.05, zc); board.rotation.y = -s * Math.PI / 2; g.add(board);
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(3.8, 0.95),
    new THREE.MeshBasicMaterial({ map: labelTex(st.name, st.bg, st.fg, 256, 64, '#ffffff') }),
  );
  sign.position.set(s * (FC_W - 0.04), 3.85, zc); sign.rotation.y = -s * Math.PI / 2; g.add(sign);
  const icon = makeFoodIcon(st.icon);
  icon.scale.setScalar(1.6);
  icon.position.set(s * (FC_W + 0.7), 4.4, zc);
  icon.rotation.y = -s * Math.PI / 2;
  g.add(icon);
}
function buildSeating(g: any, s: number, zs: number, i: number) {
  const stoolCols = [0xe05a4f, 0x3d7ea6, 0xf0c14b, 0x4a9d6e];
  const tx = s * (FC_W - 0.6);
  [-2.5, 2.5].forEach((t, ti) => {
    const tz = zs + t;
    const topM = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 12), cmat(0xf4efe4));
    topM.position.set(tx, 0.78, tz); g.add(topM);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.78, 6), cmat(0x555a62));
    pole.position.set(tx, 0.39, tz); g.add(pole);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.3, 0.04, 8), cmat(0x555a62));
    base.position.set(tx, 0.02, tz); g.add(base);
    const tray = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.34), cmat(ti ? 0xf0c14b : 0xe05a4f));
    tray.position.set(tx, 0.83, tz); tray.rotation.y = 0.4 + ti; g.add(tray);
    const cupM = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.05, 0.16, 6), cmat(0xffffff));
    cupM.position.set(tx + 0.1, 0.94, tz + 0.05); g.add(cupM);
    [-0.9, 0.9].forEach((o, oi) => {
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.2, 0.06, 8), cmat(stoolCols[(i + ti + oi) % 4]));
      st.position.set(tx, 0.5, tz + o); g.add(st);
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.5, 6), cmat(0x555a62));
      leg.position.set(tx, 0.25, tz + o); g.add(leg);
    });
  });
  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(3.4, 0.9),
    new THREE.MeshBasicMaterial({ map: labelTex('MEAL DEAL $5', '#ffd24a', '#7a1f14', 256, 64, '#d6402f') }),
  );
  poster.position.set(s * (FC_W - 0.03), 2.5, zs); poster.rotation.y = -s * Math.PI / 2; g.add(poster);
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 8), cmat(0xb8683a));
  pot.position.set(s * (FC_W - 0.4), 0.25, zs + 4.4); g.add(pot);
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), matPalm);
  bush.position.set(s * (FC_W - 0.4), 0.85, zs + 4.4); g.add(bush);
  const lampCable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5.9, 4), cmat(0x333333));
  lampCable.position.set(tx, 9.55, zs); g.add(lampCable);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.38, 10), new THREE.MeshBasicMaterial({ color: stoolCols[(i + 1) % 4] }));
  shade.position.set(tx, 6.5, zs); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), matNeon);
  bulb.position.set(tx, 6.25, zs); g.add(bulb);
}
function makeFoodCourtSegment(i: number): any {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, SEG_LEN), fcFloorMat());
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const wallCols = [0xf6e3c8, 0xe9f0e0];
  [-1, 1].forEach((s) => {
    const side = s > 0 ? 1 : 0;
    const wall = new THREE.Mesh(new THREE.BoxGeometry(2.8, 4.4, SEG_LEN - 0.02), cmat(wallCols[(i + side) % 2]));
    wall.position.set(s * (FC_W + 1.4), 2.2, 0); g.add(wall);
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, SEG_LEN), matNeon);
    trim.position.set(s * (FC_W - 0.04), 4.28, 0); g.add(trim);
    const stallFront = ((i + side) % 2) === 0;
    const zc = stallFront ? -5 : 5;
    buildStall(g, s, zc, FC_STALLS[(i * 2 + side) % FC_STALLS.length], i);
    buildSeating(g, s, -zc, i);
  });
  if (i % 5 === 0) {
    const banner = new THREE.Mesh(
      new THREE.PlaneGeometry(7, 1.2),
      new THREE.MeshBasicMaterial({ map: labelTex('★ FOOD COURT ★', '#d6402f', '#ffe27a', 384, 64, '#ffe27a'), side: THREE.DoubleSide }),
    );
    banner.position.set(0, 7.2, 0); g.add(banner);
    [-3.3, 3.3].forEach((x) => {
      const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 4.9, 4), cmat(0x333333));
      cab.position.set(x, 10.05, 0); g.add(cab);
    });
  }
  const ceil = new THREE.Mesh(new THREE.BoxGeometry(AISLE_W + 12, 0.16, SEG_LEN), cmat(0xeee6da));
  ceil.position.y = 12.5; g.add(ceil);
  const sky = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 10), new THREE.MeshBasicMaterial({ color: 0xc8e4f4 }));
  sky.position.y = 12.35; g.add(sky);
  return g;
}

function makeBeachSegment(i: number): any {
  const g = new THREE.Group();
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 14, SEG_LEN), mat(0xe8d4a4));
  sand.rotation.x = -Math.PI / 2; sand.receiveShadow = true; g.add(sand);
  const wet = new THREE.Mesh(new THREE.PlaneGeometry(3.2, SEG_LEN), mat(0xd2c08a));
  wet.rotation.x = -Math.PI / 2; wet.position.set(-AISLE_W * 0.45, 0.01, 0); g.add(wet);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(8, SEG_LEN), mat(0x3aa0c8));
  water.rotation.x = -Math.PI / 2; water.position.set(-AISLE_W * 0.5 - 4.4, -0.04, 0); g.add(water);
  [-1, 1].forEach((s) => {
    const umb = new THREE.Group();
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 2.1, 6), mat(0xf4f0e6));
    pole.position.y = 1.05; umb.add(pole);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.15, 0.35, 8), mat(BIKINIS[(i + (s > 0 ? 2 : 0) + 3) % BIKINIS.length]));
    cap.position.y = 2.15; umb.add(cap);
    umb.position.set(s * (SHELF_X - 1.1), 0, -SEG_LEN / 2 + 4 + (i % 2) * 7);
    g.add(umb);
    if (i % 2 === 0) {
      const towel = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.04, 1.5), mat(BIKINIS[(i + (s > 0 ? 3 : 5)) % BIKINIS.length]));
      towel.position.set(s * 3.4, 0.03, 2); g.add(towel);
    }
  });
  if (i % 2 === 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 2.8, 6), matTrunk);
    trunk.position.set(SHELF_X - 1.6, 1.4, -3); g.add(trunk);
    const leaves = new THREE.Mesh(new THREE.SphereGeometry(0.95, 8, 6), matPalm);
    leaves.scale.set(1.2, 0.4, 1.2);
    leaves.position.set(SHELF_X - 1.6, 2.9, -3); g.add(leaves);
  }
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat(BIKINIS[i % BIKINIS.length]));
  ball.position.set((i % 2 === 0 ? -2.6 : 2.2), 0.28, 1.5); g.add(ball);
  if (i % 3 === 0) {
    const boat = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.22, 0.55), mat(0xf4eee0));
    boat.position.set(-AISLE_W * 0.5 - 5.1, 0.08, 2); g.add(boat);
  }
  return g;
}

let worldLevel = 1;
function setTheme(lv: number) {
  if (lv === 4) {
    scene.background = new THREE.Color(0x6ec4f0);
    scene.fog = new THREE.Fog(0x6ec4f0, 24, 90);
    hemi.color.setHex(0xfff4d6);
    hemi.groundColor.setHex(0xc9b07a);
    hemi.intensity = 1.15;
    sun.intensity = 1.2;
    sun.position.set(10, 26, 4);
  } else if (lv === 3) {
    scene.background = new THREE.Color(0xf6e8d0);
    scene.fog = new THREE.Fog(0xf6e8d0, 26, 74);
    hemi.color.setHex(0xfff2dc);
    hemi.groundColor.setHex(0xa88a6a);
    hemi.intensity = 1.1;
    sun.intensity = 0.5;
    sun.position.set(-4, 18, 6);
  } else if (lv === 2) {
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
function makeWorldSeg(lv: number, i: number) {
  if (lv === 4) return makeBeachSegment(i);
  if (lv === 3) return makeFoodCourtSegment(i);
  if (lv === 2) return makeStreetSegment(i);
  return makeSegment(i);
}
function buildWorld(lv: number) {
  for (const s of scroll) scene.remove(s);
  scroll.length = 0;
  for (let i = 0; i < SEG_N; i++) {
    const s = makeWorldSeg(lv, i);
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
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.42, 0.42, 3.4, 10, 1, true),
    new THREE.MeshBasicMaterial({ color: 0xffee88, transparent: true, opacity: 0.15, depthWrite: false, side: THREE.DoubleSide }),
  );
  beam.position.y = 1.7; g.add(beam); g.userData.beam = beam;
  g.userData.cartVis = bat; g.userData.hornVis = horn;
  g.userData.gunVis = gun; g.userData.bombVis = bomb; g.userData.ring = ring;
  return g;
}
function getPickup(): any {
  for (const p of pickPool) if (!p.active) return p;
  const g: any = makePickupMesh();
  g.active = false; g.visible = false; scene.add(g); pickPool.push(g); return g;
}

const coinPool: any[] = [];
const matCoin = new THREE.MeshBasicMaterial({ color: 0xf0c020 });
const matCoinIn = new THREE.MeshBasicMaterial({ color: 0xfff0a0 });
function makeCoinMesh() {
  const g: any = new THREE.Group();
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.08, 14), matCoin);
  disc.rotation.z = Math.PI / 2;
  disc.position.y = 0.7;
  const inner = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 10), matCoinIn);
  inner.rotation.z = Math.PI / 2;
  inner.position.y = 0.7;
  g.add(disc); g.add(inner);
  return g;
}
function getCoin(): any {
  for (const c of coinPool) if (!c.active) return c;
  const g: any = makeCoinMesh();
  g.active = false; g.visible = false; scene.add(g); coinPool.push(g); return g;
}
function spawnCoin() {
  const r = Math.random();
  const lane = (Math.random() * slotsX.length) | 0;
  const put = (x: number, dz: number) => {
    const c = getCoin();
    c.active = true; c.visible = true;
    c.position.set(clamp(x, -CLAMP_X + 0.3, CLAMP_X - 0.3), 0, SPAWN_Z - dz);
  };
  if (r < 0.3) {
    for (let i = 0; i < 5; i++) put(slotsX[lane], i * 1.2);
  } else if (r < 0.55) {
    const l2 = lane >= slotsX.length - 1 ? lane - 1 : lane + 1;
    for (let i = 0; i < 6; i++) put(slotsX[i % 2 ? l2 : lane], i * 1.15);
  } else if (r < 0.8) {
    const ph = Math.random() * 3;
    for (let i = 0; i < 7; i++) put(Math.sin(i * 0.9 + ph) * 3.1, i * 1.1);
  } else {
    put(slotsX[lane], 0);
  }
}

const matGull = mat(0xf7f7f4);
const matGullWing = mat(0xffffff);
function makeSeagull() {
  const g: any = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.12, 0.16), matGull);
  const beak = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.04, 0.05), mat(0xff9a3a));
  beak.position.set(0.28, 0.02, 0);
  const wing = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.9), matGullWing);
  g.add(body); g.add(beak); g.add(wing);
  g.userData.wing = wing;
  g.visible = false;
  scene.add(g);
  return g;
}
const seagulls = [0, 1, 2, 3].map((i) => {
  const g = makeSeagull();
  g.userData.phase = i * 1.7;
  g.userData.vx = 3.4 + i * 0.45;
  g.userData.zBase = -4 - i * 3.5;
  return g;
});
function flapSeagulls(dt: number, now: number) {
  const on = worldLevel === 4;
  for (let i = 0; i < seagulls.length; i++) {
    const g = seagulls[i];
    g.visible = on;
    if (!on) continue;
    g.userData.phase += dt * g.userData.vx * 0.35;
    let x = -14 + ((g.userData.phase * 2.4) % 32);
    g.position.set(x, 3.4 + Math.sin(now * 0.003 + i) * 0.45, g.userData.zBase);
    g.userData.wing.rotation.z = Math.sin(now * 0.012 + i) * 0.55;
    g.rotation.y = 0.15;
  }
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
  fxBurst(b.position.x, 1.28, b.position.z - 0.1, 0xffee66, 1, 1.2, 0.6, 0.14);
  sfxGun();
}


// ---------- juice: particles, popups, flashes ----------
const elPops = document.getElementById('pops')!, elFx = document.getElementById('fx')!;
const parts: any[] = [];
const geoPart = new THREE.BoxGeometry(0.13, 0.13, 0.13);
function getPart(): any {
  for (const p of parts) if (!p.active) return p;
  if (parts.length >= 110) return null;
  const m: any = new THREE.Mesh(geoPart, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true }));
  m.active = false; m.visible = false; scene.add(m); parts.push(m); return m;
}
function fxBurst(x: number, y: number, z: number, color: number, n: number, spd = 4, up = 4.5, life = 0.6) {
  for (let i = 0; i < n; i++) {
    const p = getPart(); if (!p) return;
    p.active = true; p.visible = true; p.life = life * (0.7 + Math.random() * 0.6); p.maxLife = p.life;
    p.position.set(x, y, z);
    const a = Math.random() * 6.283;
    p.userData.vx = Math.cos(a) * spd * Math.random();
    p.userData.vz = Math.sin(a) * spd * Math.random();
    p.userData.vy = up * (0.4 + Math.random() * 0.7);
    p.material.color.setHex(color); p.material.opacity = 1;
    p.scale.setScalar(0.6 + Math.random() * 0.9);
  }
}
function updateParts(dt: number) {
  for (const p of parts) {
    if (!p.active) continue;
    p.life -= dt;
    if (p.life <= 0) { p.active = false; p.visible = false; continue; }
    p.userData.vy -= 14 * dt;
    p.position.x += p.userData.vx * dt;
    p.position.y += p.userData.vy * dt;
    p.position.z += p.userData.vz * dt;
    if (p.position.y < 0.05) { p.position.y = 0.05; p.userData.vy *= -0.3; }
    p.material.opacity = Math.min(1, p.life / p.maxLife * 1.6);
    p.rotation.x += dt * 9; p.rotation.y += dt * 7;
  }
}
const _pv = new THREE.Vector3();
function hexCss(n: number) { return '#' + n.toString(16).padStart(6, '0'); }
function popAt(x: number, y: number, z: number, text: string, color: string, big = false) {
  if (elPops.childElementCount > 9) return;
  _pv.set(x, y, z).project(camera);
  if (_pv.z > 1 || Math.abs(_pv.x) > 1.2) return;
  const d = document.createElement('div');
  d.className = 'pop' + (big ? ' big' : '');
  d.textContent = text;
  d.style.left = ((_pv.x * 0.5 + 0.5) * wrap.clientWidth) + 'px';
  d.style.top = ((-_pv.y * 0.5 + 0.5) * wrap.clientHeight) + 'px';
  d.style.color = color;
  elPops.appendChild(d);
  setTimeout(() => d.remove(), 900);
}
function screenFlash() {
  elFx.classList.remove('go'); void (elFx as HTMLElement).offsetWidth; elFx.classList.add('go');
}
const FXC: any = { shove: 0xffffff, cart: 0x7fd0ff, horn: 0xffd24a, gun: 0xff8a2a, bomb: 0xff4466 };
const FXW: any = { shove: 'BONK!', cart: 'WHACK!', horn: 'HONK!', gun: 'PEW!', bomb: 'BOOM!' };

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
let level = 1;
let coins = 0, hopT = 0, lvCoins = 0, coinStreak = 0, coinStreakT = 0;
let vault = 0; try { vault = parseInt(localStorage.getItem('sz_vault') || '0', 10) || 0; } catch (e) {}

const slotsX = [-3.4, -1.7, 0, 1.7, 3.4];
let spawnTimer = 0;
let scoreAcc = 0;
let pickTimer = 0;
let coinTimer = 0;

// ---------- input ----------
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM') toggleMute();
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') keys.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') keys.right = true;
  if (e.code === 'Space' || e.code === 'Enter') {
    e.preventDefault();
    if (state === S.clear) enterNextLevel();
    else doShove();
  }
});
window.addEventListener('keyup', (e) => {
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') { keys.left = false; tapLeft = STEER_TAP_BUFFER; }
  if (e.code === 'ArrowRight' || e.code === 'KeyD') { keys.right = false; tapRight = STEER_TAP_BUFFER; }
});
wrap.addEventListener('pointerdown', (e) => {
  if (state !== S.play) return;
  const tid = (e.target as HTMLElement).id;
  if (tid === 'shove' || tid === 'mute') return;
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
document.getElementById('continue')!.addEventListener('click', (e) => {
  e.stopPropagation();
  if (state === S.clear) enterNextLevel();
});

// ---------- audio ----------
let AC: AudioContext | null = null;
let master: DynamicsCompressorNode | null = null;
let outGain: GainNode | null = null, musicGain: GainNode | null = null;
let muted = false; try { muted = localStorage.getItem('sz_mute') === '1'; } catch (e) {}
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
      outGain = AC.createGain();
      outGain.gain.value = muted ? 0 : 1;
      master.connect(outGain); outGain.connect(AC.destination);
      musicGain = AC.createGain();
      musicGain.gain.value = 0.55;
      musicGain.connect(master);
      noiseBuf = AC.createBuffer(1, AC.sampleRate * 2, AC.sampleRate);
      const data = noiseBuf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function toggleMute() {
  muted = !muted;
  try { localStorage.setItem('sz_mute', muted ? '1' : '0'); } catch (e) {}
  if (outGain) outGain.gain.value = muted ? 0 : 1;
  document.getElementById('mute')!.classList.toggle('off', muted);
  audioResume();
}
document.addEventListener('visibilitychange', () => {
  if (!AC) return;
  if (document.hidden) AC.suspend(); else AC.resume();
});
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
  tone(196, 0.05, 'square', 0.12);
  tone(110, 0.09, 'square', 0.1, 0.04, 70);
  burst(0.05, 0.08, 800, 0, 'lowpass', 180);
}
function sfxCart() {
  tone(392, 0.05, 'square', 0.11);
  tone(247, 0.07, 'square', 0.09, 0.05);
  tone(98, 0.12, 'square', 0.08, 0.1, 55);
}
function sfxHorn() {
  tone(523, 0.16, 'square', 0.13);
  tone(262, 0.16, 'square', 0.08);
  tone(523, 0.13, 'square', 0.12, 0.26);
  tone(262, 0.13, 'square', 0.07, 0.26);
}
function sfxGun() {
  tone(180 + Math.random() * 50, 0.028, 'square', 0.08);
  burst(0.025, 0.09, 2400, 0, 'highpass', 500);
}
function sfxBomb() {
  tone(180, 0.2, 'square', 0.14, 0, 42);
  tone(90, 0.4, 'square', 0.1, 0.05, 28);
  burst(0.35, 0.18, 380, 0, 'lowpass', 48);
  burst(0.07, 0.1, 1800, 0, 'highpass', 400);
}
function sfxPickup(_kind: string) {
  tone(523, 0.06, 'square', 0.09);
  tone(659, 0.07, 'square', 0.08, 0.055);
  tone(784, 0.11, 'square', 0.07, 0.11);
}
const MAJOR = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16];
function sfxCoin(step = 0) {
  const r = Math.pow(2, MAJOR[Math.min(step, MAJOR.length - 1)] / 12);
  tone(988 * r, 0.06, 'square', 0.1);
  tone(1319 * r, 0.12, 'square', 0.09, 0.06);
}
function sfxBump() {
  tone(98, 0.12, 'square', 0.11, 0, 48);
  burst(0.09, 0.1, 180, 0, 'lowpass', 50);
}
function sfxNear(n: number) {
  const f = 523 + Math.min(n, 10) * 42;
  tone(f, 0.05, 'square', 0.07);
  tone(f * 1.25, 0.07, 'square', 0.045, 0.04);
}
function sfxOver() {
  tone(196, 0.16, 'square', 0.1, 0, 110);
  tone(147, 0.2, 'square', 0.09, 0.14, 80);
  tone(98, 0.32, 'square', 0.08, 0.3, 48);
}
function sfxFanfare() {
  tone(523, 0.11, 'square', 0.11);
  tone(659, 0.11, 'square', 0.11, 0.11);
  tone(784, 0.13, 'square', 0.12, 0.22);
  tone(1046, 0.28, 'square', 0.13, 0.36);
}
function sfx1up() {
  [659, 784, 1319, 1046, 1175, 1568].forEach((f, i) => tone(f, 0.09, 'square', 0.1, i * 0.075));
}
function sfxBanner() {
  tone(392, 0.07, 'square', 0.09);
  tone(587, 0.07, 'square', 0.09, 0.08);
  tone(784, 0.2, 'square', 0.1, 0.16);
}
function sfxWallet(k: number, n: number) {
  tone(660 + (k / Math.max(1, n)) * 700, 0.05, 'square', 0.07);
}
function sfxKaching() {
  tone(1319, 0.07, 'square', 0.1);
  tone(1760, 0.3, 'square', 0.11, 0.08);
  burst(0.05, 0.08, 6000, 0, 'highpass');
}

// ---------- chiptune music ----------
const THEMES: any = {
  1: { bpm: 126, roots: [48, 53, 55, 48], minor: false, lead: 0 },
  2: { bpm: 136, roots: [50, 55, 57, 55], minor: false, lead: 1 },
  3: { bpm: 116, roots: [45, 50, 52, 43], minor: true, lead: 2 },
  4: { bpm: 142, roots: [52, 57, 59, 57], minor: false, lead: 3 },
};
const LEADS = [
  [0, -1, 2, -1, 3, -1, 2, -1, 0, -1, 2, -1, 3, 2, 1, -1],
  [3, 2, 1, 0, 3, 2, 1, 0, 2, 1, 0, 1, 2, 3, 2, 1],
  [0, -1, -1, 2, -1, 3, -1, -1, 0, -1, -1, 2, -1, 1, -1, -1],
  [0, 2, 3, 2, 0, 2, 3, 2, 1, 2, 3, 2, 1, 2, 3, 3],
];
let musicOn = false, musicStage = 1, musicStep = 0, musicNext = 0, musicTimer: any = 0;
function mtof(n: number) { return 440 * Math.pow(2, (n - 69) / 12); }
function mTone(t: number, freq: number, dur: number, type: OscillatorType, vol: number, freqEnd?: number) {
  if (!AC || !musicGain) return;
  const o = AC.createOscillator(); o.type = type;
  o.frequency.setValueAtTime(freq, t);
  if (freqEnd) o.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), t + dur);
  const g = AC.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g); g.connect(musicGain);
  o.start(t); o.stop(t + dur + 0.03);
}
function mNoise(t: number, dur: number, vol: number, ffreq: number) {
  if (!AC || !musicGain || !noiseBuf) return;
  const src = AC.createBufferSource(); src.buffer = noiseBuf;
  const f = AC.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = ffreq;
  const g = AC.createGain();
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  src.connect(f); f.connect(g); g.connect(musicGain);
  src.start(t, Math.random()); src.stop(t + dur + 0.02);
}
function playStep(th: any, step: number, t: number, sd: number) {
  const bar = (step >> 4) & 3, st = step & 15;
  const root = th.roots[bar];
  const tri = [0, th.minor ? 3 : 4, 7, 12];
  if (st % 2 === 0) mTone(t, mtof(root - 12 + (st % 8 === 6 ? 7 : 0)), sd * 1.8, 'square', 0.05);
  if (st % 4 === 0) mTone(t, 150, 0.12, 'sine', 0.24, 42);
  if (st === 4 || st === 12) { mNoise(t, 0.09, 0.09, 1800); mTone(t, 230, 0.06, 'triangle', 0.05, 120); }
  if (st % 2 === 1 || gunT > 0) mNoise(t, 0.028, 0.035, 7500);
  const li = LEADS[th.lead][st];
  if (li >= 0) mTone(t, mtof(root + 12 + tri[li]), sd * 1.5, 'square', 0.022);
}
function musicTick() {
  if (!AC || !musicOn) return;
  const th = THEMES[musicStage] || THEMES[1];
  const sd = 60 / th.bpm / 4;
  if (musicNext < AC.currentTime - 0.3) musicNext = AC.currentTime + 0.05;
  while (musicNext < AC.currentTime + 0.18) {
    playStep(th, musicStep, musicNext, sd);
    musicNext += sd; musicStep++;
  }
}
function startMusic(stage: number) {
  musicStage = Math.min(stage, 4);
  if (musicOn || !AC) return;
  musicOn = true; musicStep = 0; musicNext = AC.currentTime + 0.08;
  musicTimer = setInterval(musicTick, 40);
}
function stopMusic() {
  musicOn = false;
  clearInterval(musicTimer);
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
  elShoveHint = document.getElementById('shoveHint')!,
  elCurtain = document.getElementById('curtain')!, elLevel = document.getElementById('level')!,
  elGlitz = document.getElementById('cGlitz')!, elArsenal = document.getElementById('arsenal')!,
  elCoins = document.getElementById('coins')!,
  elCKicker = document.getElementById('cKicker')!, elCTitle = document.getElementById('cTitle')!,
  elCSub = document.getElementById('cSub')!, elCPrizes = document.getElementById('cPrizes')!,
  elContinue = document.getElementById('continue')!,
  elBanner = document.getElementById('banner')!, elBKick = document.getElementById('bKick')!,
  elBName = document.getElementById('bName')!, elMute = document.getElementById('mute')!,
  elFly = document.getElementById('cFly')!, elWallet = document.getElementById('wallet')!,
  elWCount = document.getElementById('wCount')!, elWNote = document.getElementById('wNote')!,
  elVault = document.getElementById('vault')!;
elMute.addEventListener('click', toggleMute);
elMute.classList.toggle('off', muted);
elVault.textContent = String(vault);
function showBanner() {
  const st = stageOf();
  elBKick.textContent = 'LEVEL ' + level;
  elBName.textContent = st.name;
  elBanner.classList.remove('show'); void (elBanner as HTMLElement).offsetWidth; elBanner.classList.add('show');
  sfxBanner();
}
let walletTimers: number[] = [];
function clearWallet() {
  for (const t of walletTimers) clearTimeout(t);
  walletTimers = [];
  elFly.innerHTML = '';
}
function runWallet() {
  clearWallet();
  const startBank = coins - lvCoins;
  elWCount.textContent = String(startBank);
  elWNote.textContent = '';
  const n = Math.min(lvCoins, 30);
  const T0 = 1350, DUR = 700, STEP = 62;
  if (n === 0) { elWNote.textContent = 'Empty pockets. The crowd kept the change.'; return; }
  walletTimers.push(window.setTimeout(() => {
    const fr = elFly.getBoundingClientRect(), wr = elWallet.getBoundingClientRect();
    const tx = wr.left + wr.width / 2 - fr.left - 10, ty = wr.top + 12 - fr.top - 10;
    for (let k = 0; k < n; k++) {
      const c = document.createElement('div'); c.className = 'fc';
      const sx = 10 + Math.random() * Math.max(20, fr.width - 40), sy = Math.random() * 44;
      elFly.appendChild(c);
      c.animate([
        { transform: 'translate(' + sx + 'px,' + sy + 'px) scale(0)', opacity: 0 },
        { transform: 'translate(' + sx + 'px,' + (sy - 12) + 'px) scale(1.3)', opacity: 1, offset: 0.22 },
        { transform: 'translate(' + tx + 'px,' + ty + 'px) scale(.55)', opacity: 1 },
      ], { duration: DUR, delay: k * STEP, easing: 'ease-in', fill: 'both' });
      walletTimers.push(window.setTimeout(() => {
        const shown = Math.round((k + 1) * lvCoins / n);
        elWCount.textContent = String(startBank + shown);
        elWallet.classList.remove('bump'); void (elWallet as HTMLElement).offsetWidth; elWallet.classList.add('bump');
        sfxWallet(k, n);
      }, k * STEP + DUR * 0.94));
    }
    walletTimers.push(window.setTimeout(() => {
      elWNote.textContent = '+' + lvCoins + ' this level' + (lvCoins >= 25 ? ' \u2014 coin hog!' : lvCoins >= 12 ? ' \u2014 nice haul' : '');
      sfxKaching();
    }, (n - 1) * STEP + DUR + 120));
  }, T0));
}
function drawLives() {
  elLives.innerHTML = '';
  const n = Math.max(LIVES_MAX, lives);
  for (let i = 0; i < n; i++) {
    const h = document.createElement('div');
    h.className = 'heart' + (i >= lives ? ' gone' : '');
    elLives.appendChild(h);
  }
}
function drawCoins() {
  elCoins.textContent = String(coins);
}
function drawArsenal() {
  const list = gunT > 0 ? ['gun', ...powerQ] : powerQ.slice();
  elArsenal.innerHTML = '';
  if (!list.length) { elArsenal.classList.add('hide'); return; }
  elArsenal.classList.remove('hide');
  for (let i = 0; i < list.length; i++) {
    const k = list[i];
    const d = document.createElement('div');
    d.className = 'slot slot-' + k + (i === 0 ? ' next' : '');
    d.textContent = POWERS[k].name;
    elArsenal.appendChild(d);
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
function collectCoin(x: number, z: number) {
  coins++; lvCoins++;
  score(COIN_VALUE);
  hopT = 0.2;
  coinStreak = coinStreakT > 0 ? Math.min(coinStreak + 1, 9) : 0;
  coinStreakT = 0.95;
  drawCoins();
  sfxCoin(coinStreak);
  fxBurst(x, 0.8, z, 0xffe27a, 6, 3, 3.5, 0.5);
  popAt(x, 1.6, z, '+' + COIN_VALUE, '#ffe27a');
  if (coins % COIN_1UP === 0) {
    if (lives < LIVES_CAP) {
      lives++; drawLives(); flash('1UP!', '#7ee08a'); sfx1up();
      popAt(player.position.x, 2.6, player.position.z, '1UP!', '#7ee08a', true);
    } else { score(100); flash('COIN BONUS +100', '#f0d078'); sfx1up(); }
  } else if (coins % 10 === 0) flash(coins + ' COINS!', '#f0d078');
}
function refreshPowerHud() {
  power = peekPower();
  if (gunT <= 0) elShoveName.textContent = POWERS[power].name;
  elShove.classList.remove('power-cart', 'power-horn', 'power-gun', 'power-bomb');
  if (power === 'cart') elShove.classList.add('power-cart');
  if (power === 'horn') elShove.classList.add('power-horn');
  if (power === 'gun') elShove.classList.add('power-gun');
  if (power === 'bomb') elShove.classList.add('power-bomb');
  elShoveHint.textContent = 'SPACE';
  drawArsenal();
  batProp.visible = power === 'cart' || cartRush > 0;
  hornProp.visible = power === 'horn' || scareT > 0;
  gunProp.visible = power === 'gun' || gunT > 0;
}
function setPower(next: string) {
  powerQ.length = 0;
  if (next !== 'shoulder' && next !== 'gun') powerQ.push(next);
  if (next === 'gun') powerQ.push('gun');
  refreshPowerHud();
}
function collectPower(kind: string) {
  if (kind === 'gun' && gunT > 0) {
    startGun(true);
    return;
  }
  powerQ.push(kind);
  refreshPowerHud();
  const hex = '#' + PICK_COL[kind].toString(16).padStart(6, '0');
  if (gunT > 0 || powerQ.length > 1) flash(POWERS[kind].name + ' QUEUED', hex);
  else flash(POWERS[kind].name + ' READY', hex);
}
function consumeReadyPower() {
  if (powerQ[0]) powerQ.shift();
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
      const crowdKind = stageOf().crowd;
      const type = packing
        ? (crowdKind === 'inf' || crowdKind === 'beach' ? 'inf' : 'text')
        : crowdKind === 'inf' || crowdKind === 'beach'
          ? (Math.random() < 0.86 ? 'inf' : 'text')
          : crowdKind === 'mall'
            ? (r < 0.38 ? 'talk' : r < 0.74 ? 'text' : 'selfie')
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
  p.userData.beam.material.color.setHex(PICK_COL[kind]);
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
  const fcol = FXC[fx] || 0xffffff;
  fxBurst(z.position.x, 1.1, z.position.z, fcol, fx === 'gun' ? 3 : fx === 'bomb' ? 4 : 9, fx === 'bomb' ? 7 : 4.5, 5);
  if (fx === 'gun' ? Math.random() < 0.18 : fx === 'bomb' ? Math.random() < 0.25 : true) {
    popAt(z.position.x, 2.1, z.position.z, FXW[fx] || 'BONK!', hexCss(fcol === 0xffffff ? 0xffe27a : fcol));
  }
}
function thinForGun() {
  // Don't wipe the crowd. Bullets only hit what's on the barrel line.
  spawnTimer = 0.28;
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
    hitStop = 0.11; fovKick = 7; screenFlash();
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
  if (got) hitStop = 0.05;
  fovKick = Math.max(fovKick, kind === 'horn' ? 3 : 4);
  refreshPowerHud();
}
function doShove() {
  if (state !== S.play) return;
  if (gunT > 0) return;
  audioResume();
  const ready = peekPower();
  if (ready === 'gun') {
    consumeReadyPower();
    startGun(false);
    return;
  }
  if (ready === 'bomb' || ready === 'cart' || ready === 'horn') {
    consumeReadyPower();
    fireWeapon(ready);
    return;
  }
  if (shoveCd > 0) return;
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

function fillGlitz() {
  elGlitz.innerHTML = '';
  const bits = ['★', '✦', '●', '◆', '✧', '•'];
  const cols = ['#f0d078', '#ff7a2f', '#fff6d0', '#ff5a3c', '#7fd0ff', '#ffe27a'];
  for (let i = 0; i < 26; i++) {
    const s = document.createElement('span');
    s.className = 'spark';
    s.textContent = bits[i % bits.length];
    s.style.left = (4 + Math.random() * 92) + '%';
    s.style.animationDelay = (Math.random() * 1.6) + 's';
    s.style.animationDuration = (1.8 + Math.random() * 1.4) + 's';
    s.style.color = cols[i % cols.length];
    s.style.fontSize = (11 + ((i * 7) % 16)) + 'px';
    elGlitz.appendChild(s);
  }
}
function beginClear() {
  const st = stageOf();
  if (state !== S.play || !st.clearAt) return;
  state = S.clear;
  elShove.classList.add('hide');
  fillGlitz();
  const c = st.curtain;
  elCKicker.textContent = c.kicker;
  elCTitle.textContent = c.title;
  elCSub.textContent = c.sub;
  elContinue.textContent = c.go;
  const next = STAGES[level];
  const chips = ['♥ BONUS LIFE'].concat((next ? next.kit : []).map((k: string) => POWERS[k].name));
  elCPrizes.innerHTML = chips.map((t: string) => '<span>' + t + '</span>').join('');
  elCurtain.classList.remove('hide');
  void elCurtain.offsetWidth;
  elCurtain.classList.add('show');
  stopMusic();
  sfxFanfare();
  runWallet();
}
function enterNextLevel() {
  if (state !== S.clear) return;
  level += 1;
  const st = stageOf();
  lives = Math.min(lives + 1, LIVES_CAP);
  for (const k of st.kit) powerQ.push(k);
  refreshPowerHud();
  drawLives();
  elLevel.textContent = 'Lv ' + level;
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  for (const b of bullets) { b.active = false; b.visible = false; }
  buildWorld(level);
  clearWallet(); lvCoins = 0; coinStreak = 0; coinStreakT = 0;
  spawnTimer = 0.45; pickTimer = 2.4; coinTimer = 0.8;
  cartRush = 0; scareT = 0;
  spawnWave();
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  elShove.classList.remove('hide');
  state = S.play;
  refreshPowerHud();
  invuln = Math.max(invuln, 1.35);
  hopT = 0.22;
  startMusic(level);
  showBanner();
}

// ---------- lifecycle ----------
function start() {
  audioResume();
  for (const z of pool) { z.active = false; z.visible = false; }
  for (const p of pickPool) { p.active = false; p.visible = false; }
  for (const c of coinPool) { c.active = false; c.visible = false; }
  dist = 0; speed = SPEED; lives = LIVES_MAX; combo = 0; bestCombo = 0; invuln = 0; shake = 0;
  shoveCd = 0; lastCd = POWERS.shoulder.cd; cartRush = 0; scareT = 0; gunT = 0; gunCd = 0; scoreAcc = 0;
  powerQ.length = 0;
  coins = 0; hopT = 0; lvCoins = 0; coinStreak = 0; coinStreakT = 0; clearWallet();
  level = 1;
  elLevel.textContent = 'Lv 1';
  elCurtain.classList.remove('show');
  elCurtain.classList.add('hide');
  if (worldLevel !== 1) buildWorld(1);
  for (const b of bullets) { b.active = false; b.visible = false; }
  spawnTimer = SPAWN_GAP; pickTimer = 2.2; coinTimer = 1.2;
  spawnWave();
  vx = 0; lean = 0; tapLeft = 0; tapRight = 0;
  pointerActive = false; pointerFlick = 0; touchAnchorX = 0;
  player.position.set(0, 0, 6.5); player.rotation.set(0, 0, 0);
  setPower('shoulder');
  state = S.play;
  document.getElementById('menu')!.classList.add('hide');
  document.getElementById('over')!.classList.add('hide');
  elShove.classList.remove('hide');
  drawLives(); drawCoins(); elScore.textContent = '0';
  startMusic(1); showBanner();
  last = performance.now();
}
function gameOver(cause: string) {
  state = S.over; elShove.classList.add('hide');
  elArsenal.classList.add('hide');
  elCurtain.classList.remove('show'); elCurtain.classList.add('hide');
  batProp.visible = false; hornProp.visible = false; gunProp.visible = false; gunT = 0; powerQ.length = 0;
  stopMusic();
  const total = Math.floor(dist) + scoreAcc;
  const newBest = total > best && best > 0;
  vault += coins; try { localStorage.setItem('sz_vault', String(vault)); } catch (e) {}
  elVault.textContent = String(vault);
  document.getElementById('fCoins')!.textContent = String(coins);
  if (total > best) { best = total; try { localStorage.setItem('sz_best', String(best)); } catch (e) {} }
  document.getElementById('fScore')!.textContent = String(total);
  document.getElementById('fBest')!.textContent = String(best);
  document.getElementById('fCombo')!.textContent = String(bestCombo);
  const titles = ['BONK!', 'OOF!', 'SPLAT!', 'PHONE FACE!', 'DOWN YOU GO!', 'AISLE WIPEOUT!'];
  const verdicts = ['Composure: gone', 'Caught in 4K', 'That\'s a wrap', 'Out of chill', 'Face met floor'];
  const msgs: any = {
    selfie: [
      'You photobombed the wrong shoot. They kept rolling.',
      'Selfie stick: 1. You: a pile.',
      'Congrats — you\'re the crash in someone\'s story.',
    ],
    text: [
      'A texter used you as a bumper. Still typing.',
      'They never looked up. You did. That\'s the joke.',
      'Head down, thumbs up, you down.',
    ],
    talk: [
      'A caller took a left through your personal space. Then your face.',
      'They said "can you hear me now?" Loud and clear. With your nose.',
      'Hands-free walking. You were the free part.',
    ],
    inf: [
      'Ring light, tripod, you. Only one of those wanted to be on the floor.',
      'She filmed the wipeout. It already has a sound on it.',
      'Influencer: 1. Sidewalk: you.',
    ],
    mall: [
      'You were the obstacle in someone\'s mall-map walking tour.',
      'Food-court GPS said "you have arrived." You had.',
    ],
  };
  const m = msgs[cause] || msgs.talk;
  document.getElementById('overTitle')!.textContent = titles[(Math.random() * titles.length) | 0];
  document.getElementById('verdict')!.textContent = newBest ? '\u2605 NEW BEST \u2605' : verdicts[(Math.random() * verdicts.length) | 0];
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
  frame(dt, now);
  renderer.render(scene, camera);
}

// One simulation step: everything except drawing. The replay harness calls this directly.
function frame(dt: number, now: number) {
  if (hitStop > 0) { hitStop -= dt; dt *= 0.06; }

  if (state === S.play) {
    speed = SPEED;
    dist += speed * dt;
    const total = Math.floor(dist) + scoreAcc;
    elScore.textContent = String(total);
    const st = stageOf();
    if (st.clearAt && total >= st.clearAt) beginClear();

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
    if (hopT > 0) {
      hopT -= dt;
      const u = 1 - Math.max(0, hopT) / 0.2;
      player.position.y = Math.sin(u * Math.PI) * 0.28;
      if (hopT <= 0) { hopT = 0; player.position.y = 0; }
    } else player.position.y = 0;
    gait(player, now * 0.014, 0.55);
    batProp.visible = power === 'cart' || cartRush > 0;
    hornProp.visible = power === 'horn' || scareT > 0;

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
    coinTimer -= dt;
    if (coinTimer <= 0) {
      spawnCoin();
      coinTimer = COIN_GAP + Math.random() * 1.1;
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
      const cooling = power === 'shoulder' ? shoveCd / lastCd : 0;
      (elCool as HTMLElement).style.transform = 'scaleY(' + cooling + ')';
    }
    if (invuln > 0) invuln -= dt;
    if (coinStreakT > 0) coinStreakT -= dt;
    wrap.classList.toggle('hot', gunT > 0);
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
        if (z.position.z > player.position.z - GUN_FRONT) continue;
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
        fxBurst(pk.position.x, 0.9, pk.position.z, PICK_COL[kind], 12, 4, 5);
        popAt(pk.position.x, 2.0, pk.position.z, POWERS[kind].name + '!', hexCss(PICK_COL[kind]), true);
        fovKick = Math.max(fovKick, 2);
        collectPower(kind);
      }
    }
    for (const cn of coinPool) {
      if (!cn.active) continue;
      cn.position.z += speed * dt;
      cn.rotation.y += dt * 4.2;
      cn.position.y = Math.abs(Math.sin(now * 0.006)) * 0.08;
      if (cn.position.z > 16) { cn.active = false; cn.visible = false; continue; }
      if (Math.abs(cn.position.z - pz) < 1.05 && Math.abs(cn.position.x - px) < 0.95) {
        cn.active = false; cn.visible = false;
        collectCoin(cn.position.x, cn.position.z);
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
            if (combo >= 3) flash((combo >= 8 ? 'WHOA ×' : combo >= 5 ? 'SLIPPERY ×' : 'NICE ×') + combo + '  +' + bonus, gap < 1.6 ? 'var(--accent)' : 'var(--talk)');
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
  flapSeagulls(dt, now);
  updateParts(dt);
  if (state !== S.play) wrap.classList.remove('hot');
  if (fovKick > 0) fovKick = Math.max(0, fovKick - dt * 24);
  const wantFov = baseFov + fovKick;
  if (Math.abs(camera.fov - wantFov) > 0.01) { camera.fov = wantFov; camera.updateProjectionMatrix(); }
}

drawLives();
setPower('shoulder');

// ---------- dev: deterministic replay (verifies refactors play identically) ----------
// Open the game with ?replay, then run window.__replay.run(1234, 7200) in the console.
// Fixed 1/60s steps, seeded Math.random, scripted input. Returns a trace + hash to diff.
function runReplay(seed: number, frames: number) {
  let a = seed >>> 0, calls = 0;
  Math.random = () => {
    calls++;
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const lines: string[] = [];
  const cycle = ['cart', 'horn', 'gun', 'bomb'];
  let clearFrame = -1;
  start();
  for (let f = 0; f < frames; f++) {
    const ph = f % 300;
    keys.left = ph < 50;
    keys.right = ph >= 100 && ph < 190;
    pointerActive = f >= 600 && f < 700;
    if (pointerActive) { pointerOriginX = 200; pointerX = 200 + (f - 600) * 2; if (f === 600) touchAnchorX = 0; }
    if (f % 45 === 0) doShove();
    if (f % 500 === 250) collectPower(cycle[(f / 500 | 0) % 4]);
    if (f === 1500 || f === 3500 || f === 5500) scoreAcc += 600;
    if (f % 400 === 0 && state === S.play) { lives = LIVES_MAX; drawLives(); }
    if (state === S.over || state === S.menu) start();
    if (state === S.clear) { if (clearFrame < 0) clearFrame = f; if (f - clearFrame > 30) { enterNextLevel(); clearFrame = -1; } }
    frame(1 / 60, f * 1000 / 60);
    if (f % 60 === 0) {
      let sx = 0, sz = 0, kn = 0, n = 0;
      for (const z of pool) if (z.active) { n++; sx += z.position.x; sz += z.position.z; if (z.userData.knocked) kn++; }
      const cnt = (arr: any[]) => arr.filter((o) => o.active).length;
      lines.push([f, state, level, Math.round(dist * 1000), scoreAcc, lives, combo, coins, Math.round(gunT * 1000),
        Math.round(player.position.x * 1000), n, Math.round(sx * 1000), Math.round(sz * 1000), kn,
        cnt(pickPool), cnt(coinPool), cnt(bullets), cnt(parts), calls].join(','));
    }
  }
  let h = 2166136261;
  for (const ch of lines.join('|')) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619) >>> 0; }
  return { hash: h, calls, count: lines.length, lines };
}
if (new URLSearchParams(location.search).has('replay')) {
  (window as any).__replay = { run: runReplay };
}

requestAnimationFrame(tick);
