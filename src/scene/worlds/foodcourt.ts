// Level 3: food court.
import * as THREE from 'three';
import { AISLE_W, SEG_LEN } from '../../config';
import { cmat } from '../../render/materials';
import { matPalm } from './street';

// ---------- food court ----------
const texCache: any = {};
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
const FC_W = 5.7;
                    // inner face of the food-court walls
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
export function makeFoodCourtSegment(i: number): any {
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