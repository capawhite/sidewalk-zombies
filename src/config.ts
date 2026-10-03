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
export const STEER_MAX_SPEED = 3.4;
      // hold to cross the aisle; taps should only nudge
export const STEER_ACCEL = 18;
            // ramp in — a short press never reaches full speed
export const STEER_DECEL = 110;
          // ease to a stop (was snappy 160)
export const STEER_REVERSE = 42;
         // A↔D direction changes ease rather than snap
export const STEER_TAP_BUFFER = 0.012;
   // brief coast after keyup so taps don't feel clipped
export const STEER_TAP_SPEED = 1.5;
       // post-keyup buffer aims here, not full STEER_MAX_SPEED
export const STEER_TOUCH_SPAN = 8;
       // full-screen drag = this many world units (aisle is ~8)
export const STEER_TOUCH_FOLLOW = 28;
    // catch the finger without overshooting
export const STEER_TOUCH_DEAD_PX = 10;
   // ignore tiny finger jitter
export const STEER_FLICK = 0.32;
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
                // base walk — ramps with distance
export const SPEED_MAX = 8.0;
             // soft ceiling so late run tightens without becoming a sprint
export const SPEED_RAMP_DIST = 2800;
      // metres from 0 to reach SPEED_MAX
export const CROWD_RAMP_DIST = 560;
      // metres to go from 1 person to a full wave
export const CROWD_RAMP_DIST_2 = 2200;
    // second density squeeze toward max fill
export const SPAWN_FILL_START = 1;
export const SPAWN_FILL_END = 4;
export const SPAWN_GAP = 1.1;
export const SPAWN_Z = -18;
              // appear just ahead in the fog (was -200)

export const AISLE_W = 9.4;
export const SHELF_X = 6.5;
export const CLAMP_X = 4.0;
export const SEG_LEN = 20, SEG_N = 6, WORLD_BACK = -SEG_N * SEG_LEN;
export const POWERS: any = {
  shoulder: { name: 'SHOVE', yell: 'SHOVE!', cd: 2.4, reach: 8, halfW: 2.2, shake: 0.28 },
  cart:     { name: 'BAT',   yell: 'WHACK!', cd: 4.2, reach: 14, halfW: 4.4, shake: 0.5, rush: 1.5 },
  horn:     { name: 'HORN',  yell: 'HONK!', cd: 3.6, reach: 10, halfW: 7.2, shake: 0.35, radial: true },
  gun:      { name: 'GUN',   yell: 'GUN!', cd: 0, reach: 0, halfW: 0, shake: 0.15 },
  bomb:     { name: 'BOMB',  yell: 'BOOM!', cd: 5, reach: 99, halfW: 99, shake: 0.8 },
  whistle:  { name: 'WHISTLE', yell: 'MOVE!', cd: 3.2, reach: 12, halfW: 2.4, shake: 0.3 },
  spray:    { name: 'SPRAY', yell: 'SLOW!', cd: 3.8, reach: 14, halfW: 5.5, shake: 0.22, radial: true },
  umbrella: { name: 'UMBRELLA', yell: 'BLOCK!', cd: 3.4, reach: 0, halfW: 0, shake: 0.2 },
};
export const SPRAY_SLOW_T = 3.2;          // how long sprayed zombies crawl
export const SPRAY_SLOW_SCALE = 0.32;     // approach-speed multiplier while slowed
export const LIVES_MAX = 5;
export const TALK_DRIFT = 2.2;
export const TALK_DRIFT_RATE = 1.55;
export const CART_LAUNCH = 22;
export const CART_GRAVITY = 16;
export const GUN_DURATION = 5;
export const GUN_RATE = 0.11;
export const GUN_SPEED = 38;
export const GUN_HIT_X = 0.38;
            // only the bullet line, not a shotgun cone
export const GUN_HIT_Z = 0.55;
export const GUN_FRONT = 0.5;
             // must be ahead — never the people at your hips
