import { playTimeline } from "../lib/controls";
import { createCloud, drawArrow, drawDots, drawLabel, MATH_FONT } from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, normal, type Random } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";

/** The channel on top, the plot of the mass m(t) below it. */
const FRAME: Bounds = { xMin: -2, xMax: 2, yMin: -1.32, yMax: 0.68 };
/** The fluid fills the channel |y| < WALL. */
const WALL = 0.65;
const CENTER_SPEED = 0.42;
/** Flow speed at the walls relative to the center of the channel. */
const WALL_SPEED_RATIO = 0.35;

const PERIOD = 10;
const REGION_CENTER: Point = [0, 0];
const REGION_RADIUS = 0.4;

const BACKGROUND_DENSITY = 120;
const PUFF_COUNT = 800;
const PUFF_SPREAD = 0.25;
/** How long (in simulated time) a particle stays highlighted after crossing ∂V. */
const FLASH_DURATION = 0.5;

/** Where the plot of m(t) goes, in world coordinates. */
const PLOT = { left: -1.8, right: 1.8, bottom: -1.25, top: -0.86 };
/** How far the axis arrows reach beyond the plot, in world units. */
const AXIS_OVERHANG = 0.06;
const PLOT_SAMPLES = 400;

/** Velocity profile of the channel: fastest in the middle, slower near the walls. */
function speedAt(y: number): number {
  return CENTER_SPEED * (WALL_SPEED_RATIO + (1 - WALL_SPEED_RATIO) * (1 - (y / WALL) ** 2));
}

/**
 * Start positions: a uniform background plus a dense puff whose center passes the
 * fixed region halfway through the loop. The background starts far enough upstream
 * that the channel stays filled for the whole loop.
 */
function sampleFluid(random: Random): Point[] {
  const upstream = FRAME.xMin - CENTER_SPEED * PERIOD;
  const area = (FRAME.xMax - upstream) * 2 * WALL;
  const backgroundCount = Math.round(BACKGROUND_DENSITY * area);
  const points: Point[] = Array.from({ length: backgroundCount }, () => [
    upstream + random() * (FRAME.xMax - upstream),
    (2 * random() - 1) * WALL * 0.98,
  ]);
  const puffX = REGION_CENTER[0] - CENTER_SPEED * (PERIOD / 2);
  while (points.length < backgroundCount + PUFF_COUNT) {
    const y = PUFF_SPREAD * normal(random);
    if (Math.abs(y) < WALL * 0.98) points.push([puffX + PUFF_SPREAD * normal(random), y]);
  }
  return points;
}

/**
 * A channel flow carrying a puff of particles through a fixed region V. Particles
 * crossing ∂V light up as inflow or outflow, and a plot below the channel traces
 * the mass inside V, which illustrates the balance equation. Every particle moves on
 * a straight line at constant speed, so the times at which it enters and leaves V
 * are known exactly and the whole scene is a function of t, which the slider sets.
 */
