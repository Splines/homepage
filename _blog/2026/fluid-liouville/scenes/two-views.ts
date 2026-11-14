import { Clock, type Animation } from "../lib/clock";
import { bindChoice, bindDraggable, bindPlayButton, setText } from "../lib/controls";
import { createCloud, drawDots, drawLabel, tracePolyline, type PointCloud } from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, inDisk, onCircle } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";

/** Radius of the vortex core, inside which the fluid turns almost like a rigid body. */
const CORE_RADIUS = 0.6;
/** Angular velocity at the center of the vortex. */
const CORE_RATE = 1.25;

const FRAME: Bounds = { xMin: -1.5, xMax: 1.5, yMin: -1, yMax: 1 };
/** Fluid particles fill a disk large enough to cover the frame even when riding along. */
const FLUID_RADIUS = 2.6;
const PARTICLE_COUNT = 5200;

const MATERIAL_CENTER: Point = [0.62, 0];
const MATERIAL_RADIUS = 0.26;
const BOUNDARY_POINTS = 1600;

const WINDOW_HALF_SIZE = 0.2;
const WINDOW_START: Point = [0, 0.62];
/** How far back (in simulated time) the trail of the tracked particle reaches. */
const TRAIL_DURATION = 2.5;

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

  /** Position of particle `index` at time t. */
  positionAt(index: number, t: number): Point {
    const angle = this.startAngle[index] + this.rate[index] * t;
    return [this.radius[index] * Math.cos(angle), this.radius[index] * Math.sin(angle)];
  }
}

/**
 * A vortex seen by two observers: a material volume V(t) that moves with the fluid
 * (Lagrangian) and a window fixed in space (Eulerian). The reader can drag the
 * window and switch the camera between standing still and riding along with the
 * particle at the center of V(t).
 */
export function mountTwoViews(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const handle = root.querySelector<HTMLElement>(".fl-handle")!;
  const windowOutput = root.querySelector<HTMLOutputElement>("[data-output='window']")!;
  const materialOutput = root.querySelector<HTMLOutputElement>("[data-output='material']")!;
  const palette = readPalette(root);

  const random = createRandom(7);
  const start = Array.from({ length: PARTICLE_COUNT }, () => inDisk(random, [0, 0], FLUID_RADIUS));
  const isMaterial = start.map(
    ([x, y]) => Math.hypot(x - MATERIAL_CENTER[0], y - MATERIAL_CENTER[1]) < MATERIAL_RADIUS,
  );
  const fluid = new VortexParticles(start);
  const boundary = new VortexParticles(onCircle(MATERIAL_CENTER, MATERIAL_RADIUS, BOUNDARY_POINTS));
  const tracked = new VortexParticles([MATERIAL_CENTER]);
  const trail = createCloud(48);

  const fixedWindow: Point = [...WINDOW_START];
  let ridingAlong = false;
  setText(materialOutput, String(isMaterial.filter(Boolean).length));

  const insideWindow = (x: number, y: number) =>
    Math.abs(x - fixedWindow[0]) < WINDOW_HALF_SIZE
    && Math.abs(y - fixedWindow[1]) < WINDOW_HALF_SIZE;

  const animation: Animation = {
    period: 10,
    speed: 1,
    reset() {},
    update(t) {
      fluid.moveTo(t);
      boundary.moveTo(t);
      tracked.moveTo(t);
    },
    draw(t) {
      const center: Point = [tracked.positions.x[0], tracked.positions.y[0]];
      view.offset = ridingAlong ? center : [0, 0];
      if (!view.begin()) return;
      const { ctx } = view;

      // Streamlines of the vortex as faint guides.
      ctx.strokeStyle = palette.faint;
      ctx.lineWidth = 1;
      for (let r = 0.4; r < FLUID_RADIUS; r += 0.4) {
        ctx.beginPath();
        ctx.arc(view.screenX(0), view.screenY(0), r * view.scale, 0, 2 * Math.PI);
        ctx.stroke();
      }

      // Material volume V(t).
      tracePolyline(view, boundary.positions, true);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Fixed window.
      const size = 2 * WINDOW_HALF_SIZE * view.scale;
      const left = view.screenX(fixedWindow[0] - WINDOW_HALF_SIZE);
      const top = view.screenY(fixedWindow[1] + WINDOW_HALF_SIZE);
      ctx.globalAlpha = 0.07;
      ctx.fillStyle = palette.fixed;
      ctx.fillRect(left, top, size, size);
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.fixed;
      ctx.lineWidth = 1.75;
      ctx.strokeRect(left, top, size, size);

      drawDots(view, fluid.positions, 1.3, palette.muted, i => !isMaterial[i]);
      drawDots(view, fluid.positions, 1.7, palette.accent, i => isMaterial[i]);

      // Trail and marker of the tracked particle.
      const from = Math.max(0, t - TRAIL_DURATION);
      for (let k = 0; k < trail.x.length; k++) {
        const time = from + ((t - from) * k) / (trail.x.length - 1);
        [trail.x[k], trail.y[k]] = tracked.positionAt(0, time);
      }
      tracePolyline(view, trail, false);
      ctx.strokeStyle = palette.ink;
      ctx.globalAlpha = 0.45;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 1;
      ctx.fillStyle = palette.ink;
      ctx.beginPath();
      ctx.arc(view.screenX(center[0]), view.screenY(center[1]), 3.5, 0, 2 * Math.PI);
      ctx.fill();
      drawLabel(view, "V(t)", center[0], center[1], palette.accent, 0, -MATERIAL_RADIUS * view.scale - 12);

      // The grip must not float over the page when riding along carries the window away.
      const handleX = view.screenX(fixedWindow[0]);
      const handleY = view.screenY(fixedWindow[1]);
      handle.hidden = handleX < 0 || handleX > view.width || handleY < 0 || handleY > view.height;
      handle.style.left = `${handleX}px`;
      handle.style.top = `${handleY}px`;
      handle.style.width = handle.style.height = `${size}px`;

      let count = 0;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        if (isMaterial[i] && insideWindow(fluid.positions.x[i], fluid.positions.y[i])) count++;
      }
      setText(windowOutput, String(count));
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);
  bindChoice([...root.querySelectorAll<HTMLButtonElement>("[data-camera]")], "camera", (camera) => {
    ridingAlong = camera === "ride";
    clock.redraw();
  });
  bindDraggable(handle, view, () => fixedWindow, ([x, y]) => {
    // Keep the whole window on screen.
    const { xMin, xMax, yMin, yMax } = view.visible();
    const margin = WINDOW_HALF_SIZE;
    fixedWindow[0] = Math.max(xMin + margin, Math.min(xMax - margin, x));
    fixedWindow[1] = Math.max(yMin + margin, Math.min(yMax - margin, y));
    clock.redraw();
  });
}
