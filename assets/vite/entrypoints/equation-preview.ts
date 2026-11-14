/**
 * Hover previews for equation references from `_plugins/equations.rb`.
 *
 * On devices with a precise pointer, hovering a reference (in prose or inside math) shows
 * a copy of the referenced display equation right next to it. The preview stays open
 * while the pointer moves over to it, so wide equations can be scrolled.
 */

const REF_SELECTOR = 'a.eq-ref, .katex a[href^="#eq-"]';
const SHOW_DELAY_MS = 120;
const HIDE_DELAY_MS = 150;
/** Distance between the reference and the preview, and minimum distance to the viewport edges. */
const GAP_PX = 8;

document.addEventListener("DOMContentLoaded", () => {
  if (!matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  if (!document.querySelector(REF_SELECTOR)) return;

  const preview = document.createElement("div");
  preview.className = "eq-preview";
  preview.hidden = true;
  // Only a visual aid: the reference itself is a link to the equation.
  preview.setAttribute("aria-hidden", "true");
  document.body.append(preview);

  let current: HTMLAnchorElement | null = null;
  let showTimer: number | undefined;
  let hideTimer: number | undefined;

  const hide = () => {
    clearTimeout(showTimer);
    clearTimeout(hideTimer);
    preview.hidden = true;
    current = null;
  };

  document.addEventListener("pointerover", (event) => {
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
      if (showPreview(preview, link)) current = link;
    }, SHOW_DELAY_MS);
  });

  document.addEventListener("pointerout", (event) => {
    if (!(event.target instanceof Element)) return;
    const inPreview = preview.contains(event.target);
    const from = inPreview ? preview : event.target.closest(REF_SELECTOR);
    if (!from) return;

    const to = event.relatedTarget;
    if (to instanceof Node && (from.contains(to) || preview.contains(to))) return;
    clearTimeout(showTimer);
    hideTimer = window.setTimeout(hide, HIDE_DELAY_MS);
  });

  document.addEventListener("click", (event) => {
    if (!(event.target instanceof Node && preview.contains(event.target))) hide();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") hide();
  });
  window.addEventListener("resize", hide);
});

/**
 * Fills the preview with a copy of the equation the link points to and places it below
 * the link, or above if there is not enough space below. Returns false if the link does
 * not point to a display equation.
 */
function showPreview(preview: HTMLElement, link: HTMLAnchorElement): boolean {
  const id = decodeURIComponent(link.getAttribute("href")?.slice(1) ?? "");
  const equation = document.getElementById(id)?.closest(".katex-display");
  if (!equation) return false;

  const copy = equation.cloneNode(true) as HTMLElement;
  // The anchor id must stay unique on the page.
  for (const element of copy.querySelectorAll("[id]")) element.removeAttribute("id");
  preview.replaceChildren(copy);
  preview.hidden = false;
  preview.scrollLeft = 0;

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
