import { Clock, type Animation } from "../lib/clock";
import { bindChoice, bindPlayButton, bindTimeSlider } from "../lib/controls";
import {
  MATH_FONT,
  createCloud,
  drawArrow,
  drawAxes,
  drawDensity,
  drawDots,
  drawRing,
  drawTarget,
  type PointCloud,
} from "../lib/draw";
import { readPalette, type Palette } from "../lib/palette";
import { createRandom } from "../lib/random";
import { View, type Point } from "../lib/view";
import { EXAMPLES, type PhaseExample } from "./examples";

const COPY_COUNT = 900;
const SERIES_SAMPLES = 400;
/** Radius of the ring around the copy that the observer rides along with. */
const RIDER_RADIUS = 9;

/** An example with everything that only depends on the example, computed once on selection. */
interface LoadedExample {
  example: PhaseExample;
  starts: Point[];
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

  const fixedSeries = new Float64Array(SERIES_SAMPLES + 1);
  const riderSeries = new Float64Array(SERIES_SAMPLES + 1);
  for (let i = 0; i <= SERIES_SAMPLES; i++) {
    const t = (example.period * i) / SERIES_SAMPLES;
    fixedSeries[i] = example.density(...example.fixedPoint, t);
    riderSeries[i] = example.density(...example.flow(example.riderStart, t), t);
  }
  const seriesMax = 1.1 * Math.max(...fixedSeries, ...riderSeries);
  return { example, starts, fixedSeries, riderSeries, seriesMax };
}

/** Text next to the plot, e.g. its legend. */
const PLOT_FONT = "14px Rethink, sans-serif";

/**
 * Plots both measured densities over one loop: the whole loop faintly, the part up to
 * time t solid. A legend above the plot names the two observers.
 */
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

  const margin = { left: 22, right: 28, top: 44, bottom: 20 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (i: number) => margin.left + (plotWidth * i) / SERIES_SAMPLES;
  const y = (value: number) => margin.top + plotHeight * (1 - value / loaded.seriesMax);

  // Axes with arrowheads, ρ at the tip of the vertical one, t after the horizontal one.
  const originX = margin.left;
  const originY = margin.top + plotHeight;
  const axisTop = margin.top - 14;
  const axisRight = margin.left + plotWidth + 10;
  ctx.strokeStyle = palette.muted;
  ctx.fillStyle = palette.muted;
  ctx.lineWidth = 1;
  drawArrow(ctx, originX, originY, originX, axisTop);
  drawArrow(ctx, originX, originY, axisRight, originY);
  ctx.font = MATH_FONT;
  ctx.fillStyle = palette.text;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("ρ", originX + 9, axisTop + 2);
  ctx.fillText("t", axisRight + 6, originY);

  const progress = t / loaded.example.period;
  const current = Math.min(SERIES_SAMPLES, Math.round(progress * SERIES_SAMPLES));
  const curves: [Float64Array, string, string][] = [
    [loaded.fixedSeries, palette.fixed, "Standing still"],
    [loaded.riderSeries, palette.accent, "Riding along"],
  ];
  ctx.lineJoin = "round";
  for (const [series, color] of curves) {
    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i <= SERIES_SAMPLES; i++) ctx.lineTo(x(i), y(series[i]));
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    for (let i = 0; i <= current; i++) ctx.lineTo(x(i), y(series[i]));
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(current), y(series[current]), 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }

  // Legend, right-aligned in the row above the plot.
  ctx.font = PLOT_FONT;
  ctx.textAlign = "left";
  const swatch = 16;
  const gap = 6;
  const spacing = 16;
  const entryWidths = curves.map(([, , label]) => swatch + gap + ctx.measureText(label).width);
  let left = width - 10 - entryWidths.reduce((sum, w) => sum + w, 0) - spacing;
  const legendY = 16;
  curves.forEach(([, color, label], i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    ctx.moveTo(left, legendY);
    ctx.lineTo(left + swatch, legendY);
    ctx.stroke();
    ctx.fillStyle = palette.text;
    ctx.fillText(label, left + swatch + gap, legendY);
    left += entryWidths[i] + spacing;
  });
}

/**
 * The four combinations of dρ/dt and ∂ρ/∂t being zero or not. Selecting a cell of the
 * matrix loads an example into a phase-space lab with two observers: one standing
 * still at a fixed point (∂ρ/∂t) and one riding along with a copy (dρ/dt). A plot
 * shows what both observers measure, and a slider sets the time.
 */
export function mountDerivatives(root: HTMLElement): void {
  const phaseCanvas = root.querySelector<HTMLCanvasElement>("[data-canvas='phase']")!;
  const seriesCanvas = root.querySelector<HTMLCanvasElement>("[data-canvas='series']")!;
  const slider = root.querySelector<HTMLInputElement>("input[type='range']")!;
  const explanations = [...root.querySelectorAll<HTMLElement>("[data-explains]")];
  const palette = readPalette(root);

  const exampleButtons = [...root.querySelectorAll<HTMLButtonElement>("[data-example]")];
  const initialId = root.querySelector<HTMLElement>("[data-example][aria-pressed='true']")!
    .dataset.example!;
  let loaded = loadExample(initialId);
  const view = new View(phaseCanvas, loaded.example.bounds);
  const copies: PointCloud = createCloud(COPY_COUNT);
  let rider: Point = loaded.example.riderStart;

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
      if (example.qPeriod) rider = [wrapToBounds(rider[0], example), rider[1]];
    },
    draw(t) {
      const { example } = loaded;
      slider.value = String(t / example.period);
      drawSeries(seriesCanvas, loaded, t, palette);
      if (!view.begin()) return;

      drawDensity(view, (q, p) => example.density(q, p, t), example.densityScale, palette.density);
      drawAxes(view, palette.muted, ["q", "p"]);
      view.ctx.globalAlpha = 0.6;
      drawDots(view, copies, 1.3, palette.ink);
      view.ctx.globalAlpha = 1;
      drawTarget(view, ...example.fixedPoint, palette.fixed, 2.25, palette.paper);
      drawRing(view, ...rider, RIDER_RADIUS, palette.accent, 2.25, palette.paper);
      view.ctx.fillStyle = palette.ink;
      view.ctx.beginPath();
      view.ctx.arc(view.screenX(rider[0]), view.screenY(rider[1]), 2.5, 0, 2 * Math.PI);
      view.ctx.fill();
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);
  bindTimeSlider(slider, clock);
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
