import { playTimeline } from "../lib/controls";
import {
  createCloud,
  drawDots,
  drawFormula,
  formulaSize,
  measureFormula,
  tracePolyline,
  type FormulaOptions,
  type MathRun,
  type PointCloud,
} from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, inDisk, onCircle } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";

/** Radius of the vortex core, inside which the fluid turns almost like a rigid body. */
const CORE_RADIUS = 0.6;
/** Angular velocity at the center of the vortex. */
const CORE_RATE = 1.25;
/** Simulated time of one loop, played in as many real seconds. */
const DURATION = 10;

const FRAME: Bounds = { xMin: -1.5, xMax: 1.5, yMin: -1, yMax: 1 };
/** Fluid particles fill a disk that covers the frame. */
const FLUID_RADIUS = 1.85;
const PARTICLE_COUNT = 2600;

const MATERIAL_CENTER: Point = [0.55, 0];
const MATERIAL_RADIUS = 0.24;
const BOUNDARY_POINTS = 1600;
/** Space in CSS pixels between the volume and its label. */
const LABEL_GAP = 8;

const MOVING_LABEL: MathRun[] = [["V", "italic"], ["(", "upright"], ["t", "italic"], [")", "upright"]];
const INITIAL_LABEL: MathRun[] = [["V", "italic"]];

/** Angular velocity of a Lamb–Oseen-like vortex at radius r: inner layers turn faster. */
function angularVelocity(r: number): number {
  const s = (r / CORE_RADIUS) ** 2;
  return s < 1e-9 ? CORE_RATE : (CORE_RATE * (1 - Math.exp(-s))) / s;
}

/**
 * Particles carried by the vortex. The flow map is exact: every particle keeps its
 * distance r from the center and turns by the angle Ω(r) t.
 */
class VortexParticles {
  readonly positions: PointCloud;
  private readonly radius: Float64Array;
  private readonly startAngle: Float64Array;
  private readonly rate: Float64Array;

  constructor(start: Point[]) {
    this.positions = createCloud(start.length);
    this.radius = Float64Array.from(start, ([x, y]) => Math.hypot(x, y));
    this.startAngle = Float64Array.from(start, ([x, y]) => Math.atan2(y, x));
    this.rate = this.radius.map(angularVelocity);
  }

  /** Moves every particle to its position at time t. */
  moveTo(t: number): void {
    const { x, y } = this.positions;
    for (let i = 0; i < x.length; i++) {
      const angle = this.startAngle[i] + this.rate[i] * t;
      x[i] = this.radius[i] * Math.cos(angle);
      y[i] = this.radius[i] * Math.sin(angle);
    }
  }
}

/** Draws a circumflex over the "V" of a formula drawn centered at screen point (x, y). */
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
  const start = Array.from({ length: PARTICLE_COUNT }, () => inDisk(random, [0, 0], FLUID_RADIUS));
  const isMaterial = start.map(
    ([x, y]) => Math.hypot(x - MATERIAL_CENTER[0], y - MATERIAL_CENTER[1]) < MATERIAL_RADIUS,
  );
  const fluid = new VortexParticles(start);
  const initialBoundary = onCircle(MATERIAL_CENTER, MATERIAL_RADIUS, BOUNDARY_POINTS);
  // The first boundary point is the one farthest from the center of the vortex. As every
  // particle keeps its distance to the center, it stays the outermost point of V(t), so a
  // label just outside of it never covers the volume.
  const boundary = new VortexParticles(initialBoundary);
  const initialCloud = createCloud(BOUNDARY_POINTS);
  initialBoundary.forEach(([x, y], i) => {
    initialCloud.x[i] = x;
    initialCloud.y[i] = y;
  });

  playTimeline(root, (t) => {
    if (!view.begin()) return;
    const { ctx } = view;
    const time = DURATION * t;
    fluid.moveTo(time);
    boundary.moveTo(time);

    // Streamlines of the vortex as faint guides.
    ctx.strokeStyle = palette.faint;
    ctx.lineWidth = 1;
    for (let r = 0.4; r < FLUID_RADIUS; r += 0.4) {
      ctx.beginPath();
      ctx.arc(view.screenX(0), view.screenY(0), r * view.scale, 0, 2 * Math.PI);
      ctx.stroke();
    }

    // Initial region V̂, dimmed.
    tracePolyline(view, initialCloud, true);
    ctx.globalAlpha = 0.06;
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.globalAlpha = 0.5;
    ctx.setLineDash([5, 4]);
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;

    // Labels: V̂ below the initial region, V(t) radially outside the outermost point of V(t).
    const size = formulaSize(view);
    const label: FormulaOptions = { color: palette.accent, halo: palette.paper, size };
    const initialX = view.screenX(MATERIAL_CENTER[0]);
    const initialY = view.screenY(MATERIAL_CENTER[1] - MATERIAL_RADIUS) + LABEL_GAP + 0.75 * size;
    const tip: Point = [boundary.positions.x[0], boundary.positions.y[0]];
    const [ux, uy] = [tip[0] / Math.hypot(...tip), tip[1] / Math.hypot(...tip)];
    const width = measureFormula(view, MOVING_LABEL, size);
    const distance = LABEL_GAP + (Math.abs(ux) * width) / 2 + (Math.abs(uy) * size) / 2;
    const initialAnchor: Point = [view.worldX(initialX), view.worldY(initialY)];
    const drawLabels = (layer: FormulaOptions["layer"]) => {
      ctx.globalAlpha = 0.6;
      drawFormula(view, INITIAL_LABEL, ...initialAnchor, { ...label, layer });
      if (layer !== "halo") drawHat(view, initialX, initialY, size, palette.accent);
      ctx.globalAlpha = 1;
      const offset = { dx: ux * distance, dy: -uy * distance };
      drawFormula(view, MOVING_LABEL, ...tip, { ...label, ...offset, layer });
    };
    // The labels are split around the marks, so that their halos hide no particle.
    drawLabels("halo");

    // Material volume V(t).
    tracePolyline(view, boundary.positions, true);
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = palette.accent;
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = palette.accent;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    drawDots(view, fluid.positions, 1.3, palette.muted, i => !isMaterial[i]);
    drawDots(view, fluid.positions, 1.7, palette.accent, i => isMaterial[i]);

    drawLabels("text");
  }, DURATION);
}