export function mountBalance(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const palette = readPalette(root);

  const start = sampleFluid(createRandom(11));
  const count = start.length;
  const positions = createCloud(count);
  // A particle at height y is inside V while its x lies in [cx - h, cx + h] with
  // h = √(R² - y²). Particles that never get close enough enter and leave at +∞.
  const entersAt = new Float64Array(count).fill(Infinity);
  const leavesAt = new Float64Array(count).fill(Infinity);
  start.forEach(([x, y], i) => {
    const dy = y - REGION_CENTER[1];
    if (Math.abs(dy) >= REGION_RADIUS) return;
    const halfChord = Math.sqrt(REGION_RADIUS ** 2 - dy ** 2);
    const speed = speedAt(y);
    entersAt[i] = (REGION_CENTER[0] - halfChord - x) / speed;
    leavesAt[i] = (REGION_CENTER[0] + halfChord - x) / speed;
  });
  const isInside = (i: number, t: number) => entersAt[i] <= t && t < leavesAt[i];
  const massAt = (t: number) => {
    let total = 0;
    for (let i = 0; i < count; i++) total += isInside(i, t) ? 1 : 0;
    return total;
  };

  const massCurve = Float64Array.from(
    { length: PLOT_SAMPLES + 1 },
    (_, k) => massAt((k / PLOT_SAMPLES) * PERIOD),
  );
  const massMax = 1.1 * Math.max(...massCurve);
  const plotX = (t: number) => PLOT.left + (t / PERIOD) * (PLOT.right - PLOT.left);
  const plotY = (mass: number) => PLOT.bottom + (mass / massMax) * (PLOT.top - PLOT.bottom);

  const traceCurve = (until: number) => {
    const { ctx } = view;
    const last = Math.min(PLOT_SAMPLES, Math.floor((until / PERIOD) * PLOT_SAMPLES));
    ctx.beginPath();
    for (let k = 0; k <= last; k++) {
      const t = (k / PLOT_SAMPLES) * PERIOD;
      ctx.lineTo(view.screenX(plotX(t)), view.screenY(plotY(massCurve[k])));
    }
  };

  /** Rings around particles that crossed ∂V recently, fading out. Ignores crossings at t < 0. */
  const drawFlashes = (time: number, crossedAt: Float64Array, color: string) => {
    const { ctx } = view;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < count; i++) {
      const age = time - crossedAt[i];
      if (crossedAt[i] <= 0 || age < 0 || age > FLASH_DURATION) continue;
      ctx.globalAlpha = 0.8 * (1 - age / FLASH_DURATION);
      ctx.beginPath();
      ctx.arc(view.screenX(positions.x[i]), view.screenY(positions.y[i]), 3.2, 0, 2 * Math.PI);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  };

  playTimeline(root, (progress) => {
    if (!view.begin()) return;
    const { ctx } = view;
    const time = progress * PERIOD;
    start.forEach(([x, y], i) => {
      positions.x[i] = x + speedAt(y) * time;
      positions.y[i] = y;
    });

    // Fixed region V.
    ctx.beginPath();
    const [centerX, centerY] = [view.screenX(REGION_CENTER[0]), view.screenY(REGION_CENTER[1])];
    ctx.arc(centerX, centerY, REGION_RADIUS * view.scale, 0, 2 * Math.PI);
    ctx.globalAlpha = 0.07;
    ctx.fillStyle = palette.fixed;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.fixed;
    ctx.lineWidth = 1.75;
    ctx.stroke();

    drawDots(view, positions, 1.3, palette.muted, i => !isInside(i, time));
    drawDots(view, positions, 1.6, palette.fixed, i => isInside(i, time));
    drawFlashes(time, entersAt, palette.inflow);
    drawFlashes(time, leavesAt, palette.outflow);

    drawLabel(view, "V", REGION_CENTER[0], REGION_CENTER[1], palette.fixed, 0, -REGION_RADIUS * view.scale - 12);

    // Plot of the mass m(t) inside V: axes, the whole loop faintly, the past solid.
    const originX = view.screenX(PLOT.left);
    const originY = view.screenY(PLOT.bottom);
    const axisTop = view.screenY(PLOT.top + AXIS_OVERHANG);
    const axisRight = view.screenX(PLOT.right + AXIS_OVERHANG);
    ctx.strokeStyle = palette.muted;
    ctx.fillStyle = palette.muted;
    ctx.lineWidth = 1;
    drawArrow(ctx, originX, originY, originX, axisTop);
    drawArrow(ctx, originX, originY, axisRight, originY);
    ctx.lineJoin = "round";
    traceCurve(PERIOD);
    ctx.strokeStyle = palette.faint;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    traceCurve(time);
    ctx.strokeStyle = palette.fixed;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(view.screenX(plotX(time)), view.screenY(plotY(massAt(time))), 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = palette.fixed;
    ctx.fill();

    // Axis labels: "Mass in V" next to the tip of the vertical axis, t after the horizontal one.
    ctx.fillStyle = palette.text;
    ctx.textBaseline = "middle";
    ctx.textAlign = "left";
    ctx.font = "14px Rethink, sans-serif";
    const prefix = "Mass in ";
    ctx.fillText(prefix, originX + 10, axisTop);
    const prefixWidth = ctx.measureText(prefix).width;
    ctx.font = MATH_FONT;
    ctx.fillText("V", originX + 10 + prefixWidth, axisTop);
    ctx.fillText("t", axisRight + 8, originY);
  }, PERIOD);
}
