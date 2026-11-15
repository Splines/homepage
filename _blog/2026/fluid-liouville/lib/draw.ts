import type { Palette } from "./palette";
import type { Point, View } from "./view";

/* ------------------------------------------------------------- shapes */

/** Fills a disk with a radius in CSS pixels at every point. */
export function drawDots(view: View, points: Point[], radius: number, color: string): void {
  const { ctx } = view;
  ctx.fillStyle = color;
  ctx.beginPath();
  for (const [x, y] of points) {
    const px = view.screenX(x);
    const py = view.screenY(y);
    ctx.moveTo(px + radius, py);
    ctx.arc(px, py, radius, 0, 2 * Math.PI);
  }
  ctx.fill();
}

/**
 * Like {@link drawDots}, for dense clouds of particles: the radius is meant for a canvas
 * of 640 px width and shrinks a bit on smaller canvases, so that clouds do not turn into
 * blots on phones.
 */
export function drawCloud(view: View, points: Point[], radius: number, color: string): void {
  drawDots(view, points, radius * Math.min(1, Math.max(0.65, view.width / 640)), color);
}

/** Makes the polyline through `points` the current path. */
export function tracePath(view: View, points: Point[], closed: boolean): void {
  const { ctx } = view;
  ctx.beginPath();
  for (const [x, y] of points) ctx.lineTo(view.screenX(x), view.screenY(y));
  if (closed) ctx.closePath();
}

/** Makes a circle with a radius in world units the current path. */
export function traceCircle(view: View, [x, y]: Point, radius: number): void {
  view.ctx.beginPath();
  view.ctx.arc(view.screenX(x), view.screenY(y), radius * view.scale, 0, 2 * Math.PI);
}

