/**
 * The footnotes at the end of a page are collapsed into a `<details>` element (see
 * `_plugins/footnotes.rb`). This opens it whenever the reader jumps into it: by clicking a
 * footnote reference or the jump link of its preview, by going back and forth in the
 * history, or by opening a URL that points to a footnote.
 *
 * Some browsers open `<details>` on fragment navigation by themselves, others don't scroll
 * at all if the target is hidden, so do it here for all of them.
 */

const FOOTNOTES_SELECTOR = ".footnotes-details";

/**
 * Opens the collapsed footnotes if the element the hash (e.g. `#fn:1`) points to is in
 * there. Returns the element if it was hidden.
 */
function reveal(footnotes: HTMLDetailsElement, hash: string): HTMLElement | null {
  if (footnotes.open) return null;
  const target = document.getElementById(idOf(hash));
  if (!target || !footnotes.contains(target)) return null;
  footnotes.open = true;
  return target;
}

function idOf(hash: string): string {
  const id = hash.slice(1);
  try {
    return decodeURIComponent(id);
  } catch {
    // malformed percent-encoding, e.g. a hand-edited URL
    return id;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const footnotes = document.querySelector<HTMLDetailsElement>(FOOTNOTES_SELECTOR);
  if (!footnotes) return;

  // Open right before the browser follows the link, so it scrolls as usual. Listening on
  // window lets other handlers cancel the jump first: on touch, ref-preview.ts shows a
  // preview instead, which shouldn't expand the footnotes.
  window.addEventListener("click", (event) => {
    if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.shiftKey) return;
    if (!(event.target instanceof Element)) return;
    // also matches SVG links, so read the attribute instead of HTMLAnchorElement.hash
    const href = event.target.closest('a[href^="#"]')?.getAttribute("href");
    if (href) reveal(footnotes, href);
  });

  // The browser already tried (and failed) to scroll to the hidden element.
  const revealCurrent = () => {
    if (location.hash) reveal(footnotes, location.hash)?.scrollIntoView();
  };
  revealCurrent();
  window.addEventListener("hashchange", revealCurrent);

  // Printed pages can't be expanded. Restore the reader's choice afterwards.
  let openBeforePrint = false;
  window.addEventListener("beforeprint", () => {
    openBeforePrint = footnotes.open;
    footnotes.open = true;
  });
  window.addEventListener("afterprint", () => {
    footnotes.open = openBeforePrint;
  });
});
