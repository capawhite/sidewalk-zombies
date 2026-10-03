// Stage 5: cosmetic meta — funny unlocks for vault coins. No gameplay power.
//
// Three slots: look (body + colours), bonk prop (visual only), horn sound.
// Catalog is data-driven; add rows here to ship more unlocks later.
import * as THREE from 'three';
import { mat } from '../render/materials';
import { G } from '../state';
import type { BodyName } from '../entities/character/kit';

export type CosmoKind = 'look' | 'bonk' | 'horn';

export interface CosmoItem {
  id: string;
  kind: CosmoKind;
  name: string;
  blurb: string;
  price: number; // 0 = starter unlock
  // look fields
  body?: BodyName;
  skin?: number;
  shirt?: number;
  pants?: number;
  hair?: number;
  shoes?: number;
  cap?: boolean; // baseball-cap bill
}

const LS_OWN = 'sz_cosmo_own';
const LS_EQ = 'sz_cosmo_eq';
const QUIET = typeof location !== 'undefined' && new URLSearchParams(location.search).has('replay');

/** Starter + lean first wave. Balance is flavour-only. */
export const COSMETICS: CosmoItem[] = [
  // —— looks ——
  {
    id: 'look_runner', kind: 'look', name: 'Runner', blurb: 'Default red-shirt menace.',
    price: 0, body: 'man', skin: 0xf0c4a0, shirt: 0xff5a3c, pants: 0x2a3140, hair: 0xd8362b, cap: true,
  },
  {
    id: 'look_dad', kind: 'look', name: 'Angry Dad', blurb: 'Cargo shorts. Short fuse.',
    price: 60, body: 'tank', skin: 0xe8b090, shirt: 0x3a5a40, pants: 0xc4a35a, hair: 0x3a2a1a, shoes: 0x4a4030, cap: false,
  },
  {
    id: 'look_grandma', kind: 'look', name: 'Grandma', blurb: 'Sweet. Unstoppable.',
    price: 70, body: 'dress', skin: 0xf2d0b8, shirt: 0xd4a0c8, pants: 0xd4a0c8, hair: 0xc8c4bc, shoes: 0xf0e0d0, cap: false,
  },
  {
    id: 'look_tourist', kind: 'look', name: 'Tourist', blurb: 'Map in one hand, denial in the other.',
    price: 50, body: 'man', skin: 0xf5c9a0, shirt: 0xffcc33, pants: 0x4a7ab0, hair: 0x5a3a20, shoes: 0xe8dcc0, cap: true,
  },
  {
    id: 'look_jogger', kind: 'look', name: 'Jogger', blurb: 'AirPods at 11. Eyes at 0.',
    price: 55, body: 'man', skin: 0xd4a078, shirt: 0xff2d6a, pants: 0x1a1a1a, hair: 0x1a1a1a, shoes: 0xffffff, cap: false,
  },
  {
    id: 'look_biz', kind: 'look', name: 'Businessperson', blurb: 'Late to a meeting that could\'ve been a bonk.',
    price: 80, body: 'man', skin: 0xe0b090, shirt: 0x1e2a44, pants: 0x1a2030, hair: 0x2a2218, shoes: 0x111111, cap: false,
  },
  {
    id: 'look_goth', kind: 'look', name: 'Mall Goth', blurb: 'Black everything. Still on TikTok.',
    price: 65, body: 'woman', skin: 0xe8c8b8, shirt: 0x1a1a22, pants: 0x121218, hair: 0x1a1020, shoes: 0x2a2a2a, cap: false,
  },
  {
    id: 'look_skater', kind: 'look', name: 'Skater', blurb: 'Pads optional. Awareness optional.',
    price: 60, body: 'man', skin: 0xd8a878, shirt: 0x3ecf8e, pants: 0x4a4038, hair: 0x3a2a1a, shoes: 0xffffff, cap: true,
  },
  // —— seasonal looks ——
  {
    id: 'look_pumpkin', kind: 'look', name: 'Pumpkin Patch', blurb: 'Seasonal orange menace.',
    price: 75, body: 'man', skin: 0xf0c4a0, shirt: 0xe87a20, pants: 0x3a2a18, hair: 0x2a1a10, shoes: 0x1a1a1a, cap: true,
  },
  {
    id: 'look_sweater', kind: 'look', name: 'Ugly Sweater', blurb: 'Festive. Aggressive.',
    price: 80, body: 'man', skin: 0xe8b890, shirt: 0xc42a2a, pants: 0x1a3a28, hair: 0x3a2a1a, shoes: 0xffffff, cap: false,
  },
  // —— bonk props ——
  { id: 'bonk_bat', kind: 'bonk', name: 'Metal Bat', blurb: 'Classic aisle justice.', price: 0 },
  { id: 'bonk_baguette', kind: 'bonk', name: 'Baguette', blurb: 'Artisanal blunt force.', price: 45 },
  { id: 'bonk_umbrella', kind: 'bonk', name: 'Umbrella', blurb: 'Pop goes the crowd.', price: 55 },
  { id: 'bonk_foam', kind: 'bonk', name: 'Foam Finger', blurb: '#1 at making space.', price: 40 },
  { id: 'bonk_paper', kind: 'bonk', name: 'Newspaper', blurb: 'Extra! Extra! Outta my way!', price: 35 },
  { id: 'bonk_noodle', kind: 'bonk', name: 'Pool Noodle', blurb: 'Soft. Humiliating.', price: 50 },
  { id: 'bonk_pan', kind: 'bonk', name: 'Frying Pan', blurb: 'Seasoned with chaos.', price: 70 },
  { id: 'bonk_candy', kind: 'bonk', name: 'Candy Cane', blurb: 'Seasonal. Sticky justice.', price: 60 },
  { id: 'bonk_corn', kind: 'bonk', name: 'Candy Corn Bat', blurb: 'Tri-color trauma.', price: 55 },
  // —— horns ——
  { id: 'horn_classic', kind: 'horn', name: 'Clown Horn', blurb: 'The original beep-boop.', price: 0 },
  { id: 'horn_bike', kind: 'horn', name: 'Bike Bell', blurb: 'Polite. Ignored.', price: 30 },
  { id: 'horn_air', kind: 'horn', name: 'Air Horn', blurb: 'Stadium energy, aisle scale.', price: 65 },
  { id: 'horn_goose', kind: 'horn', name: 'Goose Honk', blurb: 'Nature\'s car alarm.', price: 55 },
  { id: 'horn_excuse', kind: 'horn', name: 'EXCUSE ME!', blurb: 'The nuclear option.', price: 75 },
  { id: 'horn_train', kind: 'horn', name: 'Train Horn', blurb: 'Platform energy. Zero chill.', price: 85 },
  { id: 'horn_jingle', kind: 'horn', name: 'Jingle Bell', blurb: 'Seasonal. Relentless.', price: 70 },
  { id: 'horn_witch', kind: 'horn', name: 'Witch Cackle', blurb: 'Heeheehee — MOVE.', price: 70 },
];

