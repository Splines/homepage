/**
 * Selecting and copying KaTeX math.
 *
 * Highlight: KaTeX builds math from many nested inline-blocks of different heights, and
 * browsers only paint the selection behind the text inside each of them. Selected math
 * thus looks like a patchwork of boxes. Instead, every equation that the selection touches
 * gets the class `katex-selected`, and `_equations.scss` hides the native selection inside
 * it and paints one background behind the whole equation. For display math, that
 * background only covers the equation itself, not the full width of the line, so its box
 * is measured here. As pages cannot know the browser's selection color, the page sets its
 * own (also for text) and grays it out when the window loses focus, like browsers do.
 *
 * Copy: as equations are highlighted as a whole, they are copied as a whole, too, as the
 * TeX source from `data-tex` (see `_plugins/tex_source.rb`).
 */

const SELECTED_CLASS = "katex-selected";
const SOURCE_SELECTOR = "[data-tex]";

document.addEventListener("DOMContentLoaded", () => {
  // live collection, so it includes math added later, e.g. in equation previews
  const equations = document.getElementsByClassName("katex");
  if (equations.length === 0) return;

  const root = document.documentElement;
  root.classList.add("math-selection");
  const setInactive = (inactive: boolean) => root.classList.toggle("window-inactive", inactive);
  setInactive(!document.hasFocus());
  window.addEventListener("focus", () => setInactive(false));
  window.addEventListener("blur", () => setInactive(true));

  let selected = new Set<Element>();
  let frame = 0;

  const update = () => {
    frame = 0;
    const range = selectedRange();
    const touched = new Set<Element>();
    if (range) {
      for (const equation of equations) {
        if (range.intersectsNode(equation)) touched.add(equation);
      }
    }

    for (const equation of selected) {
      if (!touched.has(equation)) equation.classList.remove(SELECTED_CLASS);
    }
    for (const equation of touched) {
      equation.classList.add(SELECTED_CLASS);
      measure(equation);
    }
    selected = touched;
  };

  // selectionchange fires for every pointer move while dragging
  document.addEventListener("selectionchange", () => {
    frame ||= requestAnimationFrame(update);
  });
  window.addEventListener("resize", () => {
    for (const equation of selected) measure(equation);
  });

  document.addEventListener("copy", (event) => {
    const range = selectedRange()?.cloneRange();
    if (!range || !event.clipboardData) return;

    // whole equations, like the highlight
    const first = mathAround(range.startContainer);
    const last = mathAround(range.endContainer);
    if (first) range.setStartBefore(first);
    if (last) range.setEndAfter(last);

    const copy = document.createElement("div");
    copy.append(range.cloneContents());
    const sources = copy.querySelectorAll<HTMLElement>(SOURCE_SELECTOR);
    if (sources.length === 0) return;
    for (const math of sources) {
      const display = math.classList.contains("katex-display");
      const tex = document.createElement(display ? "div" : "span");
      tex.style.whiteSpace = "pre-wrap";
      tex.textContent = display ? `$$\n${math.dataset.tex}\n$$` : `$${math.dataset.tex}$`;
      math.replaceWith(tex);
    }

    // innerText (with line breaks between paragraphs) only works for rendered elements
    copy.style.cssText = "position: fixed; left: -10000px; top: 0;";
    document.body.append(copy);
    event.clipboardData.setData("text/plain", copy.innerText);
    event.clipboardData.setData("text/html", copy.innerHTML);
    copy.remove();
    event.preventDefault();
  });
});

function selectedRange(): Range | null {
  const selection = document.getSelection();
  if (!selection || selection.isCollapsed || selection.rangeCount === 0) return null;
  return selection.getRangeAt(0);
}

function mathAround(node: Node): Element | null {
  const element = node instanceof Element ? node : node.parentElement;
  return element?.closest(SOURCE_SELECTOR) ?? null;
}

function measure(equation: Element) {
  if (!(equation instanceof HTMLElement)) return;
  if (equation.parentElement?.classList.contains("katex-display")) measureDisplayMath(equation);
  else measureInlineMath(equation);
}

/**
 * Stores how far the line extends above and below inline math: the selection of the
 * text around it covers the full line, the background of the math only its content.
 * Zero-size probes aligned to the top and bottom of the line tell where the line is.
 * They go right after the first box of the math, not before it: when the line breaks
 * just before the math, a probe at its very start stays behind on the previous line.
 */
function measureInlineMath(equation: HTMLElement) {
  const first = equation.querySelector(":scope > .katex-html > .base");
  if (!first) return;
  const probe = (align: string) => {
    const span = document.createElement("span");
    span.style.cssText = `font-size: 0; line-height: 0; vertical-align: ${align};`;
    first.after(span);
    return span;
  };
  const top = probe("top");
  const bottom = probe("bottom");
  const lineTop = top.getBoundingClientRect().top;
  const lineBottom = bottom.getBoundingClientRect().bottom;
  top.remove();
  bottom.remove();

  // the first line, if the math wraps
  const rect = equation.getClientRects().item(0);
  if (!rect) return;
  const style = getComputedStyle(equation);
  const contentTop = rect.top + parseFloat(style.paddingTop);
  const contentBottom = rect.bottom - parseFloat(style.paddingBottom);
  equation.style.setProperty("--katex-selection-above", `${Math.max(0, contentTop - lineTop)}px`);
  equation.style.setProperty("--katex-selection-below", `${Math.max(0, lineBottom - contentBottom)}px`);
}

/**
 * Stores the box around the parts of a display equation (KaTeX's `.base` elements,
 * without the tag) relative to its `.katex-html`, which spans the full line.
 */
function measureDisplayMath(equation: HTMLElement) {
  const html = equation.querySelector<HTMLElement>(":scope > .katex-html");
  if (!html) return;

  let left = Infinity;
  let top = Infinity;
  let right = -Infinity;
  let bottom = -Infinity;
  for (const base of html.querySelectorAll(":scope > .base")) {
    const rect = base.getBoundingClientRect();
    left = Math.min(left, rect.left);
    top = Math.min(top, rect.top);
    right = Math.max(right, rect.right);
    bottom = Math.max(bottom, rect.bottom);
  }
  if (left > right) return;

  const origin = html.getBoundingClientRect();
  html.style.setProperty("--katex-selection-left", `${left - origin.left}px`);
  html.style.setProperty("--katex-selection-top", `${top - origin.top}px`);
  html.style.setProperty("--katex-selection-width", `${right - left}px`);
  html.style.setProperty("--katex-selection-height", `${bottom - top}px`);
}
