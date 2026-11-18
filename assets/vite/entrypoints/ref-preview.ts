/**
 * Previews for references within a page: equation references from `_plugins/equations.rb`
 * (in prose and inside math) and kramdown's footnote references.
 *
 * - Mouse: hovering a reference shows a copy of the referenced equation or footnote right
 *   next to it. The preview stays open while the pointer moves over to it, so wide
 *   equations can be scrolled and links in footnotes clicked. Clicking the reference
 *   jumps to its target as usual.
 * - Touch: the first tap opens the preview instead of jumping, with a "Jump to" link at
 *   the bottom. Tapping the same reference again, tapping elsewhere or scrolling the
 *   page closes it.
 * - Keyboard: references are plain links, Enter jumps directly.
 *
 * Mouse and touch are told apart by the pointer of each event, not by the device, so
 * both work on laptops with a touchscreen.
 */

type Mode = "hover" | "tap";

interface Target {
  /** Content of the preview, already detached from the page. */
  content: HTMLElement;
  /** Element the jump link scrolls to. */
  anchor: HTMLElement;
  /** Text of the jump link, followed by an arrow. */
  jumpLabel: string;
  /** Called once the preview is visible and has its final width. */
  fit?: () => void;
}

const EQUATION_SELECTOR = 'a.eq-ref, .katex a[href^="#eq-"]';
const FOOTNOTE_SELECTOR = 'a.footnote[href^="#fn:"]';
const REF_SELECTOR = `${EQUATION_SELECTOR}, ${FOOTNOTE_SELECTOR}`;
const SHOW_DELAY_MS = 120;
const HIDE_DELAY_MS = 150;
/** Distance between the reference and the preview, and minimum distance to the viewport edges. */
const GAP_PX = 8;
/** Vertical page scroll that closes a tapped preview. */
const SCROLL_CLOSE_PX = 40;
/** Equations that are a bit too wide (e.g. on phones) are shrunk down to this factor. */
const MIN_SCALE = 0.8;

document.addEventListener("DOMContentLoaded", () => {
  if (!document.querySelector(REF_SELECTOR)) return;

  const preview = document.createElement("div");
  preview.className = "ref-preview";
  preview.hidden = true;
  document.body.append(preview);

  let current: HTMLAnchorElement | null = null;
  let mode: Mode | null = null;
  let openedAtScrollY = 0;
  let lastPointerType = "";
  let showTimer: number | undefined;
  let hideTimer: number | undefined;

  const open = (link: HTMLAnchorElement, newMode: Mode) => {
    if (!showPreview(preview, link, newMode === "tap")) return;
    current = link;
    mode = newMode;
    openedAtScrollY = window.scrollY;
  };

  const hide = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    preview.hidden = true;
    current = null;
    mode = null;
  };

  // Hover (mouse and pen). Touch fires these events too when tapping, so skip them.
  document.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch" || mode === "tap") return;
    if (!(event.target instanceof Element)) return;
    if (preview.contains(event.target)) {
      clearTimeout(hideTimer);
      return;
    }
    const link = event.target.closest<HTMLAnchorElement>(REF_SELECTOR);
    if (!link) return;

    clearTimeout(hideTimer);
    if (link === current) return;
    clearTimeout(showTimer);
    showTimer = window.setTimeout(() => {
      open(link, "hover");
    }, SHOW_DELAY_MS);
  });

  document.addEventListener("pointerout", (event) => {
    if (event.pointerType === "touch" || mode === "tap") return;
    if (!(event.target instanceof Element)) return;
    const inPreview = preview.contains(event.target);
    const from = inPreview ? preview : event.target.closest(REF_SELECTOR);
    if (!from) return;

    const to = event.relatedTarget;
    if (to instanceof Node && (from.contains(to) || preview.contains(to))) return;
    clearTimeout(showTimer);
    hideTimer = window.setTimeout(hide, HIDE_DELAY_MS);
  });

  // Tap
  document.addEventListener("pointerdown", (event) => {
    lastPointerType = event.pointerType;
  }, { capture: true });

  document.addEventListener("click", (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (target && preview.contains(target)) {
      // Links (the jump link, links in footnotes) navigate by themselves, the preview can go.
      if (target.closest("a[href]")) hide();
      return;
    }

    const link = target?.closest<HTMLAnchorElement>(REF_SELECTOR);
    // detail is 0 for clicks triggered by the keyboard
    const byTouch = event.detail > 0 && lastPointerType === "touch";
    if (link && byTouch) {
      event.preventDefault();
      // Tapping the open reference again closes its preview, the jump link is for jumping.
      const wasOpen = mode === "tap" && link === current;
      hide();
      if (!wasOpen) open(link, "tap");
      return;
    }
    hide();
  });

  window.addEventListener("scroll", () => {
    if (mode === "tap" && Math.abs(window.scrollY - openedAtScrollY) > SCROLL_CLOSE_PX) hide();
  }, { passive: true });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
  window.addEventListener("resize", hide);
});

