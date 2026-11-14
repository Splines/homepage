import { Clock, type Animation } from "../lib/clock";
import { bindChoice, bindPlayButton, setText } from "../lib/controls";
import { MATH_FONT, createCloud, drawAxes, drawDensity, drawDots, drawRing, type PointCloud } from "../lib/draw";
import { readPalette, type Palette } from "../lib/palette";
import { createRandom } from "../lib/random";
import { View, type Point } from "../lib/view";
import { EXAMPLES, type PhaseExample } from "./examples";

const COPY_COUNT = 900;
const SERIES_SAMPLES = 400;
/** The ring example colors its copies in this many alternating sectors of start angle. */
const SECTORS = 8;
const OBSERVER_RADIUS = 9;

/** An example with everything that only depends on the example, computed once on selection. */
interface LoadedExample {
  example: PhaseExample;
  starts: Point[];
  /** Whether a copy is drawn light instead of dark (alternating sectors in the ring example). */
  highlighted: Uint8Array;
  /** ρ measured by the observer standing still, sampled over one loop. */
  fixedSeries: Float64Array;
  /** ρ measured by the observer riding along, sampled over one loop. */
  riderSeries: Float64Array;
  seriesMax: number;
}

function loadExample(id: string): LoadedExample {
  const example = EXAMPLES[id]();
  const random = createRandom(23);
  const starts = Array.from({ length: COPY_COUNT }, () => example.sample(random));
  const highlighted = Uint8Array.from(starts, ([q, p]) => {
    if (!example.colorByAngle) return 0;
    const angle = Math.atan2(p, q) + Math.PI;
    return Math.floor((angle / (2 * Math.PI)) * SECTORS) % 2;
  });

  const fixedSeries = new Float64Array(SERIES_SAMPLES + 1);
  const riderSeries = new Float64Array(SERIES_SAMPLES + 1);
  for (let i = 0; i <= SERIES_SAMPLES; i++) {
    const t = (example.period * i) / SERIES_SAMPLES;
    fixedSeries[i] = example.density(...example.fixedPoint, t);
    riderSeries[i] = example.density(...example.flow(example.riderStart, t), t);
  }
  const seriesMax = 1.15 * Math.max(...fixedSeries, ...riderSeries);
  return { example, starts, highlighted, fixedSeries, riderSeries, seriesMax };
}

/**
 * Calls `draw` once per periodic image of the example's bounds that overlaps the
 * visible range, by shifting the camera. Without a periodic coordinate, it is called once.
 */
function forEachImage(view: View, example: PhaseExample, draw: () => void): void {
  const period = example.qPeriod;
  if (!period) {
    draw();
    return;
  }
  const { xMin, xMax } = view.visible();
  const first = Math.ceil((xMin - example.bounds.xMax) / period);
  const last = Math.floor((xMax - example.bounds.xMin) / period);
  const original = view.offset;
  for (let k = first; k <= last; k++) {
    view.offset = [original[0] - k * period, original[1]];
    draw();
  }
  view.offset = original;
}

