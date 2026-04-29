import * as d3 from "d3";
import { buildGridData, solveGroundState, type Solution } from "./quantum/solver";
import { createPlot } from "./quantum/plot";
import { renderTex, tex } from "./quantum/katex";

const N_GRID = 42;
const DEFAULT_LAMBDA = 10;
const LAMBDA_MIN = 0;
const LAMBDA_MAX = 200;
const LAMBDA_STEP = 1;
const LAMBDA_TICK_STEP = 25;

const root = d3.select("#d3-wave") as d3.Selection<HTMLElement, unknown, HTMLElement, unknown>;
if (!root.empty()) {
  initialize(root);
}

function initialize(
  container: d3.Selection<HTMLElement, unknown, HTMLElement, unknown>,
): void {
  const grid = buildGridData(N_GRID);
  const cache = new Map<number, Solution>();
  const maxLambdaSolution = solveGroundState(LAMBDA_MAX, grid);
  const tickValues = d3.range(LAMBDA_MIN, LAMBDA_MAX + 1, LAMBDA_TICK_STEP);
  const fraction = (lambda: number): number =>
    (lambda - LAMBDA_MIN) / (LAMBDA_MAX - LAMBDA_MIN);
  cache.set(LAMBDA_MAX, maxLambdaSolution);

  container.selectAll("*").remove();
  container.classed("quantum-widget", true);

  const panel = container.append("div").attr("class", "quantum-panel");
  const controls = panel.append("div").attr("class", "quantum-controls");

  const heading = controls.append("div").attr("class", "quantum-heading");
  renderTex(heading.node(), tex`\text{Same-spin interacting wavefunction}`);

  const energyText = controls.append("div").attr("class", "quantum-energy");

  // The slider track owns the `--thumb` CSS variable so the value bubble and
  // tick marks can be positioned with one calc() that accounts for the thumb
  // width, keeping every label visually aligned with the thumb.
  const sliderTrack = controls.append("div").attr("class", "quantum-slider-track");

  const sliderValue = sliderTrack.append("output")
    .attr("class", "quantum-slider-value")
    .attr("for", "quantum-lambda-slider")
    .node() as HTMLOutputElement;

  const slider = sliderTrack.append("input")
    .attr("id", "quantum-lambda-slider")
    .attr("class", "quantum-slider")
    .attr("type", "range")
    .attr("min", LAMBDA_MIN)
    .attr("max", LAMBDA_MAX)
    .attr("step", LAMBDA_STEP)
    .attr("value", DEFAULT_LAMBDA)
    .node() as HTMLInputElement;

  const ticks = sliderTrack.append("div").attr("class", "quantum-slider-ticks")
    .selectAll<HTMLDivElement, number>(".quantum-slider-tick")
    .data(tickValues)
    .join("div")
    .attr("class", "quantum-slider-tick")
    .style("--p", d => `${fraction(d)}`);
  ticks.append("div").attr("class", "quantum-slider-mark");
  ticks.append("div")
    .attr("class", "quantum-slider-label")
    .each(function (value) { renderTex(this as HTMLElement, tex`${value}`); });

  const plot = createPlot(panel, grid, maxLambdaSolution.maxAbs);

  const setSliderValue = (lambda: number): void => {
    sliderValue.style.setProperty("--p", `${fraction(lambda)}`);
    renderTex(sliderValue, tex`\lambda = ${lambda}`);
  };

  const renderLambda = (lambda: number): void => {
    setSliderValue(lambda);
    let solution = cache.get(lambda);
    if (solution === undefined) {
      solution = solveGroundState(lambda, grid);
      cache.set(lambda, solution);
    }
    plot.render(solution);
    renderTex(energyText.node(), tex`E \approx ${solution.energy.toFixed(4)}\;\text{a.u.}`);
  };

  const getThumbPixels = (): number => {
    const sliderTrackNode = sliderTrack.node();
    if (sliderTrackNode === null) return 0;

    const rawThumb = getComputedStyle(sliderTrackNode).getPropertyValue("--thumb");
    const thumbValue = parseFloat(rawThumb);
    if (!Number.isFinite(thumbValue)) return 0;
    if (rawThumb.trim().endsWith("px")) return thumbValue;

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
    return thumbValue * rootFontSize;
  };

  const renderFromPointer = (clientX: number): void => {
    const rect = slider.getBoundingClientRect();
    const thumbPixels = getThumbPixels();
    const trackStart = rect.left + thumbPixels / 2;
    const trackWidth = Math.max(rect.width - thumbPixels, 1);
    const pointerFraction = Math.min(Math.max((clientX - trackStart) / trackWidth, 0), 1);
    const rawLambda = LAMBDA_MIN + pointerFraction * (LAMBDA_MAX - LAMBDA_MIN);
    const lambda = Math.round(rawLambda / LAMBDA_STEP) * LAMBDA_STEP;
    slider.value = String(lambda);
    renderLambda(lambda);
  };

  sliderValue.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    sliderValue.setPointerCapture(event.pointerId);
    renderFromPointer(event.clientX);
  });
  sliderValue.addEventListener("pointermove", (event) => {
    if (sliderValue.hasPointerCapture(event.pointerId)) {
      renderFromPointer(event.clientX);
    }
  });

  slider.addEventListener("input", () => renderLambda(Number(slider.value)));
  renderLambda(DEFAULT_LAMBDA);
}
