import * as d3 from "d3";
import type { GridData, Solution } from "./solver";

export interface PlotHandle {
  render: (_solution: Solution) => void;
}

const MARGIN = { top: 16, right: 84, bottom: 48, left: 56 };
const RASTER_UPSAMPLE = 1;

export function createPlot(
  container: d3.Selection<HTMLElement, unknown, HTMLElement, unknown>,
  grid: GridData,
): PlotHandle {
  const containerNode = container.node();
  const totalWidth = Math.max(containerNode?.clientWidth ?? 460, 460);
  const totalHeight = Math.max(containerNode?.clientHeight ?? 420, 420);
  const plotSize = Math.min(
    totalWidth - MARGIN.left - MARGIN.right,
    totalHeight - MARGIN.top - MARGIN.bottom,
  );
  const svgWidth = MARGIN.left + plotSize + MARGIN.right;
  const svgHeight = MARGIN.top + plotSize + MARGIN.bottom;

  const svg = container
    .append("svg")
    .attr("width", svgWidth)
    .attr("height", svgHeight)
    .attr("viewBox", `0 0 ${svgWidth} ${svgHeight}`)
    .attr("preserveAspectRatio", "xMidYMid meet");

  const plot = svg
    .append("g")
    .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);

  const x = d3.scaleLinear().domain([0, 1]).range([0, plotSize]);
  const y = d3.scaleLinear().domain([0, 1]).range([plotSize, 0]);

  const densityImage = plot.append("image")
    .attr("x", 0)
    .attr("y", 0)
    .attr("width", plotSize)
    .attr("height", plotSize)
    .attr("preserveAspectRatio", "none");

  densityImage.lower();

  plot.append("g")
    .attr("transform", `translate(0,${plotSize})`)
    .call(d3.axisBottom(x).ticks(6));
  plot.append("g").call(d3.axisLeft(y).ticks(6));

  plot.append("text")
    .attr("x", plotSize / 2).attr("y", plotSize + 38)
    .attr("text-anchor", "middle").style("font-size", "0.9rem")
    .text("r₁");
  plot.append("text")
    .attr("x", -plotSize / 2).attr("y", -38)
    .attr("transform", "rotate(-90)")
    .attr("text-anchor", "middle").style("font-size", "0.9rem")
    .text("r₂");

  plot.append("line")
    .attr("x1", x(0)).attr("y1", y(0))
    .attr("x2", x(1)).attr("y2", y(1))
    .attr("stroke", "#111").attr("stroke-width", 1)
    .attr("stroke-dasharray", "4 4").attr("opacity", 0.65);

  const legend = createLegend(svg, plot, plotSize);

  const rasterSize = (grid.nGrid - 1) * RASTER_UPSAMPLE + 1;
  const rasterCanvas = document.createElement("canvas");
  rasterCanvas.width = rasterSize;
  rasterCanvas.height = rasterSize;
  const rasterContext = rasterCanvas.getContext("2d");
  if (rasterContext === null) {
    throw new Error("Unable to initialize density raster context");
  }

  const render = (solution: Solution): void => {
    const maxAbs = Math.max(solution.maxAbs, 1e-12);
    const color = d3
      .scaleDiverging<string>(d3.interpolateRdBu)
      .domain([maxAbs, 0, -maxAbs]);

    const imageData = rasterContext.createImageData(rasterSize, rasterSize);
    const data = imageData.data;
    let pixel = 0;
    for (let yPixel = 0; yPixel < rasterSize; yPixel += 1) {
      const r2 = (rasterSize - 1 - yPixel) / RASTER_UPSAMPLE;
      for (let xPixel = 0; xPixel < rasterSize; xPixel += 1) {
        const r1 = xPixel / RASTER_UPSAMPLE;
        const value = sampleBilinear(solution.psi, grid.nGrid, r1, r2);
        const rgb = d3.rgb(color(value));
        data[pixel] = rgb.r;
        data[pixel + 1] = rgb.g;
        data[pixel + 2] = rgb.b;
        data[pixel + 3] = 255;
        pixel += 4;
      }
    }

    rasterContext.putImageData(imageData, 0, 0);
    densityImage.attr("href", rasterCanvas.toDataURL("image/png"));

    legend.update(maxAbs, color);
  };

  return { render };
}

function createLegend(
  svg: d3.Selection<SVGSVGElement, unknown, HTMLElement, unknown>,
  plot: d3.Selection<SVGGElement, unknown, HTMLElement, unknown>,
  plotSize: number,
) {
  const legendX = plotSize + 28;
  const legendY = 12;
  const legendHeight = plotSize - 24;
  const legendWidth = 14;
  const legendId = "quantum-gradient";

  const gradient = svg.append("defs")
    .append("linearGradient")
    .attr("id", legendId)
    .attr("x1", "0%").attr("y1", "100%")
    .attr("x2", "0%").attr("y2", "0%");

  const offsets = ["0%", "50%", "100%"] as const;
  gradient.selectAll("stop").data(offsets).join("stop")
    .attr("offset", d => d);

  plot.append("rect")
    .attr("x", legendX).attr("y", legendY)
    .attr("width", legendWidth).attr("height", legendHeight)
    .attr("fill", `url(#${legendId})`)
    .attr("stroke", "#333").attr("stroke-width", 0.6);

  const legendScale = d3.scaleLinear().domain([-1, 1]).range([legendHeight, 0]);
  const legendAxis = plot.append("g")
    .attr("transform", `translate(${legendX + legendWidth + 6},${legendY})`)
    .call(d3.axisRight(legendScale).ticks(5));

  plot.append("text")
    .attr("x", legendX + legendWidth / 2).attr("y", legendY - 6)
    .attr("text-anchor", "middle").style("font-size", "0.8rem")
    .text("ψ");

  return {
    update(maxAbs: number, color: (_value: number) => string): void {
      const stops = [color(-maxAbs), color(0), color(maxAbs)];
      gradient.selectAll<SVGStopElement, string>("stop")
        .data(stops)
        .join("stop")
        .attr("offset", (_, i) => offsets[i])
        .attr("stop-color", d => d);
      legendScale.domain([-maxAbs, maxAbs]);
      legendAxis.call(d3.axisRight(legendScale).ticks(5));
    },
  };
}

function sampleBilinear(
  psi: Float64Array,
  nGrid: number,
  x: number,
  y: number,
): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(x0 + 1, nGrid - 1);
  const y1 = Math.min(y0 + 1, nGrid - 1);
  const tx = x - x0;
  const ty = y - y0;

  const q00 = psi[x0 * nGrid + y0];
  const q10 = psi[x1 * nGrid + y0];
  const q01 = psi[x0 * nGrid + y1];
  const q11 = psi[x1 * nGrid + y1];

  const top = q00 + tx * (q10 - q00);
  const bottom = q01 + tx * (q11 - q01);
  return top + ty * (bottom - top);
}
