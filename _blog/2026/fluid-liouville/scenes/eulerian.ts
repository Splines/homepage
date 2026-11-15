import {
  TARGET_REACH,
  drawCornerTitle,
  drawDots,
  drawTarget,
  drawText,
  formulaSize,
  type TextOptions,
} from "../lib/draw";
import { readPalette } from "../lib/palette";
import { Timeline } from "../lib/timeline";
import { View, type Point } from "../lib/view";
import { DOT_RADIUS, FRAME, SECONDS, flow, inverseFlow } from "./drift";

/** The point x fixed in space. */
const FIXED_POINT: Point = [2.45, -0.04];

/** Times at which a particle passes right through the fixed point. */
const PASSING_TIMES = [0.08, 0.4, 0.72];

/**
 * Initial positions of the particles: the ones that pass through the fixed point,
 * plus a few that drift by above and below it, enter from the left or leave on the right.
 */
const PARTICLES: Point[] = [
  ...PASSING_TIMES.map(t => inverseFlow(FIXED_POINT, t)),
  [0.25, 0.22],
  [1.35, 0.22],
  [-0.5, 0.14],
  [0.6, -0.3],
  [2.3, 0.25],
];

/**
 * Eulerian description: the same flow as in the Lagrangian scene, watched at a point x
 * fixed in space. Particles come and go, some of them passing right through x.
 */
export function mountEulerian(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const palette = readPalette(root);

  new Timeline(root, (t) => {
    if (!view.begin()) return;
    const x = view.screenX(FIXED_POINT[0]);
    const y = view.screenY(FIXED_POINT[1]) - TARGET_REACH - 13;
    const label: TextOptions = {
      color: palette.fixed,
      halo: palette.paper,
      size: formulaSize(view),
    };
    // The label is split around the particles, so that its halo hides none of them.
    drawText(view, [["x", "boldItalic"]], x, y, { ...label, layer: "halo" });
    drawDots(view, PARTICLES.map(particle => flow(particle, t)), DOT_RADIUS, palette.muted);
    drawTarget(view, FIXED_POINT, palette.fixed, 2);
    drawText(view, [["x", "boldItalic"]], x, y, { ...label, layer: "text" });
    drawCornerTitle(view, "Eulerian description", palette);
  }, SECONDS);
}
