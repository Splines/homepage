import {
  drawCloud,
  drawText,
  formulaSize,
  measureText,
  paintRegion,
  traceCircle,
  tracePath,
  type TextOptions,
  type TextRun,
} from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, inDisk } from "../lib/random";
import { Timeline } from "../lib/timeline";
import { View, type Bounds, type Point } from "../lib/view";

/** Radius of the vortex core, inside which the fluid turns almost like a rigid body. */
const CORE_RADIUS = 0.6;
/** Angular velocity at the center of the vortex. */
const CORE_RATE = 1.25;
/** Simulated time of one loop, played in as many real seconds. */
const DURATION = 10;

/** Fits the height; the canvas (3:2 or 2:1) shows more to the left and right. */
const FRAME: Bounds = { xMin: -1.5, xMax: 1.5, yMin: -1, yMax: 1 };
/** Fluid particles fill a disk that covers the widest canvas. */
const FLUID_RADIUS = 2.3;
const PARTICLE_COUNT = 4000;

const MATERIAL_CENTER: Point = [0.55, 0];
const MATERIAL_RADIUS = 0.24;
const BOUNDARY_POINTS = 1600;
/** Space in CSS pixels between the volume and its label. */
const LABEL_GAP = 8;

const MOVING_LABEL: TextRun[] = [["V", "italic"], ["(", "upright"], ["t", "italic"], [")", "upright"]];
const INITIAL_LABEL: TextRun[] = [["V", "italic"]];

/**
 * Flow map of a Lamb–Oseen-like vortex: every particle keeps its distance r from the
 * center and turns by the angle Ω(r) t, where inner layers turn faster.
 */
function vortex([x, y]: Point, t: number): Point {
  const r = Math.hypot(x, y);
  const s = (r / CORE_RADIUS) ** 2;
  const rate = s < 1e-9 ? CORE_RATE : (CORE_RATE * (1 - Math.exp(-s))) / s;
  const angle = Math.atan2(y, x) + rate * t;
  return [r * Math.cos(angle), r * Math.sin(angle)];
}

/** Draws a circumflex over the "V" of a formula drawn centered at (x, y) in CSS pixels. */
function drawHat(view: View, x: number, y: number, size: number, color: string): void {
  const { ctx } = view;
  // Shifted to the right, as the italic V leans over.
  const apexX = x + 0.12 * size;
  const apexY = y - 0.66 * size;
  ctx.beginPath();
  ctx.moveTo(apexX - 0.2 * size, apexY + 0.14 * size);
  ctx.lineTo(apexX, apexY);
  ctx.lineTo(apexX + 0.2 * size, apexY + 0.14 * size);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, 0.07 * size);
  ctx.lineJoin = "miter";
  ctx.stroke();
}

/**
 * A material volume V(t) in a vortex. The inner layers turn faster than the outer
 * ones, so V(t) is wound up into a long filament, but it always contains the same
 * particles. The initial region V̂ stays visible, dimmed, for comparison.
 */
export function mountMaterialVolume(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const palette = readPalette(root);

  const random = createRandom(7);
  const fluid = Array.from({ length: PARTICLE_COUNT }, () => inDisk(random, [0, 0], FLUID_RADIUS));
  const isMaterial = ([x, y]: Point) =>
    Math.hypot(x - MATERIAL_CENTER[0], y - MATERIAL_CENTER[1]) < MATERIAL_RADIUS;
  const material = fluid.filter(isMaterial);
  const others = fluid.filter(point => !isMaterial(point));
  // The first boundary point is the one farthest from the center of the vortex. As every
  // particle keeps its distance to the center, it stays the outermost point of V(t), so a
  // label just outside of it never covers the volume.
  const initialBoundary = Array.from({ length: BOUNDARY_POINTS }, (_, i): Point => {
    const angle = (2 * Math.PI * i) / BOUNDARY_POINTS;
    return [
      MATERIAL_CENTER[0] + MATERIAL_RADIUS * Math.cos(angle),
      MATERIAL_CENTER[1] + MATERIAL_RADIUS * Math.sin(angle),
    ];
  });

  new Timeline(root, (progress) => {
    if (!view.begin()) return;
    const { ctx } = view;
    const time = DURATION * progress;
    const boundary = initialBoundary.map(point => vortex(point, time));

    // Streamlines of the vortex as faint guides.
    ctx.strokeStyle = palette.faint;
    ctx.lineWidth = 1;
    for (let r = 0.4; r < FLUID_RADIUS; r += 0.4) {
      traceCircle(view, [0, 0], r);
      ctx.stroke();
    }

    // Initial region V̂, dimmed and dashed.
    tracePath(view, initialBoundary, true);
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([5, 4]);
    paintRegion(ctx, palette.accent, 0.12);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Labels: V̂ below the initial region, V(t) radially outside the outermost point of V(t).
    const size = formulaSize(view);
    const label: TextOptions = { color: palette.accent, halo: palette.paper, size };
    const initialX = view.screenX(MATERIAL_CENTER[0]);
    const initialY = view.screenY(MATERIAL_CENTER[1] - MATERIAL_RADIUS) + LABEL_GAP + 0.75 * size;
    const tip = boundary[0];
    const [ux, uy] = [tip[0] / Math.hypot(...tip), tip[1] / Math.hypot(...tip)];
    const width = measureText(view, MOVING_LABEL, size);
    const distance = LABEL_GAP + (Math.abs(ux) * width) / 2 + (Math.abs(uy) * size) / 2;
    const tipX = view.screenX(tip[0]) + ux * distance;
    const tipY = view.screenY(tip[1]) - uy * distance;
    const drawLabels = (layer: TextOptions["layer"]) => {
      ctx.globalAlpha = 0.6;
      drawText(view, INITIAL_LABEL, initialX, initialY, { ...label, layer });
      if (layer !== "halo") drawHat(view, initialX, initialY, size, palette.accent);
      ctx.globalAlpha = 1;
      drawText(view, MOVING_LABEL, tipX, tipY, { ...label, layer });
    };
    // The labels are split around the marks, so that their halos hide no particle.
    drawLabels("halo");

    // Material volume V(t).
    tracePath(view, boundary, true);
    paintRegion(ctx, palette.accent);
    drawCloud(view, others.map(point => vortex(point, time)), 1.3, palette.muted);
    drawCloud(view, material.map(point => vortex(point, time)), 1.7, palette.accent);

    drawLabels("text");
  }, DURATION);
}
