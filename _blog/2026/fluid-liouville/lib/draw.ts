import type { RGB } from "./palette";
import type { View } from "./view";

/** Many points stored as separate coordinate arrays. */
export interface PointCloud {
  x: Float64Array;
  y: Float64Array;
}

/** Creates a point cloud with room for `count` points. */
export function createCloud(count: number): PointCloud {
  return { x: new Float64Array(count), y: new Float64Array(count) };
}

/** Font for symbols like q, p or V(t), matching the KaTeX math on the page. */
export const MATH_FONT = "italic 16px KaTeX_Math, \"Vermiglione\", serif";

/**
 * Fills a small disk at every point for which `include` holds. The radius is given in
 * CSS pixels for a canvas of 640 px width and shrinks a bit on smaller canvases, so
 * that dense clouds do not turn into blots on phones.
 */
export function drawDots(
  view: View,
  cloud: PointCloud,
  radius: number,
  color: string,
  include: (index: number) => boolean = () => true,
): void {
  const { ctx } = view;
  const r = radius * Math.min(1, Math.max(0.65, view.width / 640));
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < cloud.x.length; i++) {
    if (!include(i)) continue;
    const px = view.screenX(cloud.x[i]);
    const py = view.screenY(cloud.y[i]);
    ctx.moveTo(px + r, py);
    ctx.arc(px, py, r, 0, 2 * Math.PI);
  }
  ctx.fill();
}

/** Makes the polyline through the first `count` points the current path. */
export function tracePolyline(
  view: View,
  cloud: PointCloud,
  closed: boolean,
  count = cloud.x.length,
): void {
  const { ctx } = view;
  ctx.beginPath();
  for (let i = 0; i < count; i++) {
    ctx.lineTo(view.screenX(cloud.x[i]), view.screenY(cloud.y[i]));
  }
  if (closed) ctx.closePath();
}

/**
 * Strokes a circle with a radius given in CSS pixels. A `halo` color is drawn wider
 * underneath, which keeps the ring visible on top of a busy background.
 */