export interface EquipState {
  look: string;
  bonk: string;
  horn: string;
}

let owned = new Set<string>();
let equip: EquipState = { look: 'look_runner', bonk: 'bonk_bat', horn: 'horn_classic' };
let applyFn: (() => void) | null = null;

function defaultsOwned(): Set<string> {
  return new Set(COSMETICS.filter((c) => c.price === 0).map((c) => c.id));
}

function load() {
  owned = defaultsOwned();
  if (!QUIET) {
    try {
      const raw = localStorage.getItem(LS_OWN);
      if (raw) JSON.parse(raw).forEach((id: string) => owned.add(id));
    } catch { /* ignore */ }
    try {
      const eq = JSON.parse(localStorage.getItem(LS_EQ) || 'null');
      if (eq && typeof eq === 'object') {
        if (owned.has(eq.look)) equip.look = eq.look;
        if (owned.has(eq.bonk)) equip.bonk = eq.bonk;
        if (owned.has(eq.horn)) equip.horn = eq.horn;
      }
    } catch { /* ignore */ }
  }
}

function save() {
  if (QUIET) return;
  try {
    localStorage.setItem(LS_OWN, JSON.stringify([...owned]));
    localStorage.setItem(LS_EQ, JSON.stringify(equip));
    localStorage.setItem('sz_vault', String(G.vault));
  } catch { /* ignore */ }
}

export function initCosmetics(onApply: () => void) {
  applyFn = onApply;
  load();
}

export function getOwned(): Set<string> {
  return owned;
}
export function getEquip(): EquipState {
  return equip;
}
export function itemById(id: string): CosmoItem | undefined {
  return COSMETICS.find((c) => c.id === id);
}
export function equippedLook(): CosmoItem {
  return itemById(equip.look) || COSMETICS[0];
}
export function equippedBonk(): string {
  return equip.bonk;
}
export function equippedHorn(): string {
  return equip.horn;
}

export function buyCosmetic(id: string): { ok: boolean; reason?: string } {
  const item = itemById(id);
  if (!item) return { ok: false, reason: 'missing' };
  if (owned.has(id)) return { ok: false, reason: 'owned' };
  if (G.vault < item.price) return { ok: false, reason: 'broke' };
  G.vault -= item.price;
  owned.add(id);
  save();
  syncVaultDom();
  return { ok: true };
}

export function equipCosmetic(id: string): boolean {
  const item = itemById(id);
  if (!item || !owned.has(id)) return false;
  if (item.kind === 'look') equip.look = id;
  else if (item.kind === 'bonk') equip.bonk = id;
  else equip.horn = id;
  save();
  applyFn?.();
  return true;
}

export function syncVaultDom() {
  const v = document.getElementById('vault');
  if (v) v.textContent = String(G.vault);
  const s = document.getElementById('shopVault');
  if (s) s.textContent = String(G.vault) + '¢';
}

