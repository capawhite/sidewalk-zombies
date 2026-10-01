// Stage 3: temporary run events — brief, announced, data-driven.
//
// Changes how the crowd behaves for a few seconds without rewriting archetypes.
// Skips while a gun pack or Stage 2B encounter set piece is owning the beat.
import {
  EVT_BATTERY_PULL, EVT_COOLDOWN_MAX, EVT_COOLDOWN_MIN, EVT_FIRST_DELAY,
  EVT_NEWPHONE_FILL, EVT_NEWPHONE_GAP, EVT_WIFI_PULL,
} from '../config';
import { flash, showEncounter } from '../hud/hud';
import { G, slotsX, stageOf } from '../state';
import { rand } from '../util';

export type EventId = 'wifi' | 'nosignal' | 'battery' | 'influencer' | 'newphone';

interface EventDef {
  id: EventId;
  kicker: string;
  title: string;
  color: string;
  duration: number;
  endFlash: string;
  /** Relative weight by crowd kind. Missing = 0. */
  weight: Record<string, number>;
}

/** Add new events here — scheduler + spawn/zombie hooks read this table. */
export const EVENT_DEFS: Record<EventId, EventDef> = {
  wifi: {
    id: 'wifi',
    kicker: '★ FREE WIFI ★',
    title: 'EVERYONE CONVERGES',
    color: '#5ec8ff',
    duration: 7.5,
    endFlash: 'WIFI FULL',
    weight: { aisle: 1.2, inf: 1, beach: 0.8, mall: 1.4, garage: 1, station: 1.5, airport: 1.3 },
  },
  nosignal: {
    id: 'nosignal',
    kicker: '★ NO SIGNAL ★',
    title: 'THEY LOOK UP',
    color: '#9cff9c',
    duration: 6.5,
    endFlash: 'SIGNAL RESTORED',
    weight: { aisle: 1, inf: 0.7, beach: 0.9, mall: 1, garage: 1.5, station: 0.6, airport: 0.5 },
  },
  battery: {
    id: 'battery',
    kicker: '★ LOW BATTERY ★',
    title: 'SEEKING OUTLETS',
    color: '#ffb84d',
    duration: 7,
    endFlash: 'BATTERY ANXIETY OVER',
    weight: { aisle: 1.1, inf: 0.6, beach: 0.5, mall: 1.2, garage: 1.4, station: 1.3, airport: 1.6 },
  },
  influencer: {
    id: 'influencer',
    kicker: '★ TRENDING ★',
    title: 'INFLUENCER SURGE',
    color: '#ff4d8a',
    duration: 8,
    endFlash: 'TREND DIED',
    weight: { aisle: 0.4, inf: 1.6, beach: 1.5, mall: 0.7, garage: 0.5, station: 0.5, airport: 0.8 },
  },
  newphone: {
    id: 'newphone',
    kicker: '★ NEW PHONE ★',
    title: 'MIDNIGHT DROP',
    color: '#c9a0ff',
    duration: 7,
    endFlash: 'SOLD OUT',
    weight: { aisle: 1, inf: 1.1, beach: 1, mall: 1.3, garage: 0.9, station: 1, airport: 1.2 },
  },
};

export function resetEvents() {
  G.evtId = '';
  G.evtT = 0;
  G.evtCd = EVT_FIRST_DELAY;
  G.evtTargetX = 0;
}

function pickEvent(): EventId {
  const crowd = stageOf().crowd as string;
  const ids = Object.keys(EVENT_DEFS) as EventId[];
  let total = 0;
  const weights: number[] = [];
  for (const id of ids) {
    const w = EVENT_DEFS[id].weight[crowd] ?? 0;
    weights.push(w);
    total += w;
  }
  if (total <= 0) return 'wifi';
  let r = rand() * total;
  for (let i = 0; i < ids.length; i++) {
    r -= weights[i];
    if (r <= 0) return ids[i];
  }
  return ids[ids.length - 1];
}

function beginEvent(id: EventId) {
  const def = EVENT_DEFS[id];
  G.evtId = id;
  G.evtT = def.duration;
  if (id === 'wifi') {
    G.evtTargetX = slotsX[(rand() * slotsX.length) | 0];
  }
  showEncounter(def.kicker, def.title, def.color);
  // Keep Stage 2B set pieces from stacking on top of an active event.
  G.encCd = Math.max(G.encCd, def.duration + 4);
}

function endEvent() {
  const id = G.evtId as EventId;
  const def = EVENT_DEFS[id];
  if (def) flash(def.endFlash, def.color);
  G.evtId = '';
  G.evtT = 0;
}

export function updateEvents(dt: number) {
  if (G.evtT > 0) {
    G.evtT -= dt;
    if (G.evtT <= 0) endEvent();
    return;
  }
  if (G.gunT > 0) return;
  // Encounter about to fire — yield so set pieces stay readable.
  if (G.encCd < 3.5) return;
  G.evtCd -= dt;
  if (G.evtCd > 0) return;
  beginEvent(pickEvent());
  G.evtCd = EVT_COOLDOWN_MIN + rand() * (EVT_COOLDOWN_MAX - EVT_COOLDOWN_MIN);
}

/** Spawn-type override while an event is live. Returns null to use normal mix. */
export function eventPickType(): string | null {
  if (G.evtT <= 0) return null;
  const r = rand();
  if (G.evtId === 'influencer') {
    if (r < 0.55) return 'inf';
    if (r < 0.78) return 'selfie';
    if (r < 0.92) return 'photo';
    return 'talk';
  }
  if (G.evtId === 'newphone') {
    if (r < 0.22) return 'nav';
    if (r < 0.4) return 'scooter';
    if (r < 0.55) return 'selfie';
    if (r < 0.7) return 'text';
    if (r < 0.82) return 'photo';
    if (r < 0.92) return 'couple';
    return 'inf';
  }
  if (G.evtId === 'nosignal') {
    // Everyone “behaves” — mostly talkers walking like people.
    if (r < 0.7) return 'talk';
    if (r < 0.88) return 'text';
    return 'couple';
  }
  return null;
}

export function eventFillBonus(): number {
  if (G.evtT <= 0) return 0;
  if (G.evtId === 'newphone') return EVT_NEWPHONE_FILL;
  if (G.evtId === 'influencer') return 1;
  return 0;
}

export function eventSpawnGapScale(): number {
  if (G.evtT > 0 && G.evtId === 'newphone') return EVT_NEWPHONE_GAP;
  return 1;
}

/** Lateral pull rates for Free WiFi / Low Battery. */
export function eventPull(): { kind: 'wifi' | 'battery'; rate: number; targetX: number } | null {
  if (G.evtT <= 0) return null;
  if (G.evtId === 'wifi') return { kind: 'wifi', rate: EVT_WIFI_PULL, targetX: G.evtTargetX };
  if (G.evtId === 'battery') {
    // Chargers on both curbs — each zombie picks nearest (handled by caller via sign).
    return { kind: 'battery', rate: EVT_BATTERY_PULL, targetX: 0 };
  }
  return null;
}

export function eventIsNoSignal(): boolean {
  return G.evtT > 0 && G.evtId === 'nosignal';
}
