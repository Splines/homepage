import * as katex from "katex";

/**
 * Tiny helper that renders a LaTeX expression into the given element.
 * `tex` is a tagged template so we can write LaTeX naturally without escaping
 * every backslash; e.g. tex`\lambda = ${value}`.
 */
export function renderTex(element: HTMLElement | null, expression: string): void {
  if (element === null) return;
  element.innerHTML = katex.renderToString(expression, {
    throwOnError: false,
  });
}

export function tex(strings: TemplateStringsArray, ...values: unknown[]): string {
  let result = strings.raw[0];
  for (let i = 0; i < values.length; i += 1) {
    result += String(values[i]) + strings.raw[i + 1];
  }
  return result;
}