export const GUN_STACK_MAX = 10;
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

// ---------- Stage 1: bonk / combo / near-miss / chain ----------
export const COMBO_WINDOW = 1.85;          // seconds between bonks before combo resets
export const COMBO_SCORE_K = 0.12;         // bonus per combo step above 1
export const COMBO_MULT_CAP = 1.8;         // max score multiplier from combo
export const SHOVE_HITSTOP = 0.055;        // micro-pause on a successful shove
export const SHOVE_SHAKE = 0.38;           // slightly stronger than POWERS.shoulder.shake
export const CHAIN_RADIUS = 1.35;          // knocked body must be this close to transfer
export const CHAIN_MAX_PER_FRAME = 4;
export const CHAIN_SCORE = 10;             // base chaos points per chain transfer
export const NEAR_MISS_GAP = 1.45;         // |dx| under this counts (was 2.1)
export const NEAR_MISS_SCORE = 8;          // base chaos for a near miss
export const NEAR_MISS_STREAK_K = 2;       // +points per near-miss streak step
export const NEAR_MISS_STEER = 0.4;        // need recent lateral speed (m/s) to score
export const FEATURE_RAGE = false;         // experimental; leave off until playtested
export const RAGE_DURATION = 2.4;
export const RAGE_KNOCK_SCALE = 1.35;
export const RAGE_SHOVE_CD_SCALE = 0.55;

// ---------- Stage 2: enemy archetypes ----------
export const NAV_TURN_MIN = 1.4;           // seconds between navigator lane-swaps / 180s
export const NAV_TURN_MAX = 2.6;
export const NAV_LANE_STEP = 1.7;          // one slot sideways
export const NAV_SPIN_T = 0.85;            // how long they stay facing the wrong way
export const PHOTO_WOBBLE = 0.12;          // slight sway while backing up
/** Chance a walkable NPC faces the same way as the player (talk/text/selfie/inf/couple). Photos always do. */
export const FACE_AWAY_CHANCE = 0.42;
export const SCOOTER_EXTRA = 2.6;          // extra approach speed (m/s toward camera)
export const DELIVERY_EXTRA = 3.1;         // delivery bikes close faster than scooters
export const DELIVERY_WEAVE = 2.8;         // hard lateral weave amplitude
export const TOUR_GAP = 0.72;              // spacing inside a tour-group blob
export const TOUR_HIT_HALF_W = 1.35;       // slightly fat hit for tour walkers
export const DOG_LEASH = 1.35;             // max walker↔pup gap before tug
export const DOG_HIT_HALF_W = 1.45;        // leash makes the pair a wide threat
export const COUPLE_GAP = 0.58;            // half-spacing between linked partners
export const HIT_HALF_W = 1.15;            // default player-collision half-width
export const SCOOTER_HIT_HALF_W = 1.05;

// ---------- Stage 2B: special encounters ----------
export const ENC_FIRST_DELAY = 18;         // seconds into a run before first set piece
export const ENC_COOLDOWN_MIN = 22;        // between encounters
export const ENC_COOLDOWN_MAX = 36;
export const ENC_WAVE_PAUSE = 1.9;         // hold normal spawn waves so the set piece reads
export const ENC_OPEN_LANES = 1;           // always leave this many lanes clear (fairness)

// ---------- Stage 3: random run events ----------
export const EVT_FIRST_DELAY = 26;         // first temporary event (after early encounters settle)
export const EVT_COOLDOWN_MIN = 26;
export const EVT_COOLDOWN_MAX = 40;
export const EVT_WIFI_PULL = 1.9;          // lateral ease rate toward hotspot
export const EVT_BATTERY_PULL = 1.7;       // lateral ease rate toward curb chargers
export const EVT_NEWPHONE_GAP = 0.55;      // spawn-gap scale during New Phone Release
export const EVT_NEWPHONE_FILL = 1;        // extra lane fill (still capped under 5)

