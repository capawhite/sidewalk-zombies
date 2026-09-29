// All tuning knobs, palette, powers and stage definitions. Feel constants live here.

// ---------- palette ----------
export const COL = {
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
export const SKINS = [0xf0c4a0, 0xe0b089, 0xc68642, 0x8d5524, 0xf5d0b0, 0xd4a574];
export const PANTS = [0x2c3340, 0x3e4a3a, 0x4a3b32, 0x1f2a38, 0x5a4e45];
export const HAIR = [0x1a1410, 0x3b2416, 0x5a3a22, 0x2b2b2b, 0x6e4a2e, 0xc8c2b4];
export const BIKINIS = [0xff4d8a, 0xffef6a, 0x4fd2ff, 0xffffff, 0xff6b3d, 0xe85ad0, 0x2ad4c8];
export const LONG_HAIR = [0x1a1410, 0x3b2416, 0xc8a050, 0x6e4a2e, 0x2b2b2b, 0xd4c4a0, 0x8b3a22];
// ---------- feel knobs ----------
export const STEER_MAX_SPEED = 5.5;
      // was 12 — a tap should nudge, not leap
export const STEER_ACCEL = 48;
           // was 140 — hold to get up to speed
export const STEER_DECEL = 160;
          // stop quickly when you let go
export const STEER_REVERSE = 80;
         // was 220 — A↔D is gentler
export const STEER_TAP_BUFFER = 0.02;
    // was 0.07 — don't keep sliding after a tap
export const STEER_TOUCH_SPAN = 8;
       // full-screen drag = this many world units (aisle is ~8)
export const STEER_TOUCH_FOLLOW = 36;
    // how fast we catch the finger
export const STEER_TOUCH_DEAD_PX = 10;
   // ignore tiny finger jitter
export const STEER_FLICK = 0.55;
         // leftover slide after a swipe (not a hold)
export const STEER_LEAN = 0.22;
export const STEER_YAW = 0.14;
export const STEER_LEAN_SMOOTH = 18;
export const CAM_FOV = 48;
export const CAM_MIN_HFOV = 42;
export const CAM_HEIGHT = 4.6;
export const CAM_BACK_Z = 10.4;
export const CAM_LOOK_Z = 0.5;
export const CAM_LOOK_Y = 1.25;
export const CAM_FOLLOW_X = 0.18;
export const CAM_LOOK_X = 0.75;
export const CAM_FOLLOW_RATE = 6;
export const FOG_NEAR = 28;
export const FOG_FAR = 72;
export const SPEED = 6.5;
                // walk stays put — crowd is the ramp
export const CROWD_RAMP_DIST = 560;
      // metres to go from 1 person to a full wave
export const SPAWN_FILL_START = 1;
export const SPAWN_FILL_END = 4;
export const SPAWN_GAP = 1.1;
export const SPAWN_Z = -18;
              // appear just ahead in the fog (was -200)

export const AISLE_W = 9.4;
export const SHELF_X = 6.5;
export const CLAMP_X = 4.0;
export const SEG_LEN = 20, SEG_N = 10, WORLD_BACK = -SEG_N * SEG_LEN;
export const POWERS: any = {
  shoulder: { name: 'SHOVE', yell: 'SHOVE!', cd: 2.4, reach: 8, halfW: 2.2, shake: 0.28 },
  cart:     { name: 'BAT',   yell: 'WHACK!', cd: 4.2, reach: 14, halfW: 4.4, shake: 0.5, rush: 1.5 },
  horn:     { name: 'HORN',  yell: 'HONK!', cd: 3.6, reach: 10, halfW: 7.2, shake: 0.35, radial: true },
  gun:      { name: 'GUN',   yell: 'GUN!', cd: 0, reach: 0, halfW: 0, shake: 0.15 },
  bomb:     { name: 'BOMB',  yell: 'BOOM!', cd: 5, reach: 99, halfW: 99, shake: 0.8 },
};
export const LIVES_MAX = 5;
export const TALK_DRIFT = 2.2;
export const TALK_DRIFT_RATE = 1.55;
export const CART_LAUNCH = 22;
export const CART_GRAVITY = 16;
export const GUN_DURATION = 10;
export const GUN_RATE = 0.11;
export const GUN_SPEED = 38;
export const GUN_HIT_X = 0.38;
            // only the bullet line, not a shotgun cone
export const GUN_HIT_Z = 0.55;
export const GUN_FRONT = 0.5;
             // must be ahead — never the people at your hips
export const GUN_STACK_MAX = 20;
export const GUN_PACK_MORE = 1.2;
export const GUN_PACK_GAP = 1.05;
export const GUN_PACK_FILL = 2;
export const GUN_PACK_ROWS = 1;
export const GUN_PACK_ROW_Z = 1.15;
export const GUN_PACK_SQUEEZE = 0.5;
export const GUN_PACK_LANES = [1, 2, 3];
export const GUN_PACK_Z_JITTER = 0.4;
export const GUN_START_INVULN = 0.45;
export const LIVES_CAP = 6;
export const INF_DRIFT = 1.9;
export const INF_DRIFT_RATE = 1.15;
export const COIN_VALUE = 12;
export const COIN_GAP = 3.1;
export const COIN_1UP = 40;
export const STAGES: any[] = [
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
export const TYPES: any = {
  talk: { color: COL.talk },
  text: { color: COL.text },
  selfie: { color: COL.selfie, blocker: true },
  inf: { color: 0xff4d8a },
};