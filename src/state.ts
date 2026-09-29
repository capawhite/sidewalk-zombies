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
  // powers
  shoveCd: 0, lastCd: POWERS.shoulder.cd, power: 'shoulder', cartRush: 0, gunT: 0, gunCd: 0, scareT: 0,
  // player and input
  vx: 0, lean: 0, tapLeft: 0, tapRight: 0, hopT: 0,
  pointerActive: false, pointerX: 0, pointerOriginX: 0, touchAnchorX: 0,
  pointerLastX: 0, pointerLastT: 0, pointerFlick: 0,
  // coins
  coins: 0, lvCoins: 0, coinStreak: 0, coinStreakT: 0, vault: readStored('sz_vault'),
  // spawn timers
  spawnTimer: 0, pickTimer: 0, coinTimer: 0,
  // camera and time
  last: performance.now(), baseFov: CAM_FOV, fovKick: 0, hitStop: 0,
  worldLevel: 1,
};

export function stageOf(lv = G.level) {
  return STAGES[lv - 1] || STAGES[STAGES.length - 1];
}
export const powerQ: string[] = [];
export const keys: any = {};
export const slotsX = [-3.4, -1.7, 0, 1.7, 3.4];