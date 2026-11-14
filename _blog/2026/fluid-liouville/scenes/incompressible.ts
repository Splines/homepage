import { Clock, type Animation } from "../lib/clock";
import { bindChoice, bindPlayButton, setText } from "../lib/controls";
import { createCloud, drawAxes, drawDots, tracePolyline, type PointCloud } from "../lib/draw";
import { readPalette } from "../lib/palette";
import { createRandom, inDisk } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";

const FRAME: Bounds = { xMin: -Math.PI, xMax: Math.PI, yMin: -2.2, yMax: 2.2 };
const REGION_CENTER: Point = [1.55, 0];
const REGION_RADIUS = 0.55;
const COPY_COUNT = 1400;
const BOUNDARY_START_POINTS = 240;
const MAX_BOUNDARY_POINTS = 6000;
/** Boundary segments longer than this (in world units) get a new point in between. */
const MAX_SEGMENT_LENGTH = 0.04;
/** Limits the cost of refining the boundary in a single frame. */
const MAX_INSERTIONS_PER_FRAME = 120;
/** Fixed internal time step of the integrator. */
const STEP = 1 / 120;
/** Damping rate γ of the version with friction. */
const FRICTION = 0.1;
/** Energies of the faint guide curves; E = 1 is the separatrix. */
const GUIDE_ENERGIES = [-0.8, -0.4, 0, 0.4, 1, 1.6];

/**
 * One step of the pendulum H = p²/2 − cos q with friction −γp, split into exactly
 * solvable parts (Strang splitting): friction, kick, drift, kick, friction.
 * Kick and drift preserve area exactly (the step is symplectic); each friction part
 * scales p and thus area by exp(−γ h/2). So areas evolve exactly like exp(−γt).
 */
function step(state: PointCloud, index: number, gamma: number): void {
  const damping = Math.exp((-gamma * STEP) / 2);
  let q = state.x[index];
  let p = state.y[index] * damping;
  p -= (Math.sin(q) * STEP) / 2;
  q += p * STEP;
  p -= (Math.sin(q) * STEP) / 2;
  state.x[index] = q;
  state.y[index] = p * damping;
}

/** Area enclosed by the closed polygon through the first `count` points (shoelace formula). */
function polygonArea(cloud: PointCloud, count: number): number {
  let twiceArea = 0;
  for (let i = 0, j = count - 1; i < count; j = i++) {
    twiceArea += cloud.x[j] * cloud.y[i] - cloud.x[i] * cloud.y[j];
  }
  return Math.abs(twiceArea) / 2;
}

/**
 * Boundary of a region of phase space, carried along by the flow. Stretched segments
 * are refined by integrating a new point from its start position on the initial circle,
 * so the outline stays smooth however much the region gets wound up.
 */
class FlowingBoundary {
  readonly points = createCloud(MAX_BOUNDARY_POINTS);
  count = 0;
  /** Position of each point along the initial circle, as a fraction of a full turn. */
  private readonly parameter = new Float64Array(MAX_BOUNDARY_POINTS);

  reset(): void {
    this.count = BOUNDARY_START_POINTS;
    for (let i = 0; i < this.count; i++) this.place(i, i / this.count);
  }

  /** Advances all points by `steps` integrator steps. */
  advance(steps: number, gamma: number): void {
    for (let i = 0; i < this.count; i++) {
      for (let s = 0; s < steps; s++) step(this.points, i, gamma);
    }
  }

  /** Inserts points into overly long segments; `stepsSoFar` is the number of steps since t = 0. */
  refine(stepsSoFar: number, gamma: number): void {
    let insertions = 0;
    for (let i = 0; i < this.count && this.count < MAX_BOUNDARY_POINTS; i++) {
      const next = (i + 1) % this.count;
      const { x, y } = this.points;
      const length = Math.hypot(x[next] - x[i], y[next] - y[i]);
      if (length < MAX_SEGMENT_LENGTH) continue;
      if (++insertions > MAX_INSERTIONS_PER_FRAME) return;

      const end = next === 0 ? 1 : this.parameter[next];
      this.shiftRight(i + 1);
      this.place(i + 1, (this.parameter[i] + end) / 2);
      for (let s = 0; s < stepsSoFar; s++) step(this.points, i + 1, gamma);
      i++; // Check the second half of the split segment in the next frame.
    }
  }

