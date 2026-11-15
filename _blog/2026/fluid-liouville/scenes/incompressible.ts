import { Clock, type Animation } from "../lib/clock";
import { bindChoice, bindPlayButton, bindTimeSlider, setText } from "../lib/controls";
import {
  MATH_FONT,
  createCloud,
  drawAxes,
  drawDots,
  drawRing,
  tracePolyline,
  type PointCloud,
} from "../lib/draw";
import { readPalette, type Palette } from "../lib/palette";
import { createRandom, inDisk } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";
import { drawCornerTitle } from "./drift";

const FRAME: Bounds = { xMin: -Math.PI, xMax: Math.PI, yMin: -2.2, yMax: 2.2 };
const REGION_CENTER: Point = [1.55, 0];
const REGION_RADIUS = 0.55;
const COPY_COUNT = 1400;
const BOUNDARY_START_POINTS = 240;
const MAX_BOUNDARY_POINTS = 6000;
/** Boundary segments longer than this (in world units) get a new point in between. */
const MAX_SEGMENT_LENGTH = 0.04;
/** Limits the cost of a single refinement pass of the boundary. */
const MAX_INSERTIONS_PER_PASS = 120;
/** Integrator steps between two refinement passes, so that big jumps keep the outline smooth. */
const STEPS_PER_PASS = 12;
/**
 * Integrator steps between two saved states (a multiple of STEPS_PER_PASS). Seeking with
 * the slider continues from the closest saved state instead of integrating from t = 0.
 */
const STEPS_PER_SNAPSHOT = 120;
/** Fixed internal time step of the integrator. */
const STEP = 1 / 120;
/** Simulated duration of one loop. */
const PERIOD = 22;
/** Damping rate γ of the version with friction. */
const FRICTION = 0.1;
/** Energies of the faint guide curves; E = 1 is the separatrix. */
const GUIDE_ENERGIES = [-0.8, -0.4, 0, 0.4, 1, 1.6];

/**
 * Copies from inside the region that are also shown as pendulums in real space. All
 * start at rest, at increasing angles, so the outer ones swing wider and take longer.
 */
const HIGHLIGHTS: Point[] = [[1.05, 0], [1.55, 0], [2.05, 0]];
const HIGHLIGHT_RADIUS = 5;

/** Real space: the pendulums hang from a common pivot. */
const REAL_FRAME: Bounds = { xMin: -1.43, xMax: 1.43, yMin: -1, yMax: 1 };
const PIVOT: Point = [0, 0.2];
const ROD_LENGTH = 0.95;
const BOB_RADIUS = 9;
/** Radius in world units of the arc that marks the angle q of the first pendulum. */
const ANGLE_ARC_RADIUS = 0.32;

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

interface BoundarySnapshot {
  points: PointCloud;
  parameter: Float64Array;
}

/** State of the whole scene after a number of integrator steps. */
interface Snapshot {
  copies: PointCloud;
  highlights: PointCloud;
  boundary: BoundarySnapshot;
}

const cloneCloud = (cloud: PointCloud): PointCloud => ({ x: cloud.x.slice(), y: cloud.y.slice() });

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

  save(): BoundarySnapshot {
    return {
      points: { x: this.points.x.slice(0, this.count), y: this.points.y.slice(0, this.count) },
      parameter: this.parameter.slice(0, this.count),
    };
  }

  restore(snapshot: BoundarySnapshot): void {
    this.points.x.set(snapshot.points.x);
    this.points.y.set(snapshot.points.y);
    this.parameter.set(snapshot.parameter);
    this.count = snapshot.parameter.length;
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
      if (++insertions > MAX_INSERTIONS_PER_PASS) return;

      const end = next === 0 ? 1 : this.parameter[next];
      this.shiftRight(i + 1);
      this.place(i + 1, (this.parameter[i] + end) / 2);
      for (let s = 0; s < stepsSoFar; s++) step(this.points, i + 1, gamma);
      i++; // Check the second half of the split segment in the next pass.
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

function highlightColors(palette: Palette): string[] {
  return [palette.fixed, palette.outflow, `rgb(${palette.density.join(", ")})`];
}

/**
 * Pendulums with angles q (0 = hanging down, counterclockwise from there to the right)
 * on a common pivot. The angle of the first one is marked with an arc.
 */
function drawPendulums(view: View, states: PointCloud, palette: Palette): void {
  if (!view.begin()) return;
  const { ctx } = view;
  const colors = highlightColors(palette);
  const pivotX = view.screenX(PIVOT[0]);
  const pivotY = view.screenY(PIVOT[1]);
  const length = ROD_LENGTH * view.scale;

  // Circle the bobs move on, and the rest position.
  ctx.strokeStyle = palette.faint;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, length, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.strokeStyle = palette.muted;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(pivotX, pivotY + length + 2 * BOB_RADIUS);
  ctx.stroke();
  ctx.setLineDash([]);

  // Angle q of the first pendulum, measured from the rest position.
  const q = states.x[0];
  const arcRadius = ANGLE_ARC_RADIUS * view.scale;
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Canvas angles run clockwise from the right; hanging down is π/2.
  ctx.arc(pivotX, pivotY, arcRadius, Math.PI / 2, Math.PI / 2 - q, q > 0);
  ctx.stroke();
  if (Math.abs(q) > 0.25) {
    const middle = Math.PI / 2 - q / 2;
    ctx.font = MATH_FONT;
    ctx.fillStyle = colors[0];
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      "q",
      pivotX + (arcRadius + 11) * Math.cos(middle),
      pivotY + (arcRadius + 11) * Math.sin(middle),
    );
  }

  for (let i = states.x.length - 1; i >= 0; i--) {
    const angle = states.x[i];
    const bobX = pivotX + length * Math.sin(angle);
    const bobY = pivotY + length * Math.cos(angle);
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pivotX, pivotY);
    ctx.lineTo(bobX, bobY);
    ctx.stroke();
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.arc(bobX, bobY, BOB_RADIUS, 0, 2 * Math.PI);
    ctx.fill();
  }

  ctx.fillStyle = palette.paper;
  ctx.strokeStyle = palette.text;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(pivotX, pivotY, 3.5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  drawCornerTitle(view, "Real space", palette);
}

