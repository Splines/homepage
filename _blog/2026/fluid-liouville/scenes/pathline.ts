import { Clock, type Animation } from "../lib/clock";
import { bindPlayButton } from "../lib/controls";
import { createCloud, drawFormula, drawRing, tracePolyline, type FormulaOptions, type MathRun } from "../lib/draw";
import { readPalette } from "../lib/palette";
import { View, type Bounds, type Point } from "../lib/view";

const FRAME: Bounds = { xMin: 0, xMax: 3.5, yMin: -0.5, yMax: 0.5 };

/** Initial positions X of the particles. The first one is highlighted. */
const PARTICLES: Point[] = [
  [0.55, -0.06],
  [0.12, 0.24],
  [0.95, 0.25],
  [1.1, -0.22],
  [1.45, 0.04],
];

/** Horizontal distance a particle at height 0 covers during 0 ≤ t ≤ 1. */
const DRIFT = 1.9;
/** How much faster the upper layers drift than the lower ones. */
const SHEAR = 0.6;
const WAVE_NUMBER = (2 * Math.PI) / 1.6;
const WAVE_AMPLITUDE = 0.1;
/** Chosen so that the highlighted particle first rises, away from the label of its start. */
const WAVE_PHASE = -0.3 - WAVE_NUMBER * 0.55;

const TRAIL_SAMPLES = 80;
const DOT_RADIUS = 5;
const HIGHLIGHT_RADIUS = 6;

/**
 * Flow map φ(X, t) of a sheared stream over a wavy bed: particles drift to the right,
 * upper ones faster, and swing up and down as they pass the waves. φ(X, 0) = X.
 */
function flow([X, Y]: Point, t: number): Point {
  const x = X + (DRIFT + SHEAR * Y) * t;
  const wave = (s: number) => Math.sin(WAVE_NUMBER * s + WAVE_PHASE);
  return [x, Y + WAVE_AMPLITUDE * (wave(x) - wave(X))];
}

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
 * A handful of fluid particles drifting along. One of them is highlighted: its initial
 * position X stays marked, and its trajectory φ(X, ·) is drawn up to the current time,
 * which the reader can also set with a slider.
 */
export function mountPathline(root: HTMLElement): void {
  const view = new View(root.querySelector<HTMLCanvasElement>("canvas")!, FRAME);
  const slider = root.querySelector<HTMLInputElement>("input[type='range']")!;
  const palette = readPalette(root);
  const trail = createCloud(TRAIL_SAMPLES);
  const start = PARTICLES[0];

  const animation: Animation = {
    period: 1,
    speed: 1 / 8,
    reset() {},
    update() {},
    draw(t) {
      slider.value = String(t);
      if (!view.begin()) return;
      const { ctx } = view;

      const [x, y] = flow(start, t);
      const label: FormulaOptions = {
        color: palette.accent,
        halo: palette.paper,
        size: view.width < 560 ? 16 : 19,
      };
      // Labels are split around the marks, so that their halos hide no particle.
      const drawLabels = (layer: FormulaOptions["layer"]) => {
        drawFormula(view, START_FORMULA, start[0], start[1], { ...label, layer, dy: 27 });
        // The particle always moves to the right, so its trail never reaches this label.
        drawFormula(view, currentFormula(t), x, y, { ...label, layer, dx: 9, dy: -20, align: "left" });
      };
      drawLabels("halo");

      // Trajectory of the highlighted particle up to time t.
      for (let k = 0; k < TRAIL_SAMPLES; k++) {
        [trail.x[k], trail.y[k]] = flow(start, (t * k) / (TRAIL_SAMPLES - 1));
      }
      tracePolyline(view, trail, false);
      ctx.strokeStyle = palette.accent;
      ctx.globalAlpha = 0.55;
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.stroke();
      ctx.globalAlpha = 1;
      drawRing(view, start[0], start[1], HIGHLIGHT_RADIUS - 1, palette.accent, 2, palette.paper);

      ctx.fillStyle = palette.muted;
      ctx.beginPath();
      for (const particle of PARTICLES.slice(1)) {
        const [px, py] = flow(particle, t);
        ctx.moveTo(view.screenX(px) + DOT_RADIUS, view.screenY(py));
        ctx.arc(view.screenX(px), view.screenY(py), DOT_RADIUS, 0, 2 * Math.PI);
      }
      ctx.fill();

      ctx.fillStyle = palette.accent;
      ctx.beginPath();
      ctx.arc(view.screenX(x), view.screenY(y), HIGHLIGHT_RADIUS, 0, 2 * Math.PI);
      ctx.fill();

      drawLabels("text");

      ctx.font = "13px \"Rethink\", sans-serif";
      ctx.fillStyle = palette.text;
      ctx.textAlign = "right";
      ctx.textBaseline = "alphabetic";
      ctx.fillText("Lagrangian description", view.width - 12, view.height - 10);
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);

  // Dragging the slider holds the animation and lets it continue afterwards.
  let resumeAfterDrag = false;
  slider.addEventListener("pointerdown", () => {
    resumeAfterDrag = clock.playing;
    if (resumeAfterDrag) clock.toggle();
  });
  const release = () => {
    if (resumeAfterDrag && !clock.playing) clock.toggle();
    resumeAfterDrag = false;
  };
  slider.addEventListener("pointerup", release);
  slider.addEventListener("pointercancel", release);
  slider.addEventListener("input", () => {
    clock.seek(slider.valueAsNumber);
  });
}
