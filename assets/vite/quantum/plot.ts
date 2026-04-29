import * as d3 from "d3";
import type { GridData, Solution } from "./solver";
import { renderTex, tex } from "./katex";

export interface PlotHandle {
  render: (_solution: Solution) => void;
}

const MARGIN = { top: 24, right: 92, bottom: 56, left: 64 };
const GRADIENT_ID = "quantum-gradient";
const TICK_COUNT = 6;
const LEGEND_TICK_COUNT = 5;

export function createPlot(
  container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,
  grid: GridData,
  fixedMaxAbs: number,
): PlotHandle {
  // Sizing: square plot scaled to container width.
  const containerWidth = Math.max(container.node()?.clientWidth ?? 720, 420);
  const plotSize = Math.max(containerWidth - MARGIN.left - MARGIN.right, 280);
  const svgWidth = MARGIN.left + plotSize + MARGIN.right;
  const svgHeight = MARGIN.top + plotSize + MARGIN.bottom;

  // Wrap SVG in a positioned host so KaTeX labels can be plain HTML
  // overlays on top of it (no foreignObject sizing/clipping headaches).
  const host = container.append("div").attr("class", "quantum-plot");
  const svg = host.append("svg")
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  // Inner group placed at the plot origin in SVG user units.
  const plot = svg.append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
  const x = d3.scaleLinear().domain([0, 1]).range([0, plotSize]);
  const y = d3.scaleLinear().domain([0, 1]).range([plotSize, 0]);
  const maxAbs = Math.max(fixedMaxAbs, 1e-12);
  const color = d3.scaleDiverging<string>(d3.interpolateRdBu)
    .domain([maxAbs, 0, -maxAbs]);

  // Density raster (one image; smooth via CSS image-rendering settings).
  const densityImage = plot.append("image")
    .attr("width", plotSize).attr("height", plotSize)
    .attr("preserveAspectRatio", "none");
  const canvas = document.createElement("canvas");
  canvas.width = grid.nGrid;
  canvas.height = grid.nGrid;
  const ctx = canvas.getContext("2d");
  if (ctx === null) throw new Error("Cannot create density canvas context");

  // Diagonal r1 == r2 (forced node of the antisymmetric wavefunction).
  plot.append("line")
    .attr("class", "quantum-diagonal")
    .attr("x1", x(0)).attr("y1", y(0))
    .attr("x2", x(1)).attr("y2", y(1));

  // Axes: keep d3 ticks for grid lines, then strip the text — KaTeX overlays
  // handle the actual labels so they look like the rest of the post.
  const xAxisGroup = plot.append("g").attr("transform", `translate(0,${plotSize})`);
  const yAxisGroup = plot.append("g");
  const xAxis = d3.axisBottom(x).ticks(TICK_COUNT);
  const yAxis = d3.axisLeft(y).ticks(TICK_COUNT);
  xAxisGroup.call(xAxis).selectAll("text").remove();
  yAxisGroup.call(yAxis).selectAll("text").remove();

  // Legend: gradient bar + axis on the right.
  const legendX = plotSize + 28;
  const legendY = 12;
  const legendWidth = 14;
  const legendHeight = plotSize - 24;
  const legendScale = d3.scaleLinear().domain([-maxAbs, maxAbs]).range([legendHeight, 0]);
  const legendAxis = d3.axisRight(legendScale).ticks(LEGEND_TICK_COUNT);

  const gradient = svg.append("defs").append("linearGradient")
    .attr("id", GRADIENT_ID)
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");
  gradient.selectAll("stop")
    .data(d3.range(0, 1.0001, 1 / 16))
    .join("stop")
    .attr("offset", d => `${d * 100}%`)
    .attr("stop-color", d => color(-maxAbs + d * 2 * maxAbs));

  plot.append("rect")
    .attr("class", "quantum-legend-bar")
    .attr("x", legendX).attr("y", legendY)
    .attr("width", legendWidth).attr("height", legendHeight)
    .attr("fill", `url(#${GRADIENT_ID})`);

  const legendAxisGroup = plot.append("g")
    .attr("transform", `translate(${legendX + legendWidth},${legendY})`);
  legendAxisGroup.call(legendAxis).selectAll("text").remove();

  // KaTeX label overlays. Each is positioned in viewBox percent units so
  // they scale correctly with the responsive SVG.
  const labels = host.append("div").attr("class", "quantum-labels");
  const px = (n: number): string => `${(n / svgWidth) * 100}%`;
  const py = (n: number): string => `${(n / svgHeight) * 100}%`;
  const addLabel = (className: string, leftSvg: number, topSvg: number, latex: string): void => {
    const div = labels.append("div")
      .attr("class", `quantum-label ${className}`)
      .style("left", px(leftSvg))
      .style("top", py(topSvg))
      .node() as HTMLElement;
    renderTex(div, latex);
  };

  // Axis titles (centered on each axis).
  addLabel("quantum-axis-title", MARGIN.left + plotSize / 2, MARGIN.top + plotSize + 28, tex`r_1`);
  addLabel("quantum-axis-title quantum-axis-title-y", MARGIN.left - 38, MARGIN.top + plotSize / 2, tex`r_2`);

  // Legend title.
  addLabel("quantum-legend-title", MARGIN.left + legendX + legendWidth / 2, MARGIN.top + legendY - 13, tex`\psi`);

  // Tick labels are HTML overlays, so they stay sharp and never get clipped by SVG text boxes.
  const xTickLayer = labels.append("div").attr("class", "quantum-tick-layer");
  const yTickLayer = labels.append("div").attr("class", "quantum-tick-layer");
  const legendTickLayer = labels.append("div").attr("class", "quantum-tick-layer");

  const renderTickLabels = (
    layer: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,
    values: number[],
    leftSvg: (_v: number) => number,
    topSvg: (_v: number) => number,
    extraClass: string,
  ): void => {
    layer.selectAll<HTMLDivElement, number>(".quantum-tick").data(values)
      .join("div")
      .attr("class", `quantum-tick ${extraClass}`)
      .style("left", v => px(leftSvg(v)))
      .style("top", v => py(topSvg(v)))
      .each(function (v) { renderTex(this as HTMLElement, tex`${formatTick(v)}`); });
  };

  renderTickLabels(
    xTickLayer, x.ticks(TICK_COUNT),
    v => MARGIN.left + x(v), () => MARGIN.top + plotSize + 6,
    "quantum-tick-x",
  );
  renderTickLabels(
    yTickLayer, y.ticks(TICK_COUNT),
    () => MARGIN.left - 6, v => MARGIN.top + y(v),
    "quantum-tick-y",
  );
  renderTickLabels(
    legendTickLayer, legendScale.ticks(LEGEND_TICK_COUNT),
    () => MARGIN.left + legendX + legendWidth + 8,
    v => MARGIN.top + legendY + legendScale(v),
    "quantum-tick-legend",
  );

  const render = (solution: Solution): void => {
    // Paint density: psi[i*N + j] uses i = r1, j = r2. Image y axis is flipped.
    const image = ctx.createImageData(grid.nGrid, grid.nGrid);
    let p = 0;
    for (let yPx = 0; yPx < grid.nGrid; yPx += 1) {
      const j = grid.nGrid - 1 - yPx;
      for (let xPx = 0; xPx < grid.nGrid; xPx += 1) {
        const rgb = d3.rgb(color(solution.psi[xPx * grid.nGrid + j]));
        image.data[p++] = rgb.r;
        image.data[p++] = rgb.g;
        image.data[p++] = rgb.b;
        image.data[p++] = 255;
      }
    }
    ctx.putImageData(image, 0, 0);
    densityImage.attr("href", canvas.toDataURL("image/png"));
  };

  return { render };
}

function formatTick(value: number): string {
  if (Math.abs(value) < 1e-10) return "0";
  return d3.format(".3~g")(value);
}
