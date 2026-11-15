/**
 * Highlights the section the reader is currently in, in the table of contents next to
 * the post (see `_plugins/table_of_contents.rb`). A section counts as current once its
 * heading has scrolled past the upper part of the viewport.
 */

/** Fraction of the viewport height a heading has to pass to make its section current. */
const ACTIVATION_LINE = 0.3;

document.addEventListener("DOMContentLoaded", () => {
  const links = [...document.querySelectorAll<HTMLAnchorElement>(".toc a[href^='#']")];
  const sections = links.flatMap((link) => {
    const heading = document.getElementById(decodeURIComponent(link.hash.slice(1)));
    return heading ? [{ link, heading }] : [];
  });
  if (sections.length === 0) return;

  let current: HTMLAnchorElement | null = null;
  let scheduled = false;

  const update = () => {
    scheduled = false;
    const line = window.innerHeight * ACTIVATION_LINE;
    const active = sections.findLast(s => s.heading.getBoundingClientRect().top <= line);
    const link = active?.link ?? null;
    if (link === current) return;

    current?.removeAttribute("aria-current");
    link?.setAttribute("aria-current", "location");
    current = link;
  };

  const schedule = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  };

  window.addEventListener("scroll", schedule, { passive: true });
  window.addEventListener("resize", schedule);
  update();
});
