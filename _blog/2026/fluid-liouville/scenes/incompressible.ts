import {
  drawCloud,
  drawCornerTitle,
  drawDots,
  drawPhaseAxes,
  drawText,
  paintRegion,
  traceCircle,
  tracePath,
} from "../lib/draw";
import { readPalette, type Palette } from "../lib/palette";
import { createRandom, inDisk } from "../lib/random";
import { Timeline, bindChoice } from "../lib/timeline";
import { View, type Bounds, type Point } from "../lib/view";

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
/** Simulated time units per real second. */
const SPEED = 1.6;
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
 * Advances a copy by `steps` steps of the pendulum H = p²/2 − cos q with friction −γp,
 * each split into exactly solvable parts (Strang splitting): friction, kick, drift, kick,
 * friction. Kick and drift preserve area exactly (the step is symplectic); each friction
 * part scales p and thus area by exp(−γ h/2). So areas evolve exactly like exp(−γt).
 */
function step([q, p]: Point, gamma: number, steps: number): Point {
  const damping = Math.exp((-gamma * STEP) / 2);
  for (let s = 0; s < steps; s++) {
    p *= damping;
    p -= (Math.sin(q) * STEP) / 2;
    q += p * STEP;
    p -= (Math.sin(q) * STEP) / 2;
    p *= damping;
  }
  return [q, p];
}

/** Point on the boundary of the initial region, at a fraction `s` of a full turn. */
function onInitialCircle(s: number): Point {
  const angle = 2 * Math.PI * s;
  return [
    REGION_CENTER[0] + REGION_RADIUS * Math.cos(angle),
    REGION_CENTER[1] + REGION_RADIUS * Math.sin(angle),
  ];
}

/** Area enclosed by a closed polygon (shoelace formula). */
function polygonArea(points: Point[]): number {
  let twiceArea = 0;
  points.forEach(([x, y], i) => {
    const [nextX, nextY] = points[(i + 1) % points.length];
    twiceArea += x * nextY - nextX * y;
  });
  return Math.abs(twiceArea) / 2;
}

/** A point of the region's boundary and where it started on the initial circle. */
interface Knot {
  s: number;
  point: Point;
}

/** State of the whole scene after a number of integrator steps. Never changed in place. */
interface State {
  steps: number;
  /** The first copies are the HIGHLIGHTS. */
  copies: Point[];
  boundary: Knot[];
}

/**
 * Advances the copies and the boundary of the region by `steps` integrator steps. Stretched
 * boundary segments are refined by integrating a new point from its start on the initial
 * circle, so the outline stays smooth however much the region gets wound up.
 */
function advance(state: State, steps: number, gamma: number): State {
  const total = state.steps + steps;
  const moved = state.boundary.map(({ s, point }) => ({ s, point: step(point, gamma, steps) }));
  const boundary: Knot[] = [];
  let insertions = 0;
  moved.forEach((knot, i) => {
    boundary.push(knot);
    const next = moved[(i + 1) % moved.length];
    if (insertions >= MAX_INSERTIONS_PER_PASS) return;
    if (moved.length + insertions >= MAX_BOUNDARY_POINTS) return;
    const [dx, dy] = [next.point[0] - knot.point[0], next.point[1] - knot.point[1]];
    if (Math.hypot(dx, dy) < MAX_SEGMENT_LENGTH) return;
    const s = (knot.s + (i === moved.length - 1 ? 1 : next.s)) / 2;
    boundary.push({ s, point: step(onInitialCircle(s), gamma, total) });
    insertions++;
  });
  return {
    steps: total,
    copies: state.copies.map(copy => step(copy, gamma, steps)),
    boundary,
  };
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
        ctx.moveTo(view.screenX(FRAME.xMin), view.screenY(sign * momentum(energy, FRAME.xMin)));
        for (let k = 1; k <= samples; k++) {
          const q = FRAME.xMin + ((FRAME.xMax - FRAME.xMin) * k) / samples;
          ctx.lineTo(view.screenX(q), view.screenY(sign * momentum(energy, q)));
        }
      }
    }
    ctx.stroke();
  }
}

/**
 * Pendulums with angles q (0 = hanging down, counterclockwise from there to the right)
 * on a common pivot. The angle of the first one is marked with an arc.
 */
