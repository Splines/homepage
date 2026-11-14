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
