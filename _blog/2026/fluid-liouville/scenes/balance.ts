import {
  drawCloud,
  drawPlot,
  drawText,
  paintRegion,
  traceCircle,
  type TextRun,
} from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, normal, type Random } from "../lib/random";
import { Timeline } from "../lib/timeline";
import { View, type Bounds, type Point } from "../lib/view";

/** The channel on top, the plot of the mass m(t) below it. */
const FRAME: Bounds = { xMin: -2, xMax: 2, yMin: -1.32, yMax: 0.68 };
/** The fluid fills the channel |y| < WALL. */
const WALL = 0.65;
const CENTER_SPEED = 0.42;
/** Flow speed at the walls relative to the center of the channel. */
const WALL_SPEED_RATIO = 0.35;

/** Simulated time of one loop, played in as many real seconds. */
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
const PLOT_SAMPLES = 400;
const MASS_LABEL: TextRun[] = [["Mass in ", "text"], ["V", "italic"]];

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
  // A particle at height y is inside V while its x lies in [cx - h, cx + h] with
  // h = √(R² - y²). Particles that never get close enough enter and leave at +∞.
  const entersAt = start.map(() => Infinity);
  const leavesAt = start.map(() => Infinity);
  start.forEach(([x, y], i) => {
    const dy = y - REGION_CENTER[1];
    if (Math.abs(dy) >= REGION_RADIUS) return;
    const halfChord = Math.sqrt(REGION_RADIUS ** 2 - dy ** 2);
    const speed = speedAt(y);
    entersAt[i] = (REGION_CENTER[0] - halfChord - x) / speed;
    leavesAt[i] = (REGION_CENTER[0] + halfChord - x) / speed;
  });
  const isInside = (i: number, t: number) => entersAt[i] <= t && t < leavesAt[i];
  const mass = Array.from({ length: PLOT_SAMPLES + 1 }, (_, k) => {
    const t = (k / PLOT_SAMPLES) * PERIOD;
    return start.filter((_, i) => isInside(i, t)).length;
  });
  const massMax = 1.1 * Math.max(...mass);

  new Timeline(root, (progress) => {
    if (!view.begin()) return;
    const { ctx } = view;
    const time = progress * PERIOD;
    const positions = start.map(([x, y]): Point => [x + speedAt(y) * time, y]);

    // Fixed region V.
    traceCircle(view, REGION_CENTER, REGION_RADIUS);
    paintRegion(ctx, palette.fixed, 0.07, 1.75);
    drawText(
      view,
      [["V", "italic"]],
      view.screenX(REGION_CENTER[0]),
      view.screenY(REGION_CENTER[1]) - REGION_RADIUS * view.scale - 12,
      { color: palette.fixed },
    );

    drawCloud(view, positions.filter((_, i) => !isInside(i, time)), 1.3, palette.muted);
    drawCloud(view, positions.filter((_, i) => isInside(i, time)), 1.6, palette.fixed);

    // Rings around particles that crossed ∂V recently, fading out. Ignores crossings at t < 0.
    const drawFlashes = (crossedAt: number[], color: string) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      positions.forEach(([x, y], i) => {
        const age = time - crossedAt[i];
        if (crossedAt[i] <= 0 || age < 0 || age > FLASH_DURATION) return;
        ctx.globalAlpha = 0.8 * (1 - age / FLASH_DURATION);
        ctx.beginPath();
        ctx.arc(view.screenX(x), view.screenY(y), 3.2, 0, 2 * Math.PI);
        ctx.stroke();
      });
      ctx.globalAlpha = 1;
    };
    drawFlashes(entersAt, palette.inflow);
    drawFlashes(leavesAt, palette.outflow);

    const box = {
      left: view.screenX(PLOT.left),
      top: view.screenY(PLOT.top),
      right: view.screenX(PLOT.right),
      bottom: view.screenY(PLOT.bottom),
    };
    const series = [{ values: mass, color: palette.fixed }];
    drawPlot(view, box, series, massMax, progress, MASS_LABEL, palette);
  }, PERIOD);
}
