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
