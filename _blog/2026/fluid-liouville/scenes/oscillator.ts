import { bindChoice, playTimeline } from "../lib/controls";
import { createCloud, drawAxes, drawDots, drawRing } from "../lib/draw";
import { readPalette, type Palette } from "../lib/palette";
import { createRandom, inDisk } from "../lib/random";
import { View, type Bounds, type Point } from "../lib/view";
import { drawCornerTitle } from "./drift";

/** Both canvases show -Q_RANGE ≤ q ≤ Q_RANGE across their full width, so q lines up. */
const Q_RANGE = 2.4;
const PHASE_FRAME: Bounds = { xMin: -Q_RANGE, xMax: Q_RANGE, yMin: -Q_RANGE, yMax: Q_RANGE };
/** The wall the springs are attached to. */
const WALL_Q = -2.25;
const SPRING_COILS = 11;

/** Amplitude and initial phase angle of the highlighted copies, one spring each. */
const COPIES: [amplitude: number, angle: number][] = [
  [1.7, 0.4],
  [1.25, 2.3],
  [0.85, 4.0],
  [0.5, 5.4],
];
const COPY_DOT_RADIUS = 5.5;
/** Real seconds for one full swing, i.e. one loop around the origin in phase space. */
const PERIOD_SECONDS = 5.5;

const ENSEMBLE_COUNT = 1500;
const ENSEMBLE_RADIUS = 2.1;
const GUIDE_RADII = [0.5, 1, 1.5, 2];

/** Pixels between the canvas edges and the outer springs; more at the bottom for the title. */
const SPRINGS_TOP = 22;
const SPRINGS_BOTTOM = 44;

/**
 * Exact flow of the harmonic oscillator H = (q² + p²)/2 with m = k = 1. Hamilton's
 * equations q̇ = p, ṗ = −q turn every state clockwise around the origin by the angle t.
 */
function evolve([q, p]: Point, t: number): Point {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [q * c + p * s, p * c - q * s];
}

function copyColors(palette: Palette): string[] {
  return [palette.accent, palette.fixed, palette.outflow, palette.ink];
}

/** Makes the zigzag of a spring from x0 to x1 at height y (all in CSS pixels) the current path. */
function traceSpring(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  amplitude: number,
): void {
  const lead = Math.min(8, (x1 - x0) / 6);
  const coilLength = (x1 - x0 - 2 * lead) / SPRING_COILS;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x0 + lead, y);
  for (let k = 0; k < SPRING_COILS; k++) {
    const start = x0 + lead + k * coilLength;
    ctx.lineTo(start + coilLength / 4, y - amplitude);
    ctx.lineTo(start + (3 * coilLength) / 4, y + amplitude);
    ctx.lineTo(start + coilLength, y);
  }
  ctx.lineTo(x1, y);
}

/** Draws a horizontal arrow from x0 to x1 at height y (CSS pixels). */
function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  y: number,
  color: string,
): void {
  const direction = Math.sign(x1 - x0);
  const head = Math.min(6, Math.abs(x1 - x0));
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y);
  ctx.lineTo(x1 - direction * head, y);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y);
  ctx.lineTo(x1 - direction * head, y - head / 1.6);
  ctx.lineTo(x1 - direction * head, y + head / 1.6);
  ctx.closePath();
  ctx.fill();
}

/**
 * Copies of a mass on a spring, each at its position q. An arrow above every block
 * shows its momentum p.
 */
