/**
 * The flow shared by the Lagrangian and the Eulerian scene, plus what both draw.
 */

import { createCloud, tracePolyline } from "../lib/draw";
import type { Palette } from "../lib/palette";
import type { Bounds, Point, View } from "../lib/view";

export const FRAME: Bounds = { xMin: 0, xMax: 3.5, yMin: -0.5, yMax: 0.5 };

/** Horizontal distance a particle at height 0 covers during 0 ≤ t ≤ 1. */
const DRIFT = 1.9;
/** How much faster the upper layers drift than the lower ones. */
const SHEAR = 0.6;
const WAVE_NUMBER = (2 * Math.PI) / 1.6;
const WAVE_AMPLITUDE = 0.1;
/** Chosen so that the particle highlighted in the Lagrangian scene first rises. */
const WAVE_PHASE = -0.3 - WAVE_NUMBER * 0.55;

const TRAIL_SAMPLES = 80;
export const DOT_RADIUS = 5;
export const HIGHLIGHT_RADIUS = 6;

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

/** Fills a dot of the given radius in CSS pixels at each point. */
export function drawDots(view: View, points: Point[], radius: number, color: string): void {
  const { ctx } = view;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [x, y] of points) {
    ctx.moveTo(view.screenX(x) + radius, view.screenY(y));
    ctx.arc(view.screenX(x), view.screenY(y), radius, 0, 2 * Math.PI);
  }
  ctx.fill();
}

const trail = createCloud(TRAIL_SAMPLES);

/** Strokes the trajectory of the particle starting at `start` from time 0 to t. */
export function drawTrajectory(view: View, start: Point, t: number, color: string): void {
  for (let k = 0; k < TRAIL_SAMPLES; k++) {
    [trail.x[k], trail.y[k]] = flow(start, (t * k) / (TRAIL_SAMPLES - 1));
  }
  const { ctx } = view;
  tracePolyline(view, trail, false);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 2;
  ctx.lineCap = "round";
  ctx.stroke();
  ctx.globalAlpha = 1;
}

/** Writes a small title like "Lagrangian description" into the bottom-right corner. */
export function drawCornerTitle(view: View, title: string, palette: Palette): void {
  const { ctx } = view;
  ctx.font = "15px \"Rethink\", sans-serif";
  ctx.fillStyle = palette.text;
  ctx.textAlign = "right";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(title, view.width - 16, view.height - 14);
}