  /** Puts point `index` at the given position along the initial circle. */
  private place(index: number, parameter: number): void {
    const angle = 2 * Math.PI * parameter;
    this.parameter[index] = parameter;
    this.points.x[index] = REGION_CENTER[0] + REGION_RADIUS * Math.cos(angle);
    this.points.y[index] = REGION_CENTER[1] + REGION_RADIUS * Math.sin(angle);
  }

  /** Makes room for a new point at `index`. */
  private shiftRight(index: number): void {
    this.points.x.copyWithin(index + 1, index, this.count);
    this.points.y.copyWithin(index + 1, index, this.count);
    this.parameter.copyWithin(index + 1, index, this.count);
    this.count++;
  }
}

/**
 * Draws level sets of the pendulum's energy E = p²/2 − cos q. Closed orbits (E < 1) are
 * traced through their turning points q = ±arccos(−E); the others are open curves
 * p = ±√(2(E + cos q)) across the whole frame.
 */
function drawEnergyGuides(view: View, color: string): void {
  const { ctx } = view;
  const samples = 200;
  const momentum = (energy: number, q: number) =>
    Math.sqrt(Math.max(0, 2 * (energy + Math.cos(q))));
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  for (const energy of GUIDE_ENERGIES) {
    ctx.beginPath();
    if (energy < 1) {
      const turningPoint = Math.acos(-energy);
      for (let k = 0; k <= 2 * samples; k++) {
        const angle = (Math.PI * k) / samples;
        const q = turningPoint * Math.cos(angle);
        const p = Math.sign(Math.sin(angle)) * momentum(energy, q);
        ctx.lineTo(view.screenX(q), view.screenY(p));
      }
    } else {
      for (const sign of [1, -1]) {
        for (let k = 0; k <= samples; k++) {
          const q = FRAME.xMin + ((FRAME.xMax - FRAME.xMin) * k) / samples;
          const point: Point = [view.screenX(q), view.screenY(sign * momentum(energy, q))];
          if (k === 0) ctx.moveTo(...point);
          else ctx.lineTo(...point);
        }
      }
    }
    ctx.stroke();
  }
}

/**
 * A region of copies of a pendulum moving through phase space. Without friction,
 * the region is wound up into a spiral but keeps its area (Liouville). With
 * friction, the area shrinks like exp(−γt) and the density of copies grows.
 */
export function mountIncompressible(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const areaOutput = root.querySelector<HTMLOutputElement>("[data-output='area']")!;
  const densityOutput = root.querySelector<HTMLOutputElement>("[data-output='density']")!;
  const palette = readPalette(root);

  const random = createRandom(5);
  const copiesStart = Array.from(
    { length: COPY_COUNT },
    () => inDisk(random, REGION_CENTER, REGION_RADIUS),
  );
  const copies = createCloud(COPY_COUNT);
  const boundary = new FlowingBoundary();
  let gamma = 0;
  let stepsSoFar = 0;
  let initialArea = 1;

  const animation: Animation = {
    period: 22,
    speed: 1.6,
    reset() {
      copiesStart.forEach(([q, p], i) => {
        copies.x[i] = q;
        copies.y[i] = p;
      });
      boundary.reset();
      initialArea = polygonArea(boundary.points, boundary.count);
      stepsSoFar = 0;
    },
    update(t) {
      const steps = Math.floor(t / STEP) - stepsSoFar;
      if (steps <= 0) return;
      for (let i = 0; i < COPY_COUNT; i++) {
        for (let s = 0; s < steps; s++) step(copies, i, gamma);
      }
      boundary.advance(steps, gamma);
      stepsSoFar += steps;
      boundary.refine(stepsSoFar, gamma);
    },
    draw() {
      if (!view.begin()) return;
      const { ctx } = view;
      drawEnergyGuides(view, palette.faint);
      drawAxes(view, palette.muted, ["q", "p"]);

      tracePolyline(view, boundary.points, true, boundary.count);
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = palette.accent;
      ctx.fill();
      ctx.globalAlpha = 1;
      ctx.strokeStyle = palette.accent;
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.globalAlpha = 0.75;
      drawDots(view, copies, 1.2, palette.ink);
      ctx.globalAlpha = 1;

      const ratio = polygonArea(boundary.points, boundary.count) / initialArea;
      setText(areaOutput, `${Math.round(100 * ratio)} %`);
      setText(densityOutput, `× ${(1 / ratio).toFixed(2)}`);
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);
  bindChoice([...root.querySelectorAll<HTMLButtonElement>("[data-friction]")], "friction", (value) => {
    gamma = value === "on" ? FRICTION : 0;
    clock.restart();
  });
}
