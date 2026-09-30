// Level 3: food court.
//
// Stall fronts and seating bays alternate along both walls. Signs, menus and posters come from one atlas
// (art/foodcourtAtlas.ts); the 3D food icons and furniture are plain-coloured so they merge with everything else.
import * as THREE from 'three';
import { AISLE_W, SEG_LEN } from '../../config';
import { cmat, glowColor, pbr } from '../../render/materials';
import { STALLS, foodCourtKit } from '../art/foodcourtAtlas';
import { atlasBox, atlasPlane } from '../kit/parts';
import { matPalm } from './props';

const FC_W = 5.7; // inner face of the food-court walls
const matGlass = pbr({ color: 0xbfe4f0, transparent: true, opacity: 0.32, roughness: 0.1 });
const matNeonGold = new THREE.MeshBasicMaterial({ color: glowColor(0xffd27a, 3) });
const matNeonMagenta = new THREE.MeshBasicMaterial({ color: glowColor(0xff4d8a, 3) });
const matNeonCyan = new THREE.MeshBasicMaterial({ color: glowColor(0x4fd2ff, 3) });

function makeFoodIcon(kind: string): THREE.Group {
  const g = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, color: number, x = 0, y = 0, z = 0) => {
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
    s.material = pbr({ color: 0xf0c14b, side: THREE.DoubleSide });
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

function buildStall(g: THREE.Group, s: number, zc: number, stallIndex: number) {
  const { atlas, material } = foodCourtKit();
  const st = STALLS[stallIndex];
  const bg = new THREE.Color(st.bg).getHex();
  const counter = new THREE.Mesh(new THREE.BoxGeometry(0.75, 1.0, 8.6), cmat(bg));
  counter.position.set(s * (FC_W - 0.4), 0.5, zc); g.add(counter);
  g.add(atlasBox(material, atlas.rect('counter'), 0.95, 0.08, 8.8, s * (FC_W - 0.4), 1.04, zc, { omit: ['ny'] }));
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
  g.add(atlasPlane(material, atlas.rect('menu' + (stallIndex % 3)), 5.4, 1.05, s * (FC_W - 0.03), 2.05, zc, -s * Math.PI / 2));
  g.add(atlasPlane(material, atlas.rect('sign' + stallIndex), 3.8, 0.95, s * (FC_W - 0.04), 3.85, zc, -s * Math.PI / 2));
  const icon = makeFoodIcon(st.icon);
  icon.scale.setScalar(1.6);
  icon.position.set(s * (FC_W + 0.7), 4.4, zc);
  icon.rotation.y = -s * Math.PI / 2;
  g.add(icon);
}

function buildSeating(g: THREE.Group, s: number, zs: number, i: number) {
  const { atlas, material } = foodCourtKit();
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
  g.add(atlasPlane(material, atlas.rect('poster'), 3.4, 0.9, s * (FC_W - 0.03), 2.5, zs, -s * Math.PI / 2));
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.22, 0.5, 8), cmat(0xb8683a));
  pot.position.set(s * (FC_W - 0.4), 0.25, zs + 4.4); g.add(pot);
  const bush = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), matPalm);
  bush.position.set(s * (FC_W - 0.4), 0.85, zs + 4.4); g.add(bush);
  const lampCable = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 5.9, 4), cmat(0x333333));
  lampCable.position.set(tx, 9.55, zs); g.add(lampCable);
  const shade = new THREE.Mesh(new THREE.ConeGeometry(0.55, 0.38, 10), new THREE.MeshBasicMaterial({ color: stoolCols[(i + 1) % 4] }));
  shade.position.set(tx, 6.5, zs); g.add(shade);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), matNeonGold);
  bulb.position.set(tx, 6.25, zs); g.add(bulb);
}

export function makeFoodCourtSegment(variant: number): THREE.Group {
  const { atlas, material, floor: floorMat } = foodCourtKit();
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(AISLE_W + 10, SEG_LEN), floorMat);
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  [-1, 1].forEach((s) => {
    const side = s > 0 ? 1 : 0;
    const wall = atlas.rect((variant + side) % 2 === 0 ? 'wallA' : 'wallB');
    g.add(atlasBox(material, wall, 2.8, 4.4, SEG_LEN - 0.02, s * (FC_W + 1.4), 2.2, 0, {
      bottom: 0.8, castShadow: true, receiveShadow: true,
    }));
    const trim = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, SEG_LEN), s > 0 ? matNeonMagenta : matNeonCyan);
    trim.position.set(s * (FC_W - 0.04), 4.28, 0); g.add(trim);
    const stallFront = ((variant + side) % 2) === 0;
    const zc = stallFront ? -5 : 5;
    buildStall(g, s, zc, (variant * 2 + side) % STALLS.length);
    buildSeating(g, s, -zc, variant);
  });
  if (variant === 0) {
    g.add(atlasPlane(material, atlas.rect('banner'), 7, 1.2, 0, 7.2, 0, 0));
    // The banner is a one-sided plane; a second copy faces the other way so it reads from both directions.
    g.add(atlasPlane(material, atlas.rect('banner'), 7, 1.2, 0, 7.2, 0, Math.PI));
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
