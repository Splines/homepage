import {
  drawCornerTitle,
  drawDots,
  drawRing,
  drawText,
  formulaSize,
  tracePath,
  type TextOptions,
  type TextRun,
} from "../lib/draw";
import { readPalette } from "../lib/palette";
import { Timeline } from "../lib/timeline";
import { View, type Point } from "../lib/view";
import { DOT_RADIUS, FRAME, SECONDS, flow } from "./drift";

/** Initial positions X of the particles. The first one is highlighted. */
const PARTICLES: Point[] = [
  [0.55, -0.06],
  [0.12, 0.24],
  [0.95, 0.25],
  [1.1, -0.22],
  [1.45, 0.04],
];
const HIGHLIGHT_RADIUS = 6;
const TRAIL_SAMPLES = 80;

/** "X = φ(X, 0)" */
const START_FORMULA: TextRun[] = [
  ["X", "boldItalic"],
  [" = ", "upright"],
  ["ϕ", "italic"],
  ["(", "upright"],
  ["X", "boldItalic"],
  [", 0)", "upright"],
];

/** "x = φ(X, t = …)" */
function currentFormula(t: number): TextRun[] {
  return [
    ["x", "boldItalic"],
    [" = ", "upright"],
    ["ϕ", "italic"],
    ["(", "upright"],
    ["X", "boldItalic"],
    [", ", "upright"],
    ["t", "italic"],
    [` = ${t.toFixed(2)})`, "upright"],
  ];
}

/**
 * Lagrangian description: a handful of fluid particles drifting along. One of them is
 * highlighted: its initial position X stays marked, and its trajectory φ(X, ·) is drawn
 * up to the current time, which the reader can also set with a slider.
 */
export function mountLagrangian(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const palette = readPalette(root);
  const start = PARTICLES[0];

  new Timeline(root, (t) => {
    if (!view.begin()) return;
    const { ctx } = view;
    const current = flow(start, t);
    const label: TextOptions = {
      color: palette.accent,
      halo: palette.paper,
      size: formulaSize(view),
    };
    // Labels are split around the marks, so that their halos hide no particle.
    const drawLabels = (layer: TextOptions["layer"]) => {
      const [startX, startY] = [view.screenX(start[0]), view.screenY(start[1])];
      drawText(view, START_FORMULA, startX, startY + 27, { ...label, layer });
      // The particle always moves to the right, so its trail never reaches this label.
      const [x, y] = [view.screenX(current[0]), view.screenY(current[1])];
      drawText(view, currentFormula(t), x + 9, y - 20, { ...label, layer, align: "left" });
    };
    drawLabels("halo");

    const trail = Array.from({ length: TRAIL_SAMPLES }, (_, k) =>
      flow(start, (t * k) / (TRAIL_SAMPLES - 1)));
    tracePath(view, trail, false);
    ctx.strokeStyle = palette.accent;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.globalAlpha = 1;

    drawRing(view, start, HIGHLIGHT_RADIUS - 1, palette.accent, 2, palette.paper);
    const others = PARTICLES.slice(1).map(particle => flow(particle, t));
    drawDots(view, others, DOT_RADIUS, palette.muted);
    drawDots(view, [current], HIGHLIGHT_RADIUS, palette.accent);

    drawLabels("text");
    drawCornerTitle(view, "Lagrangian description", palette);
  }, SECONDS);
}