/**
 * Fills the preview with a copy of what the link points to (plus a jump link if
 * requested) and places it below the link, or above if there is not enough space below.
 * Returns false if the link target cannot be previewed.
 */
function showPreview(preview: HTMLElement, link: HTMLAnchorElement, withJump: boolean): boolean {
  const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
  const target = link.matches(FOOTNOTE_SELECTOR) ? footnoteTarget(id, link) : equationTarget(id);
  if (!target) return false;

  const { content } = target;
  // Ids must stay unique on the page.
  for (const element of content.querySelectorAll("[id]")) element.removeAttribute("id");
  // Math may be selected right now, see math-selection.ts.
  for (const element of content.querySelectorAll(".katex-selected")) element.classList.remove("katex-selected");
  preview.replaceChildren(content);

  if (withJump) {
    const jump = document.createElement("a");
    jump.className = "ref-preview-jump";
    jump.href = `#${id}`;
    // While the footnotes are collapsed (see footnotes.ts), a footnote may have no position
    // of its own (all zeros). Their <details> is visible and in its place.
    const visibleAnchor = target.anchor.closest(".footnotes-details:not([open])") ?? target.anchor;
    const below = visibleAnchor.getBoundingClientRect().top > link.getBoundingClientRect().top;
    jump.textContent = `${target.jumpLabel} ${below ? "↓" : "↑"}`;
    preview.append(jump);
  }

  // On hover, the preview is only a visual aid: the reference itself is a link.
  if (withJump) preview.removeAttribute("aria-hidden");
  else preview.setAttribute("aria-hidden", "true");
  // The width of wrapping content (footnotes) depends on the space right of the preview,
  // so measure it at the left edge, not wherever the previous preview was.
  preview.style.left = "0";
  preview.style.top = "0";
  preview.hidden = false;
  target.fit?.();

  const ref = link.getBoundingClientRect();
  const { offsetWidth: width, offsetHeight: height } = preview;
  const viewportWidth = document.documentElement.clientWidth;

  const centered = ref.left + ref.width / 2 - width / 2;
  const left = Math.max(GAP_PX, Math.min(centered, viewportWidth - width - GAP_PX));
  const fitsBelow = ref.bottom + GAP_PX + height <= window.innerHeight;
  const fitsAbove = ref.top - GAP_PX - height >= 0;
  const top = fitsBelow || !fitsAbove ? ref.bottom + GAP_PX : ref.top - GAP_PX - height;

  preview.style.left = `${left + window.scrollX}px`;
  preview.style.top = `${top + window.scrollY}px`;
  return true;
}

/** The display equation containing the element with the given id. */
function equationTarget(id: string): Target | null {
  const anchor = document.getElementById(id);
  const equation = anchor?.closest(".katex-display");
  if (!anchor || !equation) return null;

  const copy = equation.cloneNode(true) as HTMLElement;
  const content = document.createElement("div");
  content.className = "ref-preview-equation";
  content.append(copy);
  return {
    content,
    anchor,
    jumpLabel: `Jump to (${anchor.textContent})`,
    fit: () => {
      fitEquation(content, copy);
    },
  };
}

/** The footnote with the given id, e.g. `fn:1`, without its back links. */
function footnoteTarget(id: string, link: HTMLAnchorElement): Target | null {
  const footnote = document.getElementById(id);
  if (!footnote) return null;

  const content = document.createElement("div");
  content.className = "ref-preview-footnote";
  for (const child of footnote.childNodes) content.append(child.cloneNode(true));
  for (const backlink of content.querySelectorAll(".reversefootnote")) backlink.remove();

  return {
    content,
    anchor: footnote,
    // the reference shows the footnote's number, the id has the label from Markdown
    jumpLabel: `Jump to footnote ${link.textContent}`,
  };
}

/**
 * Shrinks an equation that is slightly wider than the preview can get, so it fits without
 * a scrollbar. Much wider equations keep their size and scroll instead.
 */
function fitEquation(content: HTMLElement, equation: HTMLElement): void {
  // Not everything scales exactly with the font size (padding, rounding), so measure again.
  let scale = 1;
  for (let i = 0; i < 4 && content.scrollWidth > content.clientWidth; i++) {
    scale *= 0.99 * content.clientWidth / content.scrollWidth;
    if (scale < MIN_SCALE) {
      equation.style.fontSize = "";
      return;
    }
    equation.style.fontSize = `${scale.toFixed(3)}rem`;
  }
}
