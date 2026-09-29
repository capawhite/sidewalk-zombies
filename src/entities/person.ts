// Procedural low-poly people, poses and walk cycle.
import * as THREE from 'three';
import { BIKINIS, COL, HAIR, LONG_HAIR, PANTS, SKINS } from '../config';
import { mat } from '../render/materials';

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
export function makePerson(shirtColor: number, isPlayer: boolean): any {
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
export function makeInfluencer(): any {
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
export function applyPose(z: any, type: string) {
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
export function gait(z: any, t: number, amt: number) {
  const d = z.userData;
  if (!d.lLeg) return;
  const sw = Math.sin(t) * amt;
  d.lLeg.rotation.x = sw;
  d.rLeg.rotation.x = -sw;
  if (d.knocked || d.type === 'text' || d.type === 'selfie' || d.type === 'talk' || d.type === 'inf') return;
  d.lArm.rotation.x = -sw * 0.7;
  d.rArm.rotation.x = sw * 0.7;
}