/** Plots both measured densities over one loop, highlighting the part up to time t. */
function drawSeries(
  canvas: HTMLCanvasElement,
  loaded: LoadedExample,
  t: number,
  palette: Palette,
): void {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (width === 0 || height === 0) return;
  const ctx = canvas.getContext("2d")!;
  const ratio = window.devicePixelRatio || 1;
  if (canvas.width !== Math.round(width * ratio)) canvas.width = Math.round(width * ratio);
  if (canvas.height !== Math.round(height * ratio)) canvas.height = Math.round(height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  ctx.clearRect(0, 0, width, height);

  const margin = { left: 30, right: 14, top: 16, bottom: 26 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (i: number) => margin.left + (plotWidth * i) / SERIES_SAMPLES;
  const y = (value: number) => margin.top + plotHeight * (1 - value / loaded.seriesMax);

  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top - 6);
  ctx.lineTo(margin.left, margin.top + plotHeight);
  ctx.lineTo(margin.left + plotWidth + 6, margin.top + plotHeight);
  ctx.stroke();
  ctx.font = MATH_FONT;
  ctx.fillStyle = palette.muted;
  ctx.textBaseline = "middle";
  ctx.textAlign = "right";
  ctx.fillText("ρ", margin.left - 9, margin.top + 2);
  ctx.textAlign = "right";
  ctx.textBaseline = "top";
  ctx.fillText("t", margin.left + plotWidth + 6, margin.top + plotHeight + 5);

  const progress = t / loaded.example.period;
  const current = Math.min(SERIES_SAMPLES, Math.round(progress * SERIES_SAMPLES));
  const curves: [Float64Array, string][] = [
    [loaded.fixedSeries, palette.fixed],
    [loaded.riderSeries, palette.accent],
  ];
  // Whole loop faintly, the part up to time t on top.
  const passes = [[0, SERIES_SAMPLES, 0.22, 1.5], [0, current, 1, 2.25]];
  for (const [series, color] of curves) {
    ctx.strokeStyle = color;
    ctx.lineJoin = "round";
    for (const [from, to, alpha, lineWidth] of passes) {
      ctx.globalAlpha = alpha;
      ctx.lineWidth = lineWidth;
      ctx.beginPath();
      for (let i = from; i <= to; i++) ctx.lineTo(x(i), y(series[i]));
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(current), y(series[current]), 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}

/**
 * The four combinations of dρ/dt and ∂ρ/∂t being zero or not. Selecting a cell of the
 * matrix loads an example into a phase-space lab with two observers: one standing
 * still at a fixed point (∂ρ/∂t) and one riding along with a copy (dρ/dt). The
 * camera can stand still or ride along, and a plot shows what both observers measure.
 */
export function mountDerivatives(root: HTMLElement): void {
  const phaseCanvas = root.querySelector<HTMLCanvasElement>("[data-canvas='phase']")!;
  const seriesCanvas = root.querySelector<HTMLCanvasElement>("[data-canvas='series']")!;
  const fixedOutput = root.querySelector<HTMLOutputElement>("[data-output='fixed']")!;
  const riderOutput = root.querySelector<HTMLOutputElement>("[data-output='rider']")!;
  const explanations = [...root.querySelectorAll<HTMLElement>("[data-explains]")];
  const palette = readPalette(root);

  const exampleButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-example]")];
  const initialId = root.querySelector<HTMLElement>("[data-example][aria-pressed='true']")!
    .dataset.example!;
  let loaded = loadExample(initialId);
  const view = new View(phaseCanvas, loaded.example.bounds);
  const copies: PointCloud = createCloud(COPY_COUNT);
  let rider: Point = loaded.example.riderStart;
  let ridingAlong = false;

  const animation: Animation = {
    get period() {
      return loaded.example.period;
    },
    get speed() {
      return loaded.example.speed;
    },
    reset() {},
    update(t) {
      const { example, starts } = loaded;
      starts.forEach((start, i) => {
        [copies.x[i], copies.y[i]] = example.flow(start, t);
        if (example.qPeriod) copies.x[i] = wrapToBounds(copies.x[i], example);
      });
      rider = example.flow(example.riderStart, t);
    },
    draw(t) {
      const { example, highlighted } = loaded;
      const { xMin, xMax, yMin, yMax } = example.bounds;
      const frameCenter: Point = [(xMin + xMax) / 2, (yMin + yMax) / 2];
      view.offset = ridingAlong ? [rider[0] - frameCenter[0], rider[1] - frameCenter[1]] : [0, 0];
      if (!view.begin()) return;

      drawDensity(view, (q, p) => example.density(q, p, t), example.densityScale, palette.density);
      drawAxes(view, palette.muted, ["q", "p"]);
      forEachImage(view, example, () => {
        view.ctx.globalAlpha = 0.6;
        drawDots(view, copies, 1.3, palette.ink, i => !highlighted[i]);
        view.ctx.globalAlpha = 1;
        drawDots(view, copies, 1.6, palette.paper, i => highlighted[i] === 1);
        drawRing(view, ...example.fixedPoint, OBSERVER_RADIUS, palette.fixed, 2.25, palette.paper);
      });
      drawRing(view, ...rider, OBSERVER_RADIUS, palette.accent, 2.25, palette.paper);
      view.ctx.fillStyle = palette.ink;
      view.ctx.beginPath();
      view.ctx.arc(view.screenX(rider[0]), view.screenY(rider[1]), 2.5, 0, 2 * Math.PI);
      view.ctx.fill();

      drawSeries(seriesCanvas, loaded, t, palette);
      setText(fixedOutput, example.density(...example.fixedPoint, t).toFixed(3));
      setText(riderOutput, example.density(...rider, t).toFixed(3));
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);
  bindChoice([...root.querySelectorAll<HTMLButtonElement>("[data-camera]")], "camera", (camera) => {
    ridingAlong = camera === "ride";
    clock.redraw();
  });
  const phaseLabel = phaseCanvas.getAttribute("aria-label") ?? "";
  bindChoice(exampleButtons, "example", (id) => {
    const button = exampleButtons.find(b => b.dataset.example === id)!;
    phaseCanvas.setAttribute("aria-label", `${phaseLabel} Example: ${button.getAttribute("aria-label")!}.`);
    loaded = loadExample(id);
    view.bounds = loaded.example.bounds;
    explanations.forEach(element => (element.hidden = element.dataset.explains !== id));
    clock.restart();
  });
}

/** Maps a periodic coordinate q back into the example's bounds. */
function wrapToBounds(q: number, example: PhaseExample): number {
  const period = example.qPeriod ?? Infinity;
  const { xMin } = example.bounds;
  return ((((q - xMin) % period) + period) % period) + xMin;
}
