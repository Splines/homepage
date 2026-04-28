import * as d3 from "d3";
import { buildGridData, solveGroundState } from "./quantum/solver";
import { Solution } from "./quantum/solver";
import { createPlot } from "./quantum/plot";

const N_GRID = 42;
const DEFAULT_LAMBDA = 10;
const LAMBDA_MIN = 0;
const LAMBDA_MAX = 200;
const SLIDER_DEBOUNCE_MS = 0;

const root = d3.select("#d3-wave") as d3.Selection<HTMLElement, unknown, HTMLElement, unknown>;
if (!root.empty()) {
  initialize(root);
}

function initialize(
  container: d3.Selection<HTMLElement, unknown, HTMLElement, unknown>,
): void {
  const grid = buildGridData(N_GRID);
  const cache = new Map<number, Solution>();

  container.selectAll("*").remove();

  const controls = container.append("div")
    .style("display", "flex")
    .style("align-items", "center")
    .style("gap", "0.75rem")
    .style("margin-bottom", "0.75rem")
    .style("font-family", "ui-sans-serif, system-ui, sans-serif")
    .style("font-size", "0.95rem");

  controls.append("span").text("Same-spin interacting wavefunction");
  const lambdaText = controls.append("span").text(`λ: ${DEFAULT_LAMBDA}`);
  const energyText = controls.append("span").text("E ≈ computing…");

  const slider = controls.append("input")
    .attr("type", "range")
    .attr("min", LAMBDA_MIN)
    .attr("max", LAMBDA_MAX)
    .attr("step", 1)
    .attr("value", DEFAULT_LAMBDA)
    .style("flex", "1 1 280px")
    .style("max-width", "420px")
    .node() as HTMLInputElement;

  const plot = createPlot(container, grid);

  let renderToken = 0;
  let debounceHandle: number | undefined;

  const renderLambda = async (lambda: number): Promise<void> => {
    const token = ++renderToken;
    lambdaText.text(`λ: ${lambda}`);
    energyText.text("E ≈ computing…");

    // Yield to browser so the "computing…" label can paint before the
    // potentially expensive solver call blocks the main thread.
    await new Promise<void>((resolve) => {
      window.requestAnimationFrame(() => resolve());
    });
    if (token !== renderToken) return;

    let solution = cache.get(lambda);
    if (solution === undefined) {
      solution = solveGroundState(lambda, grid);
      cache.set(lambda, solution);
    }
    if (token !== renderToken) return;

    plot.render(solution);
    energyText.text(`E ≈ ${solution.energy.toFixed(4)} a.u.`);
  };

  slider.addEventListener("input", () => {
    const lambda = Number(slider.value);
    lambdaText.text(`λ: ${lambda}`);
    if (debounceHandle !== undefined) {
      window.clearTimeout(debounceHandle);
    }
    debounceHandle = window.setTimeout(() => {
      void renderLambda(lambda);
    }, SLIDER_DEBOUNCE_MS);
  });

  void renderLambda(DEFAULT_LAMBDA);
}
