/** The flow shared by the Lagrangian and the Eulerian scene. */

import type { Bounds, Point } from "../lib/view";

export const FRAME: Bounds = { xMin: 0, xMax: 3.5, yMin: -0.5, yMax: 0.5 };
export const DOT_RADIUS = 5;
/** Real seconds for one loop, 0 ≤ t ≤ 1. */
export const SECONDS = 8;

/** Horizontal distance a particle at height 0 covers during 0 ≤ t ≤ 1. */
const DRIFT = 1.9;
/** How much faster the upper layers drift than the lower ones. */
const SHEAR = 0.6;
const WAVE_NUMBER = (2 * Math.PI) / 1.6;
const WAVE_AMPLITUDE = 0.1;
/** Chosen so that the particle highlighted in the Lagrangian scene first rises. */
const WAVE_PHASE = -0.3 - WAVE_NUMBER * 0.55;

const wave = (s: number) => Math.sin(WAVE_NUMBER * s + WAVE_PHASE);

/**
 * Flow map φ(X, t) of a sheared stream over a wavy bed: particles drift to the right,
 * upper ones faster, and swing up and down as they pass the waves. φ(X, 0) = X.
 */
export function flow([X, Y]: Point, t: number): Point {
  const x = X + (DRIFT + SHEAR * Y) * t;
  return [x, Y + WAVE_AMPLITUDE * (wave(x) - wave(X))];
}

/**
 * Inverse flow map φ⁻¹(x, t): the initial position of the particle that is at x at time t.
 * Solved by fixed-point iteration, which contracts since shear and waves are gentle.
 */
export function inverseFlow([x, y]: Point, t: number): Point {
  let X = x;
  let Y = y;
  for (let i = 0; i < 30; i++) {
    X = x - (DRIFT + SHEAR * Y) * t;
    Y = y - WAVE_AMPLITUDE * (wave(x) - wave(X));
  }
  return [X, Y];
}
