// Spawning of crowds, pickups and coins.
import { CLAMP_X, COIN_GAP, COUPLE_GAP, CROWD_RAMP_DIST, CROWD_RAMP_DIST_2, DOG_HIT_HALF_W, DOG_LEASH,
  FACE_AWAY_CHANCE, GUN_PACK_FILL, GUN_PACK_GAP, GUN_PACK_LANES, GUN_PACK_MORE, GUN_PACK_ROWS,
  GUN_PACK_ROW_Z, GUN_PACK_SQUEEZE, GUN_PACK_Z_JITTER, HIT_HALF_W, NAV_TURN_MAX, NAV_TURN_MIN,
  SCOOTER_HIT_HALF_W, SPAWN_FILL_END, SPAWN_FILL_START, SPAWN_GAP, SPAWN_Z, TOUR_GAP,
  TOUR_HIT_HALF_W, TYPES,
} from '../config';
import { isEmptyHands } from './emptyHands';
import { applyPose, setShirtColor } from '../entities/person';
import { PICK_COL, getCoin, getPickup, getZombie } from '../entities/pools';
import { G, slotsX, stageOf } from '../state';
import { clamp, rand } from '../util';
import { eventFillBonus, eventPickType, eventSpawnGapScale } from './events';
import { softCrowdActive } from './economy';

export function spawnCoin() {
  const r = rand();
  const lane = (rand() * slotsX.length) | 0;
  const put = (x: number, dz: number) => {
    const c = getCoin();
    c.active = true; c.visible = true;
    c.position.set(clamp(x, -CLAMP_X + 0.3, CLAMP_X - 0.3), 0, SPAWN_Z - dz);
  };
  if (r < 0.22) {
    for (let i = 0; i < 5; i++) put(slotsX[lane], i * 1.2);
  } else if (r < 0.42) {
    const l2 = lane >= slotsX.length - 1 ? lane - 1 : lane + 1;
    for (let i = 0; i < 6; i++) put(slotsX[i % 2 ? l2 : lane], i * 1.15);
  } else if (r < 0.6) {
    const ph = rand() * 3;
    for (let i = 0; i < 7; i++) put(Math.sin(i * 0.9 + ph) * 3.1, i * 1.1);
  } else if (r < 0.78) {
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      put(Math.cos(a) * 1.55, 1.1 + Math.sin(a) * 1.55);
    }
  } else if (r < 0.93) {
    const x = slotsX[lane];
    for (let i = 0; i < 5; i++) {
      put(x - i * 0.28, i * 0.9);
      put(x + i * 0.28, i * 0.9);
    }
  } else {
    put(slotsX[lane], 0);
  }
}

function crowd(): number {
  const a = Math.min(G.dist / CROWD_RAMP_DIST, 1);
  const b = Math.min(Math.max(0, G.dist - CROWD_RAMP_DIST) / (CROWD_RAMP_DIST_2 - CROWD_RAMP_DIST), 1);
  // Second ramp squeezes toward fuller waves without jumping instantly.
  return Math.min(1, a * 0.85 + b * 0.2);
}

/** Pick a zombie type for this stage. Special archetypes stay uncommon so reads stay clear. */
function pickType(crowdKind: string, packing: boolean): string {
  if (packing) return crowdKind === 'inf' || crowdKind === 'beach' ? 'inf' : 'text';
  const biased = eventPickType();
  if (biased) return biased;
  const r = rand();
  if (crowdKind === 'inf' || crowdKind === 'beach') {
    if (r < 0.72) return 'inf';
    if (r < 0.82) return 'text';
    if (r < 0.9) return 'photo';
    if (r < 0.96) return 'dog';
    return 'scooter';
  }
  if (crowdKind === 'mall') {
    // Food-court GPS crowd: navigators, couples, the occasional tour blob
    if (r < 0.26) return 'talk';
    if (r < 0.46) return 'text';
    if (r < 0.6) return 'selfie';
    if (r < 0.74) return 'nav';
    if (r < 0.84) return 'couple';
    if (r < 0.9) return 'tour';
    if (r < 0.96) return 'photo';
    return 'scooter';
  }
  if (crowdKind === 'garage') {
    if (r < 0.16) return 'talk';
    if (r < 0.42) return 'text';
    if (r < 0.56) return 'selfie';
    if (r < 0.68) return 'nav';
    if (r < 0.78) return 'scooter';
    if (r < 0.86) return 'delivery';
    if (r < 0.93) return 'photo';
    return 'couple';
  }
  if (crowdKind === 'station') {
    // Platform zombies: navigators + queues + tour blobs missing their train.
    if (r < 0.18) return 'talk';
    if (r < 0.36) return 'text';
    if (r < 0.5) return 'nav';
    if (r < 0.62) return 'couple';
    if (r < 0.72) return 'tour';
    if (r < 0.82) return 'selfie';
    if (r < 0.9) return 'photo';
    if (r < 0.96) return 'delivery';
    return 'scooter';
  }
  if (crowdKind === 'airport') {
    // Terminal chaos: scooters, deliveries, navs, luggage-minded texters.
    if (r < 0.14) return 'talk';
    if (r < 0.32) return 'text';
    if (r < 0.46) return 'nav';
    if (r < 0.58) return 'scooter';
    if (r < 0.7) return 'delivery';
    if (r < 0.8) return 'selfie';
    if (r < 0.88) return 'couple';
    if (r < 0.94) return 'tour';
    return 'photo';
  }
  // aisle (default)
  if (r < 0.3) return 'talk';
  if (r < 0.5) return 'text';
  if (r < 0.64) return 'selfie';
  if (r < 0.74) return 'nav';
  if (r < 0.82) return 'photo';
  if (r < 0.88) return 'couple';
  if (r < 0.93) return 'dog';
  if (r < 0.97) return 'delivery';
  return 'scooter';
}

