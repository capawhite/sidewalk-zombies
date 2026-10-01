// Stage 2B: brief special encounters — arcade set pieces, not boss fights.
//
// A cooldown fires a named formation ahead of the player, announces it on the banner,
// and briefly pauses normal waves so the joke lands. Always leaves at least one open lane.
import {
  ENC_COOLDOWN_MAX, ENC_COOLDOWN_MIN, ENC_FIRST_DELAY, ENC_OPEN_LANES, ENC_WAVE_PAUSE, SPAWN_Z,
} from '../config';
import { showEncounter } from '../hud/hud';
import { G, slotsX, stageOf } from '../state';
import { rand } from '../util';
import { spawnZombie } from './spawn';

export type EncounterId = 'influencer' | 'family' | 'tourist' | 'queue';

interface EncounterDef {
  id: EncounterId;
  kicker: string;
  title: string;
  color: string;
}

const DEFS: Record<EncounterId, EncounterDef> = {
  influencer: { id: 'influencer', kicker: '★ LIVE SHOOT ★', title: 'THE INFLUENCER', color: '#ff4d8a' },
  family: { id: 'family', kicker: '★ SIDEWALK TAX ★', title: 'FAMILY FORMATION', color: '#f0d078' },
  tourist: { id: 'tourist', kicker: '★ SAY CHEESE ★', title: 'GROUP PHOTO', color: '#b07aff' },
  queue: { id: 'queue', kicker: '★ PLEASE WAIT ★', title: 'QUEUE SPILL', color: '#4a9fd8' },
};

export function resetEncounters() {
  G.encCd = ENC_FIRST_DELAY;
}

/** Pick which lanes stay empty so the player always has a path. */
function openLaneSet(): Set<number> {
  const open = new Set<number>();
  const idx = [0, 1, 2, 3, 4];
  for (let i = idx.length - 1; i > 0; i--) {
    const j = (rand() * (i + 1)) | 0;
    [idx[i], idx[j]] = [idx[j], idx[i]];
  }
  for (let i = 0; i < ENC_OPEN_LANES; i++) open.add(idx[i]);
  return open;
}

function occupiedLanes(open: Set<number>): number[] {
  return [0, 1, 2, 3, 4].filter((i) => !open.has(i));
}

function announce(id: EncounterId) {
  const d = DEFS[id];
  showEncounter(d.kicker, d.title, d.color);
}

/** Influencer + crew: ring-light star, assistant, photographer, filmer. One lane clear. */
function spawnInfluencerShoot() {
  const open = openLaneSet();
  const lanes = occupiedLanes(open);
  const z0 = SPAWN_Z - 1;
  // Star dead-center of the blocked lanes (or nearest occupied).
  const mid = lanes[(lanes.length / 2) | 0];
  spawnZombie(slotsX[mid], 'inf', z0);
  const roles = ['talk', 'photo', 'selfie', 'text'] as const;
  let r = 0;
  for (const i of lanes) {
    if (i === mid) continue;
    spawnZombie(slotsX[i], roles[r % roles.length], z0 + (r % 2) * 1.1);
    r++;
  }
}

/** Family wall: a near-full row of linked couples / walkers. One lane clear. */
function spawnFamilyWall() {
  const open = openLaneSet();
  const lanes = occupiedLanes(open);
  const z0 = SPAWN_Z;
  for (let i = 0; i < lanes.length; i++) {
    const lane = lanes[i];
    const type = i % 2 === 0 ? 'couple' : (i % 3 === 1 ? 'talk' : 'text');
    if (type === 'couple') {
      // Partners sit in the same lane slot (tight family huddle).
      const a = spawnZombie(slotsX[lane] - 0.35, 'couple', z0);
      const b = spawnZombie(slotsX[lane] + 0.35, 'couple', z0);
      a.userData.link = b;
      b.userData.link = a;
    } else {
      spawnZombie(slotsX[lane], type, z0);
    }
  }
}

/** Tourist group photo: clump of photographers / filmers staggered a little in depth. */
function spawnTouristPhoto() {
  const open = openLaneSet();
  const lanes = occupiedLanes(open).slice(0, 3);
  // Prefer a contiguous clump if possible.
  const start = lanes.length ? Math.min(...lanes) : 1;
  const clump = [start, start + 1, start + 2].filter((i) => i >= 0 && i <= 4 && !open.has(i));
  const use = clump.length >= 2 ? clump : lanes;
  const z0 = SPAWN_Z - 0.5;
  use.forEach((lane, i) => {
    const type = i === 0 ? 'selfie' : i === 1 ? 'photo' : (rand() < 0.5 ? 'photo' : 'talk');
    spawnZombie(slotsX[lane], type, z0 - i * 0.85);
  });
  // One navigator circling the shoot for comedy.
  const side = [0, 1, 2, 3, 4].find((i) => !use.includes(i) && !open.has(i));
  if (side !== undefined) spawnZombie(slotsX[side], 'nav', z0 - 2.2);
}

/** Queue spilling into the path: a staggered snake of texters/navs from one curb. */
function spawnQueueSpill() {
  const fromLeft = rand() < 0.5;
  const openLane = fromLeft ? 4 : 0; // leave the far curb open
  const z0 = SPAWN_Z + 1;
  const snake = fromLeft ? [0, 1, 2, 3] : [4, 3, 2, 1];
  snake.forEach((lane, i) => {
    if (lane === openLane) return;
    const type = i % 3 === 0 ? 'nav' : 'text';
    spawnZombie(slotsX[lane], type, z0 - i * 1.35);
  });
}

function pickEncounter(): EncounterId {
  const crowd = stageOf().crowd;
  const r = rand();
  if (crowd === 'inf' || crowd === 'beach') {
    if (r < 0.55) return 'influencer';
    if (r < 0.8) return 'tourist';
    return 'family';
  }
  if (crowd === 'mall') {
    if (r < 0.35) return 'queue';
    if (r < 0.6) return 'tourist';
    if (r < 0.82) return 'family';
    return 'influencer';
  }
  if (crowd === 'garage') {
    if (r < 0.4) return 'queue';
    if (r < 0.7) return 'family';
    return 'tourist';
  }
  if (crowd === 'station') {
    if (r < 0.45) return 'queue';
    if (r < 0.75) return 'family';
    return 'tourist';
  }
  if (crowd === 'airport') {
    if (r < 0.35) return 'queue';
    if (r < 0.55) return 'tourist';
    if (r < 0.8) return 'family';
    return 'influencer';
  }
  // aisle
  if (r < 0.3) return 'family';
  if (r < 0.55) return 'queue';
  if (r < 0.8) return 'tourist';
  return 'influencer';
}

function fireEncounter(id: EncounterId) {
  announce(id);
  if (id === 'influencer') spawnInfluencerShoot();
  else if (id === 'family') spawnFamilyWall();
  else if (id === 'tourist') spawnTouristPhoto();
  else spawnQueueSpill();
  // Let the formation breathe before the next normal wave.
  G.spawnTimer = Math.max(G.spawnTimer, ENC_WAVE_PAUSE);
}

export function updateEncounters(dt: number) {
  if (G.gunT > 0) return; // gun chaos already fills the lane; don't stack set pieces
  if (G.evtT > 0) return;  // Stage 3 event owns the joke right now
  G.encCd -= dt;
  if (G.encCd > 0) return;
  fireEncounter(pickEncounter());
  G.encCd = ENC_COOLDOWN_MIN + rand() * (ENC_COOLDOWN_MAX - ENC_COOLDOWN_MIN);
  // Give the event scheduler breathing room after a set piece.
  G.evtCd = Math.max(G.evtCd, 8);
}
