import * as d3 from "d3";
import { buildGridData, solveGroundState, type Solution } from "./quantum/solver";
import { createPlot } from "./quantum/plot";
import { createSlider } from "./quantum/controls";
import { renderTex, tex } from "./quantum/katex";

const N_GRID = 42;
const SLIDER = {
  id: "quantum-lambda-slider",
  min: 0,
  max: 200,
  step: 1,
  tickStep: 25,
  defaultValue: 10,
};

const root = d3.select<HTMLDivElement, unknown>("#d3-wave");
if (!root.empty()) {
  initialize(root);
}

function initialize(container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>): void {
  const grid = buildGridData(N_GRID);

  // Precompute the lambda=max solution so the colorbar domain stays fixed
  // (no rescaling as the user drags) and store it in the cache.
  const maxLambdaSolution = solveGroundState(SLIDER.max, grid);
  const cache = new Map<number, Solution>([[SLIDER.max, maxLambdaSolution]]);

  container.selectAll("*").remove();
  container.classed("quantum-widget", true);

  const panel = container.append("div").attr("class", "quantum-panel");
  const controls = panel.append("div").attr("class", "quantum-controls");

  const heading = controls.append("div").attr("class", "quantum-heading");
  renderTex(heading.node(), tex`\text{Same-spin interacting wavefunction}`);

  const energy = controls.append("div").attr("class", "quantum-energy");
  const slider = createSlider(controls, SLIDER);
  const plot = createPlot(panel, grid, maxLambdaSolution.maxAbs);

  const renderLambda = (lambda: number): void => {
    slider.setValue(lambda);
    let solution = cache.get(lambda);
    if (solution === undefined) {
      solution = solveGroundState(lambda, grid);
      cache.set(lambda, solution);
    }
    plot.render(solution);
    renderTex(energy.node(), tex`E \approx ${solution.energy.toFixed(4)}\;\text{a.u.}`);
  };

  slider.onChange(renderLambda);
  renderLambda(SLIDER.defaultValue);
}
