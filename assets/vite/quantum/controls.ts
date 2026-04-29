import * as d3 from "d3";
import { renderTex, tex } from "./katex";

export interface SliderConfig {
  readonly id: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly tickStep: number;
  readonly defaultValue: number;
}

export interface SliderHandle {
  readonly slider: HTMLInputElement;
  readonly setValue: (_value: number) => void;
  readonly onChange: (_handler: (_value: number) => void) => void;
}

/**
 * Builds the slider widget (value bubble, native range, tick row) inside the
 * given container. The bubble is draggable on its own (pointer events), and
 * stays aligned with the native thumb via the `--thumb` / `--p` CSS variables.
 */
export function createSlider(
  container: d3.Selection<HTMLDivElement, unknown, HTMLElement, unknown>,
  config: SliderConfig,
): SliderHandle {
  const { id, min, max, step, tickStep, defaultValue } = config;
  const fraction = (value: number): number => (value - min) / (max - min);

  const track = container.append("div").attr("class", "quantum-slider-track");

  const bubble = track.append("output")
    .attr("class", "quantum-slider-value")
    .attr("for", id)
    .node() as HTMLOutputElement;

  const slider = track.append("input")
    .attr("id", id)
    .attr("class", "quantum-slider")
    .attr("type", "range")
    .attr("min", min)
    .attr("max", max)
    .attr("step", step)
    .attr("value", defaultValue)
    .node() as HTMLInputElement;

  const tickValues = d3.range(min, max + 1, tickStep);
  const ticks = track.append("div").attr("class", "quantum-slider-ticks")
    .selectAll<HTMLDivElement, number>(".quantum-slider-tick")
    .data(tickValues)
    .join("div")
    .attr("class", "quantum-slider-tick")
    .style("--p", v => `${fraction(v)}`);
  ticks.append("div").attr("class", "quantum-slider-mark");
  ticks.append("div")
    .attr("class", "quantum-slider-label")
    .each(function (v) { renderTex(this as HTMLElement, tex`${v}`); });

  let handler: ((_value: number) => void) | null = null;

  const setValue = (value: number): void => {
    bubble.style.setProperty("--p", `${fraction(value)}`);
    renderTex(bubble, tex`\lambda = ${value}`);
  };

  // Round-and-clamp pointer X to a valid slider value, then notify the host.
  const updateFromPointer = (clientX: number): void => {
    const rect = slider.getBoundingClientRect();
    const thumb = readThumbPixels(track.node());
    const trackStart = rect.left + thumb / 2;
    const trackWidth = Math.max(rect.width - thumb, 1);
    const p = Math.min(Math.max((clientX - trackStart) / trackWidth, 0), 1);
    const raw = min + p * (max - min);
    const value = Math.round(raw / step) * step;
    slider.value = String(value);
    handler?.(value);
  };

  bubble.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    bubble.setPointerCapture(event.pointerId);
    updateFromPointer(event.clientX);
  });
  bubble.addEventListener("pointermove", (event) => {
    if (bubble.hasPointerCapture(event.pointerId)) {
      updateFromPointer(event.clientX);
    }
  });
  slider.addEventListener("input", () => handler?.(Number(slider.value)));

  return {
    slider,
    setValue,
    onChange: (h) => { handler = h; },
  };
}

/** Reads the `--thumb` CSS variable from the element and returns it in pixels. */
function readThumbPixels(element: HTMLElement | null): number {
  if (element === null) return 0;
  const raw = getComputedStyle(element).getPropertyValue("--thumb").trim();
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return 0;
  if (raw.endsWith("px")) return value;
  const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return value * rootFontSize;
}
