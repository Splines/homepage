import { drawFormula, drawRing, type FormulaOptions, type MathRun } from "../lib/draw";
import { readPalette } from "../lib/palette";
import { View, type Point } from "../lib/view";
import {
  DOT_RADIUS,
  FRAME,
  HIGHLIGHT_RADIUS,
  drawCornerTitle,
  drawDots,
  drawTrajectory,
  flow,
  formulaSize,
  playTimeline,
} from "./drift";

/** Initial positions X of the particles. The first one is highlighted. */
const PARTICLES: Point[] = [
  [0.55, -0.06],
  [0.12, 0.24],
  [0.95, 0.25],
  [1.1, -0.22],
  [1.45, 0.04],
];

/** "X = φ(X, 0)" */
const START_FORMULA: MathRun[] = [
  ["X", "boldItalic"],
  [" = ", "upright"],
  ["ϕ", "italic"],
  ["(", "upright"],
  ["X", "boldItalic"],
  [", 0)", "upright"],
];

/** "x = φ(X, t = …)" */
function currentFormula(t: number): MathRun[] {
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

  playTimeline(root, (t) => {
    if (!view.begin()) return;
    const [x, y] = flow(start, t);
    const label: FormulaOptions = {
      color: palette.accent,
      halo: palette.paper,
      size: formulaSize(view),
    };
    // Labels are split around the marks, so that their halos hide no particle.
    const drawLabels = (layer: FormulaOptions["layer"]) => {
      drawFormula(view, START_FORMULA, start[0], start[1], { ...label, layer, dy: 27 });
      // The particle always moves to the right, so its trail never reaches this label.
      drawFormula(view, currentFormula(t), x, y, { ...label, layer, dx: 9, dy: -20, align: "left" });
    };
    drawLabels("halo");

    drawTrajectory(view, start, t, palette.accent);
    drawRing(view, start[0], start[1], HIGHLIGHT_RADIUS - 1, palette.accent, 2, palette.paper);
    const others = PARTICLES.slice(1).map(particle => flow(particle, t));
    drawDots(view, others, DOT_RADIUS, palette.muted);
    drawDots(view, [[x, y]], HIGHLIGHT_RADIUS, palette.accent);

    drawLabels("text");
    drawCornerTitle(view, "Lagrangian description", palette);
  });
}
