import type { Point } from "./view";

/** Source of uniform random numbers in [0, 1). */
export type Random = () => number;

/** Seeded random numbers (mulberry32), so every page load shows the same particles. */
export function createRandom(seed: number): Random {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Standard normal sample (Box–Muller). */
export function normal(random: Random): number {
  const u = Math.max(random(), 1e-12);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * random());
}

/** Uniform sample in the disk of the given center and radius. */
export function inDisk(random: Random, center: Point, radius: number): Point {
  const r = radius * Math.sqrt(random());
  const angle = 2 * Math.PI * random();
  return [center[0] + r * Math.cos(angle), center[1] + r * Math.sin(angle)];
}