function spawnCouple(x: number, zPos: number) {
  // Partners share facing so the pair reads as walking together.
  const faceAway = rand() < FACE_AWAY_CHANCE;
  const a = spawnZombie(clamp(x - COUPLE_GAP, -CLAMP_X, CLAMP_X), 'couple', zPos, faceAway);
  const b = spawnZombie(clamp(x + COUPLE_GAP, -CLAMP_X, CLAMP_X), 'couple', zPos, faceAway);
  a.userData.link = b;
  b.userData.link = a;
}

/** Tour group blob: three linked walkers sharing facing — a slow moving wall. */
function spawnTourGroup(x: number, zPos: number) {
  const faceAway = rand() < FACE_AWAY_CHANCE;
  const offsets = [-TOUR_GAP, 0, TOUR_GAP];
  const members = offsets.map((ox) =>
    spawnZombie(clamp(x + ox, -CLAMP_X, CLAMP_X), 'tour', zPos + (rand() - 0.5) * 0.35, faceAway),
  );
  for (let i = 0; i < members.length; i++) {
    members[i].userData.link = members[(i + 1) % members.length];
    members[i].userData.hitHalfW = TOUR_HIT_HALF_W;
  }
}

/** Dog walker + pup on a short leash — pup is a smaller linked person. */
function spawnDogWalker(x: number, zPos: number) {
  const faceAway = rand() < FACE_AWAY_CHANCE;
  const side = rand() < 0.5 ? -1 : 1;
  const walker = spawnZombie(clamp(x, -CLAMP_X, CLAMP_X), 'dog', zPos, faceAway);
  const pup = spawnZombie(clamp(x + side * DOG_LEASH * 0.85, -CLAMP_X, CLAMP_X), 'dog', zPos, faceAway);
  pup.scale.setScalar(0.62);
  pup.userData.isPup = true;
  pup.userData.hitHalfW = 0.85;
  walker.userData.hitHalfW = DOG_HIT_HALF_W;
  walker.userData.link = pup;
  pup.userData.link = walker;
  walker.userData.leashLen = DOG_LEASH;
  pup.userData.leashLen = DOG_LEASH;
}

/** Shared spawn helper used by waves and special encounters. */
export function spawnZombie(x: number, type: string, zPos?: number, faceAway?: boolean) {
  const z = getZombie(type); const def = TYPES[type] || TYPES.inf;
  z.active = true; z.visible = true; z.userData.type = type; z.userData.def = def;
  z.userData.hit = false; z.userData.passed = false; z.userData.knocked = false; z.userData.tripT = 0;
  z.userData.driftPhase = rand() * 6.28; z.userData.baseX = x;
  z.userData.knockVx = 0; z.userData.knockVy = 0; z.userData.fx = '';
  z.userData.link = null;
  z.userData.navT = NAV_TURN_MIN + rand() * (NAV_TURN_MAX - NAV_TURN_MIN);
  z.userData.navSpin = 0;
  z.userData.hitHalfW = type === 'scooter' || type === 'delivery'
    ? SCOOTER_HIT_HALF_W
    : type === 'tour' ? TOUR_HIT_HALF_W
    : type === 'dog' ? DOG_HIT_HALF_W
    : HIT_HALF_W;
  z.userData.slowT = 0;
  z.userData.isPup = false;
  z.userData.leashLen = 0;
  z.scale.setScalar(1);
  // Photos always walk with the player; talk/text/selfie/inf/couple/tour/dog pick a roll.
  // Scooters, deliveries and navs stay oncoming — they're charged threats.
  // Deliveries face reverse (with the player) so they weave into you from ahead.
  const canFaceAway = type === 'photo' || type === 'talk' || type === 'text'
    || type === 'selfie' || type === 'inf' || type === 'couple' || type === 'tour'
    || type === 'dog';
  z.userData.faceAway = type === 'photo' || type === 'delivery'
    || (canFaceAway && (faceAway ?? (rand() < FACE_AWAY_CHANCE)));
  z.position.set(x, 0, zPos ?? (SPAWN_Z + rand() * 3));
  z.rotation.set(0, z.userData.faceAway ? Math.PI : 0, 0);
  if (type !== 'inf') setShirtColor(z, def.color);
  applyPose(z, type);
  return z;
}