/** Fills the current path translucently and strokes its outline: the look of a region. */
export function paintRegion(
  ctx: CanvasRenderingContext2D,
  color: string,
  fillAlpha = 0.14,
  lineWidth = 1.5,
): void {
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * fillAlpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Strokes the current path, on top of a wider `halo` that keeps it visible on busy ground. */
function strokeWithHalo(
  ctx: CanvasRenderingContext2D,
  color: string,
  lineWidth: number,
  halo?: string,
): void {
  if (halo) {
    ctx.strokeStyle = halo;
    ctx.lineWidth = lineWidth + 3;
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Strokes a circle with a radius in CSS pixels, e.g. around a particle. */
export function drawRing(
  view: View,
  [x, y]: Point,
  radius: number,
  color: string,
  lineWidth: number,
  halo?: string,
): void {
  view.ctx.beginPath();
  view.ctx.arc(view.screenX(x), view.screenY(y), radius, 0, 2 * Math.PI);
  strokeWithHalo(view.ctx, color, lineWidth, halo);
}

const TARGET_RADIUS = 11;
const TARGET_TICK = 5;
/** How far the target reaches out from its center, in CSS pixels. */
export const TARGET_REACH = TARGET_RADIUS + TARGET_TICK;

/**
 * Marks a point fixed in space (the Eulerian observer): a ring with short ticks pointing
 * at it from all four sides.
 */
export function drawTarget(
  view: View,
  [x, y]: Point,
  color: string,
  lineWidth: number,
  halo?: string,
): void {
  const { ctx } = view;
  const cx = view.screenX(x);
  const cy = view.screenY(y);
  ctx.beginPath();
  ctx.moveTo(cx + TARGET_RADIUS, cy);
  ctx.arc(cx, cy, TARGET_RADIUS, 0, 2 * Math.PI);
  for (const [ux, uy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    ctx.moveTo(cx + ux * TARGET_RADIUS, cy + uy * TARGET_RADIUS);
    ctx.lineTo(cx + ux * TARGET_REACH, cy + uy * TARGET_REACH);
  }
  strokeWithHalo(ctx, color, lineWidth, halo);
}

/**
 * Draws a line from (x0, y0) to (x1, y1) in CSS pixels with an arrowhead at its end,
 * in the current stroke and fill style.
 */
export function drawArrow(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size = 7,
): void {
  const angle = Math.atan2(y1 - y0, x1 - x0);
  const head = Math.min(size, Math.hypot(x1 - x0, y1 - y0));
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1 - 0.9 * head * Math.cos(angle), y1 - 0.9 * head * Math.sin(angle));
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - head * Math.cos(angle - 0.4), y1 - head * Math.sin(angle - 0.4));
  ctx.lineTo(x1 - head * Math.cos(angle + 0.4), y1 - head * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

/* --------------------------------------------------------------- text */

/** Fonts for text and formulas, the latter matching the KaTeX math on the page. */
const FONTS = {
  text: (size: number) => `${size}px Rethink, sans-serif`,
  upright: (size: number) => `${size}px KaTeX_Main, "Vermiglione", serif`,
  italic: (size: number) => `italic ${size}px KaTeX_Math, "Vermiglione", serif`,
  boldItalic: (size: number) => `italic bold ${size}px KaTeX_Math, "Vermiglione", serif`,
};

/** A piece of text and the font it is set in, e.g. a bold vector or an upright digit. */
export type TextRun = [text: string, font: keyof typeof FONTS];

export interface TextOptions {
  color: string;
  /** Drawn wider underneath the text, which keeps it readable on top of other marks. */
  halo?: string;
  /** Which end of the text the anchor point is. */
  align?: "left" | "center" | "right";
  /** Font size in CSS pixels. */
  size?: number;
  /**
   * Draws only the halo or only the text, so that other marks can go in between:
   * they are not hidden by the halo but do not cover the text either.
   */
  layer?: "halo" | "text" | "both";
}

const ALIGN = { left: 0, center: 0.5, right: 1 };

/** Font size of formulas next to marks: a bit smaller on narrow canvases. */
export function formulaSize(view: View): number {
  return view.width < 560 ? 16 : 19;
}

/** Widths in CSS pixels of the runs set at the given font size. */
function measureRuns(view: View, runs: TextRun[], size: number): number[] {
  return runs.map(([text, font]) => {
    view.ctx.font = FONTS[font](size);
    return view.ctx.measureText(text).width;
  });
}

/** Width in CSS pixels of a text set at the given font size. */
export function measureText(view: View, runs: TextRun[], size = 16): number {
  return measureRuns(view, runs, size).reduce((sum, width) => sum + width, 0);
}

/**
 * Draws a text made of runs in different fonts, vertically centered at (x, y) in CSS
 * pixels and kept inside the canvas.
 */
export function drawText(
  view: View,
  runs: TextRun[],
  x: number,
  y: number,
  options: TextOptions,
): void {
  const { color, halo, align = "center", size = 16, layer = "both" } = options;
  const { ctx } = view;
  const widths = measureRuns(view, runs, size);
  const total = widths.reduce((sum, width) => sum + width, 0);
  const margin = 6;
  const left = clamp(x - ALIGN[align] * total, margin, view.width - margin - total);
  const middle = clamp(y, margin + size / 2, view.height - margin - size / 2);

  const paint = (stroke: boolean) => {
    let at = left;
    runs.forEach(([text, font], i) => {
      ctx.font = FONTS[font](size);
      if (stroke) ctx.strokeText(text, at, middle);
      else ctx.fillText(text, at, middle);
      at += widths[i];
    });
  };
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // All halos first, so that no halo covers a neighboring run.
  if (halo && layer !== "text") {
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = halo;
    paint(true);
  }
  if (layer !== "halo") {
    ctx.fillStyle = color;
    paint(false);
  }
}

/** Writes a small title like "Phase space" into the bottom-right corner. */
export function drawCornerTitle(view: View, title: string, palette: Palette): void {
  drawText(view, [[title, "text"]], view.width - 16, view.height - 19, {
    color: palette.text,
    align: "right",
    size: 15,
  });
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/* -------------------------------------------------------------- charts */

/** Draws thin axes q and p through the origin of a phase space. */
export function drawPhaseAxes(view: View, palette: Palette): void {
  const { ctx, width, height } = view;
  const ox = view.screenX(0);
  const oy = view.screenY(0);
  ctx.strokeStyle = palette.muted;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(width, oy);
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, height);
  ctx.stroke();

  drawText(view, [["q", "italic"]], width - 8, oy - 11, { color: palette.muted, align: "right" });
  drawText(view, [["p", "italic"]], ox + 7, 14, { color: palette.muted, align: "left" });
}

/** Rectangle in CSS pixels. */
export interface Box {
  left: number;
  top: number;
  right: number;
  bottom: number;
}

/** Values of a quantity sampled evenly over one loop, and the color to plot them in. */
export interface Series {
  values: ArrayLike<number>;
  color: string;
}

/**
 * Plots series over one loop into `box`, with arrows as axes labeled `yLabel` and t. Each
 * series is drawn faintly for the whole loop and solid up to `progress`, ending in a dot.
 */
export function drawPlot(
  view: View,
  box: Box,
  series: Series[],
  max: number,
  progress: number,
  yLabel: TextRun[],
  palette: Palette,
): void {
  const { ctx } = view;
  const axisTop = box.top - 14;
  const axisRight = box.right + 10;
  ctx.strokeStyle = palette.muted;
  ctx.fillStyle = palette.muted;
  ctx.lineWidth = 1;
  drawArrow(ctx, box.left, box.bottom, box.left, axisTop);
  drawArrow(ctx, box.left, box.bottom, axisRight, box.bottom);
  const label = { color: palette.text, align: "left", size: 15 } as const;
  drawText(view, yLabel, box.left + 10, axisTop + 2, label);
  drawText(view, [["t", "italic"]], axisRight + 7, box.bottom, label);

  ctx.lineJoin = "round";
  for (const { values, color } of series) {
    const last = values.length - 1;
    const x = (i: number) => box.left + ((box.right - box.left) * i) / last;
    const y = (i: number) => box.bottom - ((box.bottom - box.top) * values[i]) / max;
    const trace = (until: number) => {
      ctx.beginPath();
      for (let i = 0; i <= until; i++) ctx.lineTo(x(i), y(i));
    };
    const current = Math.min(last, Math.round(progress * last));

    ctx.strokeStyle = color;
    ctx.globalAlpha = 0.22;
    ctx.lineWidth = 1.5;
    trace(last);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.lineWidth = 2.25;
    trace(current);
    ctx.stroke();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x(current), y(current), 3.5, 0, 2 * Math.PI);
    ctx.fill();
  }
}
