/**
 * Previews for equation references from `_plugins/equations.rb`, in prose and inside math.
 *
 * - Mouse: hovering a reference shows a copy of the referenced display equation right next
 *   to it. The preview stays open while the pointer moves over to it, so wide equations
 *   can be scrolled. Clicking the reference jumps to the equation as usual.
 * - Touch: the first tap opens the preview instead of jumping, with a "Jump to" link at
 *   the bottom. Tapping the same reference again jumps, too. Tapping elsewhere or
 *   scrolling the page closes it.
 * - Keyboard: references are plain links, Enter jumps directly.
 *
 * Mouse and touch are told apart by the pointer of each event, not by the device, so
 * both work on laptops with a touchscreen.
 */

type Mode = "hover" | "tap";

const REF_SELECTOR = 'a.eq-ref, .katex a[href^="#eq-"]';
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
  preview.className = "eq-preview";
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
      // The jump link navigates by itself, the preview can go.
      if (target.closest(".eq-preview-jump")) hide();
      return;
    }

    const link = target?.closest<HTMLAnchorElement>(REF_SELECTOR);
    // detail is 0 for clicks triggered by the keyboard
    const byTouch = event.detail > 0 && lastPointerType === "touch";
    if (link && byTouch && !(mode === "tap" && link === current)) {
      event.preventDefault();
      hide();
      open(link, "tap");
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
 * Fills the preview with a copy of the equation the link points to (plus a jump link if
 * requested) and places it below the link, or above if there is not enough space below.
 * Returns false if the link does not point to a display equation.
 */
function showPreview(preview: HTMLElement, link: HTMLAnchorElement, withJump: boolean): boolean {
  const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
  const anchor = document.getElementById(id);
  const equation = anchor?.closest(".katex-display");
  if (!anchor || !equation) return false;

  const copy = equation.cloneNode(true) as HTMLElement;
  // The anchor id must stay unique on the page.
  for (const element of copy.querySelectorAll("[id]")) element.removeAttribute("id");
  // The equation may be selected right now, see math-selection.ts.
  for (const element of copy.querySelectorAll(".katex-selected")) element.classList.remove("katex-selected");
  const content = document.createElement("div");
  content.className = "eq-preview-equation";
  content.append(copy);
  preview.replaceChildren(content);

  if (withJump) {
    const jump = document.createElement("a");
    jump.className = "eq-preview-jump";
    jump.href = `#${id}`;
    const below = anchor.getBoundingClientRect().top > link.getBoundingClientRect().top;
    jump.textContent = `Jump to (${anchor.textContent}) ${below ? "↓" : "↑"}`;
    preview.append(jump);
  }

  // On hover, the preview is only a visual aid: the reference itself is a link.
  if (withJump) preview.removeAttribute("aria-hidden");
  else preview.setAttribute("aria-hidden", "true");
  preview.hidden = false;
  fitEquation(content, copy);

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