function drawSprings(view: View, states: Point[], palette: Palette): void {
  const { clientWidth, clientHeight } = view.canvas;
  const halfHeight = clientWidth > 0 ? (Q_RANGE * clientHeight) / clientWidth : Q_RANGE;
  view.bounds = { xMin: -Q_RANGE, xMax: Q_RANGE, yMin: -halfHeight, yMax: halfHeight };
  if (!view.begin()) return;
  const { ctx } = view;
  const colors = copyColors(palette);
  const spacing = (view.height - SPRINGS_TOP - SPRINGS_BOTTOM) / states.length;
  const blockHeight = Math.min(32, 0.45 * spacing);
  const blockWidth = 1.25 * blockHeight;

  // Rest position q = 0.
  const restX = view.screenX(0);
  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(restX, 0);
  ctx.lineTo(restX, view.height);
  ctx.stroke();
  ctx.setLineDash([]);

  // Wall with hatching on its back.
  const wallX = view.screenX(WALL_Q);
  ctx.strokeStyle = palette.text;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(wallX, SPRINGS_TOP / 2);
  ctx.lineTo(wallX, view.height - SPRINGS_BOTTOM / 2);
  ctx.stroke();
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let y = SPRINGS_TOP / 2 + 6; y < view.height - SPRINGS_BOTTOM / 2; y += 9) {
    ctx.moveTo(wallX, y);
    ctx.lineTo(wallX - 7, y + 7);
  }
  ctx.stroke();

  states.forEach(([q, p], i) => {
    const y = SPRINGS_TOP + (i + 0.5) * spacing + 0.1 * blockHeight;
    const x = view.screenX(q);
    traceSpring(ctx, wallX, x - blockWidth / 2, y, 0.3 * blockHeight);
    ctx.strokeStyle = palette.text;
    ctx.lineWidth = 1.3;
    ctx.lineJoin = "round";
    ctx.stroke();

    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.roundRect(x - blockWidth / 2, y - blockHeight / 2, blockWidth, blockHeight, 4);
    ctx.fill();

    const arrowLength = 0.3 * p * view.scale;
    if (Math.abs(arrowLength) > 2) {
      drawArrow(ctx, x, x + arrowLength, y - blockHeight / 2 - 7, colors[i]);
    }
  });

  drawCornerTitle(view, "Real space", palette);
}

/**
 * The harmonic oscillator in real space and in phase space. A few copies with different
 * initial conditions swing on their springs; in phase space, each of them is a single
 * point that circles the origin clockwise, all with the same period. On request, a whole
 * ensemble of copies fills phase space and turns like a rigid body.
 */
export function mountOscillator(root: HTMLElement): void {
  const canvas = (name: string) =>
    root.querySelector<HTMLCanvasElement>(`[data-canvas="${name}"]`)!;
  const springs = new View(canvas("springs"), PHASE_FRAME);
  const phase = new View(canvas("phase"), PHASE_FRAME);
  const palette = readPalette(root);
  const colors = copyColors(palette);

  const starts = COPIES.map(([amplitude, angle]): Point => [
    amplitude * Math.cos(angle),
    amplitude * Math.sin(angle),
  ]);
  const random = createRandom(11);
  const ensembleStarts = Array.from(
    { length: ENSEMBLE_COUNT },
    () => inDisk(random, [0, 0], ENSEMBLE_RADIUS),
  );
  const ensemble = createCloud(ENSEMBLE_COUNT);
  let showEnsemble = false;

  const clock = playTimeline(root, (t) => {
    const time = 2 * Math.PI * t;
    const states = starts.map(start => evolve(start, time));
    drawSprings(springs, states, palette);

    if (!phase.begin()) return;
    const { ctx } = phase;
    const originX = phase.screenX(0);
    const originY = phase.screenY(0);
    ctx.strokeStyle = palette.faint;
    ctx.lineWidth = 1;
    for (const radius of GUIDE_RADII) {
      ctx.beginPath();
      ctx.arc(originX, originY, radius * phase.scale, 0, 2 * Math.PI);
      ctx.stroke();
    }
    drawAxes(phase, palette.muted, ["q", "p"]);

    if (showEnsemble) {
      ensembleStarts.forEach((start, i) => {
        [ensemble.x[i], ensemble.y[i]] = evolve(start, time);
      });
      drawDots(phase, ensemble, 1.5, palette.ink);
    }

    // Orbits of the highlighted copies: circles of constant energy.
    ctx.lineWidth = 1.5;
    ctx.globalAlpha = 0.4;
    COPIES.forEach(([amplitude], i) => {
      ctx.strokeStyle = colors[i];
      ctx.beginPath();
      ctx.arc(originX, originY, amplitude * phase.scale, 0, 2 * Math.PI);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;

    states.forEach(([q, p], i) => {
      drawRing(phase, q, p, COPY_DOT_RADIUS + 1.5, palette.paper, 3);
      ctx.fillStyle = colors[i];
      ctx.beginPath();
      ctx.arc(phase.screenX(q), phase.screenY(p), COPY_DOT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();
    });

    drawCornerTitle(phase, "Phase space", palette);
  }, PERIOD_SECONDS);

  bindChoice([...root.querySelectorAll<HTMLButtonElement>("[data-copies]")], "copies", (value) => {
    showEnsemble = value === "many";
    clock.redraw();
  });
}
