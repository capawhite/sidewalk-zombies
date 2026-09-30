// Spawning of crowds, pickups and coins.
import * as THREE from 'three';
import { CLAMP_X, COIN_GAP, CROWD_RAMP_DIST, GUN_PACK_FILL, GUN_PACK_GAP, GUN_PACK_LANES, GUN_PACK_MORE, GUN_PACK_ROWS, GUN_PACK_ROW_Z, GUN_PACK_SQUEEZE, GUN_PACK_Z_JITTER, SPAWN_FILL_END, SPAWN_FILL_START, SPAWN_GAP, SPAWN_Z, TYPES } from '../config';
import { applyPose, setShirtColor } from '../entities/person';
import { PICK_COL, getCoin, getPickup, getZombie } from '../entities/pools';
import { G, slotsX, stageOf } from '../state';
import { clamp, rand } from '../util';

export function spawnCoin() {
  const r = rand();
  const lane = (rand() * slotsX.length) | 0;
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
    const ph = rand() * 3;
    for (let i = 0; i < 7; i++) put(Math.sin(i * 0.9 + ph) * 3.1, i * 1.1);
  } else {
    put(slotsX[lane], 0);
  }
}
// ---------- spawning ----------
function crowd(): number {
  return Math.min(G.dist / CROWD_RAMP_DIST, 1);
}
export function spawnWave() {
  const packing = G.gunT > 0;
  const c = crowd();
  let fill = packing
    ? GUN_PACK_FILL
    : SPAWN_FILL_START + Math.floor(c * (SPAWN_FILL_END - SPAWN_FILL_START + 0.001));
  if (packing && rand() < (GUN_PACK_MORE - 1)) fill += 1;
  if (!packing && rand() < c * 0.28) fill = Math.min(fill + 1, SPAWN_FILL_END);
  fill = Math.min(fill, 5);
  let chosen: number[];
  if (packing) {
    chosen = GUN_PACK_LANES.slice(0, fill);
  } else {
    const idx = [0, 1, 2, 3, 4];
    for (let i = idx.length - 1; i > 0; i--) { const j = (rand() * (i + 1)) | 0;[idx[i], idx[j]] = [idx[j], idx[i]]; }
    chosen = idx.slice(0, fill);
  }
  const rows = packing ? GUN_PACK_ROWS : 1;
  const jitter = packing ? GUN_PACK_Z_JITTER : 3;
  for (let row = 0; row < rows; row++) {
    for (const s of chosen) {
      const r = rand();
      const crowdKind = stageOf().crowd;
      const type = packing
        ? (crowdKind === 'inf' || crowdKind === 'beach' ? 'inf' : 'text')
        : crowdKind === 'inf' || crowdKind === 'beach'
          ? (rand() < 0.86 ? 'inf' : 'text')
          : crowdKind === 'mall'
            ? (r < 0.38 ? 'talk' : r < 0.74 ? 'text' : 'selfie')
            : (r < 0.42 ? 'talk' : r < 0.75 ? 'text' : 'selfie');
      const x = packing ? slotsX[s] * GUN_PACK_SQUEEZE : slotsX[s];
      spawnZombie(x, type, SPAWN_Z + row * GUN_PACK_ROW_Z + rand() * jitter);
    }
  }
}
function spawnZombie(x: number, type: string, zPos?: number) {
  const z = getZombie(type); const def = TYPES[type] || TYPES.inf;
  z.active = true; z.visible = true; z.userData.type = type; z.userData.def = def;
  z.userData.hit = false; z.userData.passed = false; z.userData.knocked = false; z.userData.tripT = 0;
  z.userData.driftPhase = rand() * 6.28; z.userData.baseX = x;
  z.userData.knockVx = 0; z.userData.knockVy = 0; z.userData.fx = '';
  z.position.set(x, 0, zPos ?? (SPAWN_Z + rand() * 3));
  z.rotation.set(0, 0, 0);
  if (type !== 'inf') setShirtColor(z, def.color);
  applyPose(z, type);
}
export function spawnPickup() {
  const p = getPickup();
  const r = rand();
  const kind = r < 0.26 ? 'cart' : r < 0.5 ? 'horn' : r < 0.76 ? 'gun' : 'bomb';
  p.userData.kind = kind;
  p.userData.cartVis.visible = kind === 'cart';
  p.userData.hornVis.visible = kind === 'horn';
  p.userData.gunVis.visible = kind === 'gun';
  p.userData.bombVis.visible = kind === 'bomb';
  p.userData.ring.material.color.setHex(PICK_COL[kind]);
  p.userData.beam.material.color.setHex(PICK_COL[kind]);
  p.active = true; p.visible = true;
  const x = slotsX[(rand() * slotsX.length) | 0];
  p.position.set(x, 0, SPAWN_Z + 2);
}
export function updateSpawns(dt: number) {
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    spawnWave();
    G.spawnTimer = G.gunT > 0
      ? GUN_PACK_GAP + rand() * 0.08
      : SPAWN_GAP + rand() * 0.2;
  }
  G.pickTimer -= dt;
  if (G.pickTimer <= 0) {
    spawnPickup();
    G.pickTimer = 6.5 + rand() * 2;
  }
  G.coinTimer -= dt;
  if (G.coinTimer <= 0) {
    spawnCoin();
    G.coinTimer = COIN_GAP + rand() * 1.1;
  }
}