/**
 * A region of copies of a pendulum moving through phase space, next to a few of the
 * copies swinging in real space. Without friction, the region is wound up into a spiral
 * but keeps its area (Liouville). With friction, the area shrinks like exp(−γt) and the
 * density of copies grows.
 */
export function mountIncompressible(root: HTMLElement): void {
  const canvas = (name: string) =>
    root.querySelector<HTMLCanvasElement>(`[data-canvas="${name}"]`)!;
  const real = new View(canvas("real"), REAL_FRAME);
  const view = new View(canvas("phase"), FRAME);
  const slider = root.querySelector<HTMLInputElement>("input[type='range']")!;
  const areaOutput = root.querySelector<HTMLOutputElement>("[data-output='area']")!;
  const densityOutput = root.querySelector<HTMLOutputElement>("[data-output='density']")!;
  const palette = readPalette(root);
  const colors = highlightColors(palette);

  const random = createRandom(5);
  const copiesStart = Array.from(
    { length: COPY_COUNT },
    () => inDisk(random, REGION_CENTER, REGION_RADIUS),
  );
  const copies = createCloud(COPY_COUNT);
  const highlights = createCloud(HIGHLIGHTS.length);
  const boundary = new FlowingBoundary();
  let gamma = 0;
  let stepsSoFar = 0;
  let initialArea = 1;
  /** Saved states by multiple of STEPS_PER_SNAPSHOT; only valid for the current friction. */
  let snapshots: Snapshot[] = [];

  const saveState = (): Snapshot => ({
    copies: cloneCloud(copies),
    highlights: cloneCloud(highlights),
    boundary: boundary.save(),
  });

  /** Continues from the latest saved state at or before `target` steps, if that helps. */
  const restoreBefore = (target: number) => {
    const index = Math.min(Math.floor(target / STEPS_PER_SNAPSHOT), snapshots.length - 1);
    const steps = index * STEPS_PER_SNAPSHOT;
    if (index < 0 || (steps <= stepsSoFar && target >= stepsSoFar)) return;
    const snapshot = snapshots[index];
    copies.x.set(snapshot.copies.x);
    copies.y.set(snapshot.copies.y);
    highlights.x.set(snapshot.highlights.x);
    highlights.y.set(snapshot.highlights.y);
    boundary.restore(snapshot.boundary);
    stepsSoFar = steps;
  };

  const animation: Animation = {
    period: PERIOD,
    speed: 1.6,
    reset() {
      copiesStart.forEach(([q, p], i) => {
        copies.x[i] = q;
        copies.y[i] = p;
      });
      HIGHLIGHTS.forEach(([q, p], i) => {
        highlights.x[i] = q;
        highlights.y[i] = p;
      });
      boundary.reset();
      initialArea = polygonArea(boundary.points, boundary.count);
      stepsSoFar = 0;
      if (snapshots.length === 0) snapshots.push(saveState());
    },
    update(t) {
      const target = Math.floor(t / STEP);
      restoreBefore(target);
      while (stepsSoFar < target) {
        // Passes end on multiples of STEPS_PER_PASS, so they also hit every snapshot.
        const steps = Math.min(target - stepsSoFar, STEPS_PER_PASS - (stepsSoFar % STEPS_PER_PASS));
        for (let i = 0; i < COPY_COUNT; i++) {
          for (let s = 0; s < steps; s++) step(copies, i, gamma);
        }
        for (let i = 0; i < HIGHLIGHTS.length; i++) {
          for (let s = 0; s < steps; s++) step(highlights, i, gamma);
        }
        boundary.advance(steps, gamma);
        stepsSoFar += steps;
        boundary.refine(stepsSoFar, gamma);
        if (stepsSoFar === snapshots.length * STEPS_PER_SNAPSHOT) snapshots.push(saveState());
      }
    },
    draw(t) {
      slider.value = String(t / PERIOD);
      drawPendulums(real, highlights, palette);
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

      for (let i = 0; i < HIGHLIGHTS.length; i++) {
        const [q, p] = [highlights.x[i], highlights.y[i]];
        drawRing(view, q, p, HIGHLIGHT_RADIUS + 1.5, palette.paper, 3);
        ctx.fillStyle = colors[i];
        ctx.beginPath();
        ctx.arc(view.screenX(q), view.screenY(p), HIGHLIGHT_RADIUS, 0, 2 * Math.PI);
        ctx.fill();
      }
      drawCornerTitle(view, "Phase space", palette);

      const ratio = polygonArea(boundary.points, boundary.count) / initialArea;
      setText(areaOutput, `${Math.round(100 * ratio)} %`);
      setText(densityOutput, `× ${(1 / ratio).toFixed(2)}`);
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);
  bindTimeSlider(slider, clock);
  bindChoice([...root.querySelectorAll<HTMLButtonElement>("[data-friction]")], "friction", (value) => {
    gamma = value === "on" ? FRICTION : 0;
    snapshots = [];
    clock.restart();
  });
}
