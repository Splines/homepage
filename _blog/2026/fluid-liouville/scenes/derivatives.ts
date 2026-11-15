import {
  drawCloud,
  drawDots,
  drawPhaseAxes,
  drawPlot,
  drawRing,
  drawTarget,
  drawText,
  measureText,
  type Series,
  type TextRun,
} from "../lib/draw";
import { readPalette, type Palette } from "../lib/palette";
import { createRandom } from "../lib/random";
import { Timeline, bindChoice } from "../lib/timeline";
import { View, type Point } from "../lib/view";
import { EXAMPLES, type PhaseExample } from "./examples";

const COPY_COUNT = 900;
const SERIES_SAMPLES = 400;
/** Radius of the ring around the copy that the observer rides along with. */
const RIDER_RADIUS = 9;
/** Margins in CSS pixels around the plot of the measured densities. */
const PLOT_MARGIN = { left: 22, right: 28, top: 44, bottom: 20 };

/** An example with everything that only depends on the example, computed once on selection. */
interface LoadedExample {
  example: PhaseExample;
  starts: Point[];
  /** ρ measured by the observer standing still, sampled over one loop. */
  fixedSeries: number[];
  /** ρ measured by the observer riding along, sampled over one loop. */
  riderSeries: number[];
  seriesMax: number;
}

function loadExample(id: string): LoadedExample {
  const example = EXAMPLES[id]();
  const random = createRandom(23);
  const starts = Array.from({ length: COPY_COUNT }, () => example.sample(random));
  const times = Array.from({ length: SERIES_SAMPLES + 1 }, (_, i) =>
    (example.period * i) / SERIES_SAMPLES);
  const fixedSeries = times.map(t => example.density(...example.fixedPoint, t));
  const riderSeries = times.map(t => example.density(...example.flow(example.riderStart, t), t));
  const seriesMax = 1.1 * Math.max(...fixedSeries, ...riderSeries);
  return { example, starts, fixedSeries, riderSeries, seriesMax };
}

/** Maps a periodic coordinate q back into the example's bounds. */
function wrap([q, p]: Point, example: PhaseExample): Point {
  if (!example.qPeriod) return [q, p];
  const period = example.qPeriod;
  const { xMin } = example.bounds;
  return [((((q - xMin) % period) + period) % period) + xMin, p];
}

const densityCanvas = document.createElement("canvas");
const densityContext = densityCanvas.getContext("2d")!;

/**
 * Paints a density field as a translucent wash whose opacity grows with
 * `density / max`. The field is sampled at a coarse resolution and smoothed when
 * scaled up, which is plenty for smooth densities and cheap enough for every frame.
 */
function drawDensity(
  view: View,
  density: (x: number, y: number) => number,
  max: number,
  hexColor: string,
): void {
  const pixelsPerSample = 4;
  const columns = Math.max(1, Math.round(view.width / pixelsPerSample));
  const rows = Math.max(1, Math.round(view.height / pixelsPerSample));
  densityCanvas.width = columns;
  densityCanvas.height = rows;
  const image = densityContext.createImageData(columns, rows);
  const rgb = parseInt(hexColor.slice(1), 16);
  for (let row = 0; row < rows; row++) {
    const y = view.worldY(((row + 0.5) / rows) * view.height);
    for (let column = 0; column < columns; column++) {
      const x = view.worldX(((column + 0.5) / columns) * view.width);
      const level = Math.min(1, density(x, y) / max);
      const k = 4 * (row * columns + column);
      image.data[k] = (rgb >> 16) & 255;
      image.data[k + 1] = (rgb >> 8) & 255;
      image.data[k + 2] = rgb & 255;
      image.data[k + 3] = Math.round(200 * Math.sqrt(level));
    }
  }
  densityContext.putImageData(image, 0, 0);
  view.ctx.imageSmoothingEnabled = true;
  view.ctx.drawImage(densityCanvas, 0, 0, view.width, view.height);
}

/** A legend for the series, right-aligned in the row above the plot. */
function drawLegend(view: View, series: Series[], labels: string[], palette: Palette): void {
  const { ctx } = view;
  const swatch = 16;
  const gap = 6;
  const spacing = 16;
  const size = 14;
  const runs = labels.map((label): TextRun[] => [[label, "text"]]);
  const widths = runs.map(run => swatch + gap + measureText(view, run, size));
  let left = view.width - 10 - widths.reduce((sum, width) => sum + width, 0) - spacing;
  const y = 16;
  series.forEach(({ color }, i) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.25;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + swatch, y);
    ctx.stroke();
    drawText(view, runs[i], left + swatch + gap, y, { color: palette.text, align: "left", size });
    left += widths[i] + spacing;
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
  const explanations = [...root.querySelectorAll<HTMLElement>("[data-explains]")];
  const palette = readPalette(root);

  const initialId = root.querySelector<HTMLElement>("[data-example][aria-pressed='true']")!
    .dataset.example!;
  let loaded = loadExample(initialId);
  const phase = new View(phaseCanvas, loaded.example.bounds);
  // The plot is laid out in CSS pixels, so the bounds do not matter.
  const plot = new View(root.querySelector<HTMLCanvasElement>("[data-canvas='series']")!, {
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 1,
  });
  const loopSeconds = ({ period, speed }: PhaseExample) => period / speed;

  const timeline = new Timeline(root, (progress) => {
    const { example, starts } = loaded;
    const t = progress * example.period;

    if (plot.begin()) {
      const series = [
        { values: loaded.fixedSeries, color: palette.fixed },
        { values: loaded.riderSeries, color: palette.accent },
      ];
      const box = {
        left: PLOT_MARGIN.left,
        top: PLOT_MARGIN.top,
        right: plot.width - PLOT_MARGIN.right,
        bottom: plot.height - PLOT_MARGIN.bottom,
      };
      drawPlot(plot, box, series, loaded.seriesMax, progress, [["ρ", "italic"]], palette);
      drawLegend(plot, series, ["Standing still", "Riding along"], palette);
    }

    if (!phase.begin()) return;
    drawDensity(phase, (q, p) => example.density(q, p, t), example.densityScale, palette.density);
    drawPhaseAxes(phase, palette);
    phase.ctx.globalAlpha = 0.6;
    drawCloud(phase, starts.map(start => wrap(example.flow(start, t), example)), 1.3, palette.ink);
    phase.ctx.globalAlpha = 1;
    const rider = wrap(example.flow(example.riderStart, t), example);
    drawTarget(phase, example.fixedPoint, palette.fixed, 2.25, palette.paper);
    drawRing(phase, rider, RIDER_RADIUS, palette.accent, 2.25, palette.paper);
    drawDots(phase, [rider], 2.5, palette.ink);
  }, loopSeconds(loaded.example));

  const phaseLabel = phaseCanvas.getAttribute("aria-label") ?? "";
  bindChoice(root, "example", (id, button) => {
    phaseCanvas.setAttribute("aria-label", `${phaseLabel} Example: ${button.getAttribute("aria-label")!}.`);
    loaded = loadExample(id);
    phase.bounds = loaded.example.bounds;
    timeline.seconds = loopSeconds(loaded.example);
    explanations.forEach(element => (element.hidden = element.dataset.explains !== id));
    timeline.restart();
  });
}
