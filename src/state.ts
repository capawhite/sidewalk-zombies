// Shared mutable game state (one object, `G`) plus input/power queues.
import { CAM_FOV, LIVES_MAX, POWERS, SPEED, STAGES } from './config';

export const S = { menu: 'menu', play: 'play', clear: 'clear', over: 'over' } as const;
type StateT = typeof S[keyof typeof S];

function readStored(key: string): number {
  try { return parseInt(localStorage.getItem(key) || '0', 10) || 0; } catch (e) { return 0; }
}

/** Every value that changes while the game runs. Read and write it as G.<name>. */
export const G = {
  state: S.menu as StateT,
  // run
  dist: 0, speed: SPEED, lives: LIVES_MAX, combo: 0, bestCombo: 0, invuln: 0, shake: 0,
  level: 1, scoreAcc: 0, best: readStored('sz_best'),
  bestComboEver: readStored('sz_best_combo'),
  bestDist: readStored('sz_best_dist'),
  // bonk combo / near-miss / chains (Stage 1)
  comboTimer: 0, nearMisses: 0, nearMissStreak: 0, chainReactions: 0, bonks: 0,
  lateralSpeed: 0, // recent |dx/dt| for near-miss anti-farm
  // powers
  shoveCd: 0, lastCd: POWERS.shoulder.cd, power: 'shoulder', cartRush: 0, gunT: 0, gunCd: 0, scareT: 0,
  umbrellaCharges: 0, // armed blocks remaining (Umbrella weapon)
  // player and input
  vx: 0, lean: 0, tapLeft: 0, tapRight: 0, hopT: 0,
  pointerActive: false, pointerX: 0, pointerOriginX: 0, touchAnchorX: 0,
  pointerLastX: 0, pointerLastT: 0, pointerFlick: 0,
  // coins
  coins: 0, lvCoins: 0, coinStreak: 0, coinStreakT: 0, vault: readStored('sz_vault'),
  // spawn timers
  spawnTimer: 0, pickTimer: 0, coinTimer: 0,
  encCd: 0, // Stage 2B special-encounter cooldown
  // Stage 3 random events
  evtId: '' as string, // active event id, or ''
  evtT: 0,             // seconds remaining
  evtCd: 0,            // cooldown until next event can start
  evtTargetX: 0,       // Free WiFi hotspot X
  // camera and time
  last: performance.now(), baseFov: CAM_FOV, fovKick: 0, hitStop: 0,
  worldLevel: 1,
  // experimental Rage Mode (FEATURE_RAGE)
  rageT: 0,
};

export function stageOf(lv = G.level) {
  return STAGES[lv - 1] || STAGES[STAGES.length - 1];
}
export const powerQ: string[] = [];
export const keys: any = {};
export const slotsX = [-3.4, -1.7, 0, 1.7, 3.4];