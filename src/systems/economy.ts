// Vault consumables (one-run boosts) and "Your Block" decoration sink.
import { G } from '../state';
import { syncVaultDom } from './cosmetics';

const LS_BLOCK = 'sz_block';
const QUIET = typeof location !== 'undefined' && new URLSearchParams(location.search).has('replay');

export type BoostId = 'life' | 'bat' | 'soft';

export interface BoostDef {
  id: BoostId;
  name: string;
  blurb: string;
  price: number;
}

export const BOOSTS: BoostDef[] = [
  { id: 'life', name: '+1 Life', blurb: 'Start with an extra heart.', price: 25 },
  { id: 'bat', name: 'Start Bat', blurb: 'Queue a bat before the first shove.', price: 20 },
  { id: 'soft', name: 'Soft Crowd', blurb: 'Quieter sidewalk for the first stretch.', price: 30 },
];

export interface BlockItem {
  id: string;
  name: string;
  blurb: string;
  price: number;
  /** CSS class on the plaza prop. */
  cls: string;
}

export const BLOCK_ITEMS: BlockItem[] = [
  { id: 'blk_bench', name: 'Park Bench', blurb: 'For people who sit and scroll.', price: 25, cls: 'prop-bench' },
  { id: 'blk_planter', name: 'Planter', blurb: 'Greenery vs. gray concrete.', price: 30, cls: 'prop-planter' },
  { id: 'blk_lamp', name: 'Street Lamp', blurb: 'Mood lighting for near-misses.', price: 40, cls: 'prop-lamp' },
  { id: 'blk_hydrant', name: 'Fire Hydrant', blurb: 'Dogs approve. Texters don\'t notice.', price: 35, cls: 'prop-hydrant' },
  { id: 'blk_bike', name: 'Bike Rack', blurb: 'Locked. Owner vanished into a queue.', price: 45, cls: 'prop-bike' },
  { id: 'blk_news', name: 'News Box', blurb: 'Yesterday\'s headlines. Today\'s trip hazard.', price: 50, cls: 'prop-news' },
  { id: 'blk_neon', name: 'Neon Sign', blurb: 'OPEN. Always open.', price: 55, cls: 'prop-neon' },
  { id: 'blk_graffiti', name: 'Graffiti Tag', blurb: 'BONK. Spray-painted truth.', price: 65, cls: 'prop-graffiti' },
  { id: 'blk_cart', name: 'Food Cart', blurb: 'Smell of opportunity.', price: 70, cls: 'prop-cart' },
  { id: 'blk_mural', name: 'Sidewalk Mural', blurb: 'Art the zombies walk past.', price: 90, cls: 'prop-mural' },
  { id: 'blk_pumpkin', name: 'Sidewalk Pumpkin', blurb: 'Seasonal. Judgmental.', price: 40, cls: 'prop-pumpkin' },
  { id: 'blk_wreath', name: 'Door Wreath', blurb: 'Festive. Still no eye contact.', price: 45, cls: 'prop-wreath' },
];

let ownedBlock = new Set<string>();
/** Boosts armed for the next run (paid on Play). */
let selected = new Set<BoostId>();
/** Soft-crowd timer remaining this run. */
export let softCrowdT = 0;

function loadBlock() {
  ownedBlock = new Set();
  if (QUIET) return;
  try {
    const raw = localStorage.getItem(LS_BLOCK);
    if (raw) JSON.parse(raw).forEach((id: string) => ownedBlock.add(id));
  } catch { /* ignore */ }
}

function saveBlock() {
  if (QUIET) return;
  try { localStorage.setItem(LS_BLOCK, JSON.stringify([...ownedBlock])); } catch { /* ignore */ }
}

export function initEconomy() {
  loadBlock();
  selected.clear();
  softCrowdT = 0;
}

export function getOwnedBlock(): Set<string> {
  return ownedBlock;
}
export function getSelectedBoosts(): Set<BoostId> {
  return selected;
}

export function boostCostTotal(): number {
  let n = 0;
  for (const b of BOOSTS) if (selected.has(b.id)) n += b.price;
  return n;
}

export function toggleBoost(id: BoostId): boolean {
  if (selected.has(id)) { selected.delete(id); return false; }
  selected.add(id);
  return true;
}

export function clearBoostSelection() {
  selected.clear();
}

export function buyBlockItem(id: string): { ok: boolean; reason?: string } {
  const item = BLOCK_ITEMS.find((b) => b.id === id);
  if (!item) return { ok: false, reason: 'missing' };
  if (ownedBlock.has(id)) return { ok: false, reason: 'owned' };
  if (G.vault < item.price) return { ok: false, reason: 'broke' };
  G.vault -= item.price;
  ownedBlock.add(id);
  saveBlock();
  syncVaultDom();
  return { ok: true };
}

/** Charge selected boosts and return which ones are active for this run. */
export function purchaseSelectedBoosts(): { ok: boolean; active: Set<BoostId>; reason?: string } {
  const cost = boostCostTotal();
  if (cost > G.vault) return { ok: false, active: new Set(), reason: 'broke' };
  G.vault -= cost;
  syncVaultDom();
  try { localStorage.setItem('sz_vault', String(G.vault)); } catch { /* ignore */ }
  const active = new Set(selected);
  selected.clear();
  return { ok: true, active };
}

export function applyBoostsToRun(active: Set<BoostId>) {
  softCrowdT = active.has('soft') ? 45 : 0;
  return {
    extraLife: active.has('life'),
    startBat: active.has('bat'),
  };
}

export function tickSoftCrowd(dt: number) {
  if (softCrowdT > 0) softCrowdT = Math.max(0, softCrowdT - dt);
}

export function softCrowdActive(): boolean {
  return softCrowdT > 0;
}