function drawPendulums(view: View, angles: number[], colors: string[], palette: Palette): void {
  if (!view.begin()) return;
  const { ctx } = view;
  const pivotX = view.screenX(PIVOT[0]);
  const pivotY = view.screenY(PIVOT[1]);
  const length = ROD_LENGTH * view.scale;

  // Circle the bobs move on, and the rest position.
  ctx.strokeStyle = palette.faint;
  ctx.lineWidth = 1;
  traceCircle(view, PIVOT, ROD_LENGTH);
  ctx.stroke();
  ctx.strokeStyle = palette.muted;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(pivotX, pivotY);
  ctx.lineTo(pivotX, pivotY + length + 2 * BOB_RADIUS);
  ctx.stroke();
  ctx.setLineDash([]);

  // Angle q of the first pendulum, measured from the rest position.
  const q = angles[0];
  const arcRadius = ANGLE_ARC_RADIUS * view.scale;
  ctx.strokeStyle = colors[0];
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  // Canvas angles run clockwise from the right; hanging down is π/2.
  ctx.arc(pivotX, pivotY, arcRadius, Math.PI / 2, Math.PI / 2 - q, q > 0);
  ctx.stroke();
  if (Math.abs(q) > 0.25) {
    const middle = Math.PI / 2 - q / 2;
    const x = pivotX + (arcRadius + 11) * Math.cos(middle);
    const y = pivotY + (arcRadius + 11) * Math.sin(middle);
    drawText(view, [["q", "italic"]], x, y, { color: colors[0] });
  }

  for (let i = angles.length - 1; i >= 0; i--) {
    const bobX = pivotX + length * Math.sin(angles[i]);
    const bobY = pivotY + length * Math.cos(angles[i]);
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

/** Writes `value` into an `<output>`, touching the DOM only on change. */
function setText(element: Element, value: string): void {
  if (element.textContent !== value) element.textContent = value;
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
  const areaOutput = root.querySelector<HTMLOutputElement>("[data-output='area']")!;
  const densityOutput = root.querySelector<HTMLOutputElement>("[data-output='density']")!;
  const palette = readPalette(root);
  const colors = [palette.fixed, palette.outflow, palette.density];

  const random = createRandom(5);
  const initial: State = {
    steps: 0,
    copies: [
      ...HIGHLIGHTS,
      ...Array.from({ length: COPY_COUNT }, () => inDisk(random, REGION_CENTER, REGION_RADIUS)),
    ],
    boundary: Array.from({ length: BOUNDARY_START_POINTS }, (_, i) => {
      const s = i / BOUNDARY_START_POINTS;
      return { s, point: onInitialCircle(s) };
    }),
  };
  const initialArea = polygonArea(initial.boundary.map(knot => knot.point));
  let gamma = 0;
  let state = initial;
  /** Saved states, one every STEPS_PER_SNAPSHOT steps; only valid for the current friction. */
  let snapshots = [initial];

  /** Integrates to `target` steps, from the current state or a closer saved one. */
  const advanceTo = (target: number) => {
    const index = Math.min(Math.floor(target / STEPS_PER_SNAPSHOT), snapshots.length - 1);
    const saved = snapshots[index];
    if (saved.steps > state.steps || target < state.steps) state = saved;
    while (state.steps < target) {
      // Passes end on multiples of STEPS_PER_PASS, so they also hit every snapshot.
      const steps = Math.min(target - state.steps, STEPS_PER_PASS - (state.steps % STEPS_PER_PASS));
      state = advance(state, steps, gamma);
      if (state.steps === snapshots.length * STEPS_PER_SNAPSHOT) snapshots.push(state);
    }
  };

  const timeline = new Timeline(root, (progress) => {
    advanceTo(Math.floor((progress * PERIOD) / STEP));
    const highlights = state.copies.slice(0, HIGHLIGHTS.length);
    drawPendulums(real, highlights.map(([q]) => q), colors, palette);
    if (!view.begin()) return;

    drawEnergyGuides(view, palette.faint);
    drawPhaseAxes(view, palette);
    const boundary = state.boundary.map(knot => knot.point);
    tracePath(view, boundary, true);
    paintRegion(view.ctx, palette.accent);
    view.ctx.globalAlpha = 0.75;
    drawCloud(view, state.copies, 1.2, palette.ink);
    view.ctx.globalAlpha = 1;
    highlights.forEach((highlight, i) => {
      drawDots(view, [highlight], HIGHLIGHT_RADIUS + 3, palette.paper);
      drawDots(view, [highlight], HIGHLIGHT_RADIUS, colors[i]);
    });
    drawCornerTitle(view, "Phase space", palette);

    const ratio = polygonArea(boundary) / initialArea;
    setText(areaOutput, `${Math.round(100 * ratio)} %`);
    setText(densityOutput, `× ${(1 / ratio).toFixed(2)}`);
  }, PERIOD / SPEED);

  bindChoice(root, "friction", (value) => {
    gamma = value === "on" ? FRICTION : 0;
    state = initial;
    snapshots = [initial];
    timeline.restart();
  });
}
