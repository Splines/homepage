import { Clock, type Animation } from "../lib/clock";
import { bindPlayButton, requireElement, setText } from "../lib/controls";
import { createCloud, drawDots, drawLabel, tracePolyline } from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, normal, onCircle, type Random } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";

const FRAME: Bounds = { xMin: -1.6, xMax: 1.6, yMin: -1, yMax: 1 };
/** The channel walls sit at y = ±1. */
const WALL = 1;
const CENTER_SPEED = 0.42;
/** Flow speed at the walls relative to the center of the channel. */
const WALL_SPEED_RATIO = 0.35;

const PERIOD = 9;
/** Time at which the material volume V(t) coincides with the fixed region V. */
const COINCIDE_AT = 4.5;
const REGION_CENTER: Point = [0.3, 0];
const REGION_RADIUS = 0.45;

const BACKGROUND_DENSITY = 120;
const PUFF_COUNT = 800;
const PUFF_SPREAD = 0.3;
/** How long (in simulated time) a particle stays highlighted after crossing ∂V. */
const FLASH_DURATION = 0.5;

/** Velocity profile of the channel: fastest in the middle, slower near the walls. */
function speedAt(y: number): number {
  return CENTER_SPEED * (WALL_SPEED_RATIO + (1 - WALL_SPEED_RATIO) * (1 - (y / WALL) ** 2));
}

/**
 * Start positions: a uniform background plus a dense puff that reaches the fixed
 * region around the middle of the loop. The background starts far enough upstream
 * that the channel stays filled for the whole loop.
 */
function sampleFluid(random: Random): Point[] {
  const upstream = FRAME.xMin - CENTER_SPEED * PERIOD;
  const area = (FRAME.xMax - upstream) * 2 * WALL;
  const points: Point[] = Array.from({ length: Math.round(BACKGROUND_DENSITY * area) }, () => [
    upstream + random() * (FRAME.xMax - upstream),
    (2 * random() - 1) * WALL * 0.98,
  ]);
  const puffX = REGION_CENTER[0] - CENTER_SPEED * (COINCIDE_AT - 0.3);
  while (points.length < Math.round(BACKGROUND_DENSITY * area) + PUFF_COUNT) {
    const y = PUFF_SPREAD * normal(random);
    if (Math.abs(y) < WALL * 0.98) points.push([puffX + PUFF_SPREAD * normal(random), y]);
  }
  return points;
}

/**
 * A channel flow carrying a puff of particles through a fixed region V. Particles
 * crossing ∂V are counted as inflow and outflow, which illustrates the balance
 * equation. A material volume V(t) is drawn alongside; it coincides with V at one
 * instant and always contains the same particles.
 */
export function mountBalance(root: HTMLElement): void {
  const view = new View(requireElement<HTMLCanvasElement>(root, "canvas"), FRAME);
  const outputs = {
    now: requireElement<HTMLOutputElement>(root, "[data-output='now']"),
    start: requireElement<HTMLOutputElement>(root, "[data-output='start']"),
    inflow: requireElement<HTMLOutputElement>(root, "[data-output='inflow']"),
    outflow: requireElement<HTMLOutputElement>(root, "[data-output='outflow']"),
    material: requireElement<HTMLOutputElement>(root, "[data-output='material']"),
  };
  const palette = readPalette(root);

  const start = sampleFluid(createRandom(11));
  const count = start.length;
  const speed = Float64Array.from(start, ([, y]) => speedAt(y));
  const positions = createCloud(count);
  const moveTo = (t: number) => {
    for (let i = 0; i < count; i++) {
      positions.x[i] = start[i][0] + speed[i] * t;
      positions.y[i] = start[i][1];
    }
  };
  const inRegion = (i: number) =>
    Math.hypot(positions.x[i] - REGION_CENTER[0], positions.y[i] - REGION_CENTER[1]) < REGION_RADIUS;

  // The material volume consists of the particles that are inside V at COINCIDE_AT.
  moveTo(COINCIDE_AT);
  const isMaterial = Array.from({ length: count }, (_, i) => inRegion(i));
  setText(outputs.material, String(isMaterial.filter(Boolean).length));
  const outlineAtCoincidence = onCircle(REGION_CENTER, REGION_RADIUS, 400);
  const outline = createCloud(outlineAtCoincidence.length);

  const inside = new Uint8Array(count);
  const crossedAt = new Float64Array(count);
  const crossedInward = new Uint8Array(count);
  let startCount = 0;
  let current = 0;
  let inflow = 0;
  let outflow = 0;
  let time = 0;

  const animation: Animation = {
    period: PERIOD,
    speed: 1,
    reset() {
      moveTo(0);
      startCount = 0;
      for (let i = 0; i < count; i++) {
        inside[i] = inRegion(i) ? 1 : 0;
        startCount += inside[i];
        crossedAt[i] = -Infinity;
      }
      current = startCount;
      inflow = outflow = 0;
    },
    update(t) {
      time = t;
      moveTo(t);
      for (let i = 0; i < count; i++) {
        const now = inRegion(i) ? 1 : 0;
        if (now === inside[i]) continue;
        if (now) inflow++;
        else outflow++;
        current += now ? 1 : -1;
        inside[i] = now;
        crossedAt[i] = t;
        crossedInward[i] = now;
      }
      outlineAtCoincidence.forEach(([x, y], k) => {
        outline.x[k] = x + speedAt(y) * (t - COINCIDE_AT);
        outline.y[k] = y;
      });
    },
    draw() {
      if (!view.begin()) return;
      const { ctx } = view;

      // Channel walls.
      ctx.strokeStyle = palette.muted;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (const y of [WALL, -WALL]) {
        ctx.moveTo(0, view.screenY(y));
        ctx.lineTo(view.width, view.screenY(y));
      }
      ctx.stroke();

      // Fixed region V.
      ctx.beginPath();
      ctx.arc(view.screenX(REGION_CENTER[0]), view.screenY(REGION_CENTER[1]), REGION_RADIUS * view.scale, 0, 2 * Math.PI);
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = palette.fixed;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.fixed;
      ctx.lineWidth = 1.75;
      ctx.stroke();

      // Material volume V(t).
      tracePolyline(view, outline, true);
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.setLineDash([]);

      drawDots(view, positions, 1.3, palette.muted, i => !isMaterial[i]);
      drawDots(view, positions, 1.6, palette.accent, i => isMaterial[i]);

      // Recent crossings of ∂V fade out.
      for (let i = 0; i < count; i++) {
        const age = time - crossedAt[i];
        if (age > FLASH_DURATION) continue;
        ctx.globalAlpha = 0.8 * (1 - age / FLASH_DURATION);
        ctx.strokeStyle = crossedInward[i] ? palette.inflow : palette.outflow;
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(view.screenX(positions.x[i]), view.screenY(positions.y[i]), 3.2, 0, 2 * Math.PI);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      const labelOffset = -REGION_RADIUS * view.scale - 12;
      drawLabel(view, "V", REGION_CENTER[0], REGION_CENTER[1], palette.fixed, 0, labelOffset);
      const outlineCenter = REGION_CENTER[0] + CENTER_SPEED * (time - COINCIDE_AT);
      if (Math.abs(time - COINCIDE_AT) > 0.8) {
        drawLabel(view, "V(t)", outlineCenter, REGION_CENTER[1], palette.accent, 0, -labelOffset);
      }

      setText(outputs.now, String(current));
      setText(outputs.start, String(startCount));
      setText(outputs.inflow, String(inflow));
      setText(outputs.outflow, String(outflow));
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(requireElement(root, ".fl-play"), clock);
}