export const STAGES: any[] = [
  {
    id: 1, name: 'CEREAL AISLE', world: 'aisle', crowd: 'aisle', clearAt: 1000,
    kit: ['cart', 'horn'],
    curtain: {
      kicker: '★ AISLE ACE ★', title: 'YOU MADE IT!',
      sub: "Cereal's cleared. Next: the boardwalk — ring lights, tripods, and people who think you're a lamp post.",
      go: 'Hit the boardwalk →',
    },
  },
  {
    id: 2, name: 'THE BOARDWALK', world: 'street', crowd: 'inf', clearAt: 2200,
    kit: ['gun', 'cart'],
    curtain: {
      kicker: '★ BOARDWALK STAR ★', title: 'INFLUENCED!',
      sub: "You survived the selfies. Next: the food court — coupons, GPS, and folks who walk like the map is the floor.",
      go: 'Hit the food court →',
    },
  },
  {
    id: 3, name: 'FOOD COURT', world: 'mall', crowd: 'mall', clearAt: 3600,
    kit: ['horn', 'gun', 'spray'],
    curtain: {
      kicker: '★ MALL RAT ★', title: 'SALE SURVIVED!',
      sub: "Food-court cleared. Next: the beach — towels, umbrellas, and phones brighter than the sun.",
      go: 'Hit the beach →',
    },
  },
  {
    id: 4, name: 'THE BEACH', world: 'beach', crowd: 'beach', clearAt: 5200,
    kit: ['cart', 'horn', 'gun', 'spray'],
    curtain: {
      kicker: '★ BEACH BUM ★', title: 'SUNBURN SURVIVED!',
      sub: "Sand's cleared. Next: the parking garage — stall hunts, reverse cams, and people who brake for a bar of signal.",
      go: 'Hit the garage →',
    },
  },
  {
    id: 5, name: 'PARKING GARAGE', world: 'garage', crowd: 'garage', clearAt: 7000,
    kit: ['horn', 'gun', 'bomb', 'umbrella'],
    curtain: {
      kicker: '★ VALIDATED ★', title: 'TICKET CLEARED!',
      sub: "Garage survived. Next: the train station — delayed trains, yellow lines, and folks who live on the arrivals board.",
      go: 'Hit the station →',
    },
  },
  {
    id: 6, name: 'TRAIN STATION', world: 'station', crowd: 'station', clearAt: 9000,
    kit: ['cart', 'horn', 'gun', 'whistle', 'umbrella'],
    curtain: {
      kicker: '★ ON TIME ★', title: 'PLATFORM CLEARED!',
      sub: "Station survived. Finale: the airport — departure boards, luggage piles, and scooters that think they're planes.",
      go: 'Hit the airport →',
    },
  },
  {
    id: 7, name: 'THE AIRPORT', world: 'airport', crowd: 'airport', clearAt: 12000,
    kit: ['horn', 'gun', 'bomb', 'whistle'],
    curtain: {
      kicker: '★ GATE CLEARED ★', title: 'YOU ESCAPED!',
      sub: "Boarding pass: valid. Composure: questionable. The sidewalk will still be there tomorrow.",
      go: 'Walk out →',
    },
  },
];
export const TYPES: any = {
  talk: { color: COL.talk },
  text: { color: COL.text },
  selfie: { color: COL.selfie, blocker: true },
  inf: { color: 0xff4d8a },
  // Stage 2 archetypes — each poses a different dodge problem
  nav: { color: 0x4a9fd8 },       // GPS blue: sudden lane change / 180
  photo: { color: 0xb07aff },     // purple: walks backward into you
  couple: { color: 0xff7eb9 },    // pink: linked pair, extra width
  scooter: { color: 0x5fe0a0 },   // mint: closes distance faster
  delivery: { color: 0xff8a2a },  // orange: reverse-lane bike weaving hard
  tour: { color: 0xf0d078 },      // gold: slow blob of linked walkers
  dog: { color: 0xc4a574 },       // tan: walker + pup on a short leash
};