/** Grant one unowned paid cosmetic (meta RNG — not game rand). */
export function grantRandomCosmetic(): string | null {
  const pool = COSMETICS.filter((c) => c.price > 0 && !owned.has(c.id));
  if (!pool.length) return null;
  const item = pool[(Math.random() * pool.length) | 0];
  owned.add(item.id);
  save();
  syncVaultDom();
  return item.name;
}

// ---------- bonk prop builders (visual only) ----------
function clearGroup(g: THREE.Group) {
  while (g.children.length) g.remove(g.children[0]);
}

export function buildBonkModel(id: string): THREE.Group {
  const g = new THREE.Group();
  const add = (mesh: THREE.Mesh) => { mesh.castShadow = true; g.add(mesh); };
  if (id === 'bonk_baguette') {
    const loaf = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.15, 8), mat(0xe8c888));
    loaf.position.y = 0.6; add(loaf);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.065, 8, 6), mat(0xd4a868));
    tip.position.y = 1.18; add(tip);
    const crust = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.04, 8), mat(0xb88848));
    crust.position.y = 0.4; add(crust);
  } else if (id === 'bonk_umbrella') {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 1.05, 6), mat(0x2a2a2a));
    pole.position.y = 0.55; add(pole);
    const canopy = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 10, 1, true), mat(0x3a6fc0));
    canopy.position.y = 1.05; add(canopy);
    const tip = new THREE.Mesh(new THREE.SphereGeometry(0.03, 6, 5), mat(0xd8d8d8));
    tip.position.y = 1.18; add(tip);
  } else if (id === 'bonk_foam') {
    const finger = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.85, 0.14), mat(0xff3b3b));
    finger.position.y = 0.55; add(finger);
    const tip = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.28, 0.14), mat(0xff3b3b));
    tip.position.set(0.08, 1.05, 0); add(tip);
    const one = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.02), mat(0xffffff));
    one.position.set(0, 0.55, 0.08); add(one);
  } else if (id === 'bonk_paper') {
    const sheet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.02), mat(0xf4f0e6));
    sheet.position.y = 0.55; add(sheet);
    const fold = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.02, 0.04), mat(0xd8d2c4));
    fold.position.y = 0.55; add(fold);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.021), mat(0x1a1a1a));
    mast.position.set(0, 0.74, 0.01); add(mast);
  } else if (id === 'bonk_noodle') {
    const noodle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.2, 10), mat(0xff6ec7));
    noodle.position.y = 0.65; add(noodle);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.08, 10), mat(0xffffff));
    stripe.position.y = 0.65; add(stripe);
  } else if (id === 'bonk_pan') {
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.55, 8), mat(0x2a2a2a));
    handle.position.set(0, 0.35, 0); add(handle);
    const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.26, 0.08, 12), mat(0x4a4a52));
    pan.position.y = 0.72; add(pan);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.27, 0.03, 6, 14), mat(0x6a6a72));
    rim.rotation.x = Math.PI / 2; rim.position.y = 0.76; add(rim);
  } else if (id === 'bonk_candy') {
    const cane = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 1.05, 10), mat(0xfff0f0));
    cane.position.y = 0.55; add(cane);
    const stripeA = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.12, 10), mat(0xe02020));
    stripeA.position.y = 0.35; add(stripeA);
    const stripeB = new THREE.Mesh(new THREE.CylinderGeometry(0.058, 0.058, 0.12, 10), mat(0xe02020));
    stripeB.position.y = 0.7; add(stripeB);
    const hook = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.05, 6, 12, Math.PI), mat(0xfff0f0));
    hook.position.set(0.12, 1.1, 0); hook.rotation.z = Math.PI / 2; add(hook);
  } else if (id === 'bonk_corn') {
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.35, 8), mat(0xfff0a0));
    tip.position.y = 1.05; add(tip);
    const mid = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.4, 8), mat(0xff8a2a));
    mid.position.y = 0.7; add(mid);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 0.35, 8), mat(0xffffff));
    base.position.y = 0.35; add(base);
  } else {
    // default metal bat
    const tape = mat(0x2a241c);
    const metal = mat(0xd8e2ea);
    const knob = new THREE.Mesh(new THREE.SphereGeometry(0.048, 8, 6), tape); add(knob);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.038, 0.32, 8), tape);
    handle.position.y = 0.18; add(handle);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.07, 0.36, 8), metal);
    shaft.position.y = 0.51; add(shaft);
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.074, 0.52, 8), metal);
    barrel.position.y = 0.94; add(barrel);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.074, 8, 6), metal);
    cap.position.y = 1.19; add(cap);
    const stripe = new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.082, 0.045, 8), mat(0x3d8ec9));
    stripe.position.y = 0.76; add(stripe);
  }
  return g;
}

export function swapBonkProp(batProp: THREE.Group, id: string) {
  clearGroup(batProp);
  const built = buildBonkModel(id);
  while (built.children.length) batProp.add(built.children[0]);
}