export function drawRing(
  view: View,
  x: number,
  y: number,
  radius: number,
  color: string,
  lineWidth = 1.5,
  halo?: string,
): void {
  const { ctx } = view;
  ctx.beginPath();
  ctx.arc(view.screenX(x), view.screenY(y), radius, 0, 2 * Math.PI);
  if (halo) {
    ctx.strokeStyle = halo;
    ctx.lineWidth = lineWidth + 3;
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Radius of the target that marks a point fixed in space, in CSS pixels. */
export const TARGET_RADIUS = 11;
/** Length of the ticks that point at the target's ring from outside, in CSS pixels. */
export const TARGET_TICK = 5;

/**
 * Marks a point fixed in space (the Eulerian observer): a ring with short ticks pointing
 * at it from all four sides. A `halo` color is drawn wider underneath, as for `drawRing`.
 */
export function drawTarget(
  view: View,
  x: number,
  y: number,
  color: string,
  lineWidth = 2,
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
    ctx.lineTo(cx + ux * (TARGET_RADIUS + TARGET_TICK), cy + uy * (TARGET_RADIUS + TARGET_TICK));
  }
  if (halo) {
    ctx.strokeStyle = halo;
    ctx.lineWidth = lineWidth + 3;
    ctx.stroke();
  }
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();
}

/** Draws `text` in the math font, anchored at a world point and shifted by (dx, dy) pixels. */
export function drawLabel(
  view: View,
  text: string,
  x: number,
  y: number,
  color: string,
  dx = 0,
  dy = 0,
  align: CanvasTextAlign = "center",
): void {
  const { ctx } = view;
  ctx.font = MATH_FONT;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(text, view.screenX(x) + dx, view.screenY(y) + dy);
}

/** KaTeX font styles for formulas set from several runs, e.g. bold vectors and upright digits. */
const FORMULA_FONTS = {
  upright: (size: number) => `${size}px KaTeX_Main, "Vermiglione", serif`,
  italic: (size: number) => `italic ${size}px KaTeX_Math, "Vermiglione", serif`,
  boldItalic: (size: number) => `italic bold ${size}px KaTeX_Math, "Vermiglione", serif`,
};

/** A piece of a formula and the style it is set in. */
export type MathRun = [text: string, style: keyof typeof FORMULA_FONTS];

export interface FormulaOptions {
  color: string;
  /** Drawn wider underneath the text, which keeps it readable on top of other marks. */
  halo: string;
  /** Shift in CSS pixels from the anchor point. */
  dx?: number;
  dy?: number;
  /** Whether the anchor is the center or the left end of the formula. */
  align?: "center" | "left";
  /** Font size in CSS pixels. */
  size?: number;
  /**
   * Draws only the halo or only the text, so that other marks can go in between:
   * they are not hidden by the halo but do not cover the text either.
   */
  layer?: "halo" | "text" | "both";
}

/** Font size of formulas next to marks: a bit smaller on narrow canvases. */
export function formulaSize(view: View): number {
  return view.width < 560 ? 16 : 19;
}

/** Width in CSS pixels of a formula set at the given font size. */
export function measureFormula(view: View, runs: MathRun[], size = 16): number {
  const { ctx } = view;
  return runs.reduce((sum, [text, style]) => {
    ctx.font = FORMULA_FONTS[style](size);
    return sum + ctx.measureText(text).width;
  }, 0);
}

/**
 * Draws a formula made of runs in different fonts at a world point, kept inside the canvas.
 */
export function drawFormula(
  view: View,
  runs: MathRun[],
  x: number,
  y: number,
  options: FormulaOptions,
): void {
  const { color, halo, dx = 0, dy = 0, align = "center", size = 16, layer = "both" } = options;
  const { ctx } = view;
  const fonts = runs.map(([, style]) => FORMULA_FONTS[style](size));
  const widths = runs.map(([text], i) => {
    ctx.font = fonts[i];
    return ctx.measureText(text).width;
  });
  const total = widths.reduce((sum, width) => sum + width, 0);
  const margin = 6;
  let left = view.screenX(x) + dx - (align === "center" ? total / 2 : 0);
  left = Math.max(margin, Math.min(view.width - margin - total, left));
  const halfHeight = margin + size / 2;
  const baseline = Math.max(halfHeight, Math.min(view.height - halfHeight, view.screenY(y) + dy));
  const starts = widths.map((width) => {
    const start = left;
    left += width;
    return start;
  });

  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  // All halos first, so that no halo covers a neighboring run.
  if (layer !== "text") {
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    ctx.strokeStyle = halo;
    runs.forEach(([text], i) => {
      ctx.font = fonts[i];
      ctx.strokeText(text, starts[i], baseline);
    });
  }
  if (layer !== "halo") {
    ctx.fillStyle = color;
    runs.forEach(([text], i) => {
      ctx.font = fonts[i];
      ctx.fillText(text, starts[i], baseline);
    });
  }
}

/**
 * Draws a line from (x0, y0) to (x1, y1) in screen coordinates with an arrowhead at its
 * end, in the current stroke and fill style.
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
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1 - size * Math.cos(angle - 0.4), y1 - size * Math.sin(angle - 0.4));
  ctx.lineTo(x1 - size * Math.cos(angle + 0.4), y1 - size * Math.sin(angle + 0.4));
  ctx.closePath();
  ctx.fill();
}

/** Draws thin axes through the origin, labeled at their positive ends. */
export function drawAxes(view: View, color: string, labels: [string, string]): void {
  const { ctx, width, height } = view;
  const ox = view.screenX(0);
  const oy = view.screenY(0);
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, oy);
  ctx.lineTo(width, oy);
  ctx.moveTo(ox, 0);
  ctx.lineTo(ox, height);
  ctx.stroke();

  ctx.font = MATH_FONT;
  ctx.fillStyle = color;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "right";
  ctx.fillText(labels[0], width - 8, oy - 6);
  ctx.textAlign = "left";
  ctx.fillText(labels[1], ox + 7, 18);
}

const densityCanvas = document.createElement("canvas");
const densityContext = densityCanvas.getContext("2d")!;
let densityImage: ImageData | null = null;

/**
 * Paints a density field as a translucent wash of `color` whose opacity grows with
 * `density / max`. The field is sampled at a coarse resolution and smoothed when
 * scaled up, which is plenty for smooth densities and cheap enough for every frame.
 */
export function drawDensity(
  view: View,
  density: (x: number, y: number) => number,
  max: number,
  color: RGB,
  pixelsPerSample = 4,
): void {
  const columns = Math.max(1, Math.round(view.width / pixelsPerSample));
  const rows = Math.max(1, Math.round(view.height / pixelsPerSample));
  const ctx = densityContext;
  if (!densityImage || densityImage.width !== columns || densityImage.height !== rows) {
    densityCanvas.width = columns;
    densityCanvas.height = rows;
    densityImage = ctx.createImageData(columns, rows);
  }
  const image = densityImage;
  const { xMin, xMax, yMin, yMax } = view.visible();
  for (let row = 0; row < rows; row++) {
    const y = yMax - ((row + 0.5) / rows) * (yMax - yMin);
    for (let column = 0; column < columns; column++) {
      const x = xMin + ((column + 0.5) / columns) * (xMax - xMin);
      const level = Math.min(1, density(x, y) / max);
      const k = 4 * (row * columns + column);
      image.data[k] = color[0];
      image.data[k + 1] = color[1];
      image.data[k + 2] = color[2];
      image.data[k + 3] = Math.round(200 * Math.sqrt(level));
    }
  }
  ctx.putImageData(image, 0, 0);
  view.ctx.imageSmoothingEnabled = true;
  view.ctx.drawImage(densityCanvas, 0, 0, view.width, view.height);
}