export function spawnPickup() {
  if (isEmptyHands()) return;
  const p = getPickup();
  const kind = pickPickupKind();
  p.userData.kind = kind;
  p.userData.cartVis.visible = kind === 'cart';
  p.userData.hornVis.visible = kind === 'horn';
  p.userData.gunVis.visible = kind === 'gun';
  p.userData.bombVis.visible = kind === 'bomb';
  if (p.userData.whistleVis) p.userData.whistleVis.visible = kind === 'whistle';
  if (p.userData.sprayVis) p.userData.sprayVis.visible = kind === 'spray';
  if (p.userData.umbrellaVis) p.userData.umbrellaVis.visible = kind === 'umbrella';
  p.userData.ring.material.color.setHex(PICK_COL[kind]);
  p.userData.beam.material.color.setHex(PICK_COL[kind]);
  p.active = true; p.visible = true;
  const x = slotsX[(rand() * slotsX.length) | 0];
  p.position.set(x, 0, SPAWN_Z + 2);
}

/** World pickups stay inside the current stage kit. Bombs are rare even when listed. */
function pickPickupKind(): string {
  const kit: string[] = (stageOf().kit || ['cart', 'horn']).slice();
  // Early chapters: strip bombs from the roll even if a kit somehow includes them.
  const allowBomb = G.level >= 5;
  const pool = kit.filter((k) => k !== 'bomb' || allowBomb);
  const options = pool.length ? pool : ['cart', 'horn'];
  // Weighted draw — gun a bit more common; bomb scarce; whistle mid.
  const weights = options.map((k) => (
    k === 'bomb' ? 0.12
      : k === 'gun' ? 0.38
      : k === 'whistle' ? 0.22
      : k === 'spray' ? 0.26
      : k === 'umbrella' ? 0.24
      : 0.28
  ));
  let t = 0;
  for (const w of weights) t += w;
  let r = rand() * t;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[options.length - 1];
}

export function spawnWave() {
  const packing = G.gunT > 0;
  const c = crowd();
  let fill = packing
    ? GUN_PACK_FILL
    : SPAWN_FILL_START + Math.floor(c * (SPAWN_FILL_END - SPAWN_FILL_START + 0.001));
  if (packing && rand() < (GUN_PACK_MORE - 1)) fill += 1;
  if (!packing && rand() < c * 0.28) fill = Math.min(fill + 1, SPAWN_FILL_END);
  fill = Math.min(fill + eventFillBonus(), packing ? 5 : 4); // leave ≥1 open lane outside gun packs
  // Soft Crowd boost: peel one person off early waves.
  if (!packing && softCrowdActive() && fill > 1) fill -= 1;
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
  const crowdKind = stageOf().crowd;
  for (let row = 0; row < rows; row++) {
    for (const s of chosen) {
      const type = pickType(crowdKind, packing);
      const x = packing ? slotsX[s] * GUN_PACK_SQUEEZE : slotsX[s];
      const zPos = SPAWN_Z + row * GUN_PACK_ROW_Z + rand() * jitter;
      if (type === 'couple' && !packing) spawnCouple(x, zPos);
      else if (type === 'tour' && !packing) spawnTourGroup(x, zPos);
      else if (type === 'dog' && !packing) spawnDogWalker(x, zPos);
      else spawnZombie(x, type, zPos);
    }
  }
}

export function updateSpawns(dt: number) {
  G.spawnTimer -= dt;
  if (G.spawnTimer <= 0) {
    spawnWave();
    G.spawnTimer = G.gunT > 0
      ? GUN_PACK_GAP + rand() * 0.08
      : (SPAWN_GAP + rand() * 0.2) * eventSpawnGapScale();
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
