// Small pure helpers.

export function clamp(v: number, lo: number, hi: number) {
  return v < lo ? lo : v > hi ? hi : v;
}
export function toward(cur: number, goal: number, step: number) {
  if (cur < goal) return Math.min(goal, cur + step);
  if (cur > goal) return Math.max(goal, cur - step);
  return goal;
}
// Game randomness goes through rand() so the dev replay harness can swap in a seeded generator
// without also seeding three.js internals (which call Math.random for UUIDs).
let randomSource: () => number = Math.random;
export function rand() {
  return randomSource();
}
export function setRandomSource(fn: () => number) {
  randomSource = fn;
}
export function resetRandomSource() {
  randomSource = Math.random;
}
/** Same mulberry32 used by the replay harness — shared daily seeds depend on it. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
