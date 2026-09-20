/**
 * Store product page behavior: switching between the documentation panels and a
 * click-to-load gate for the YouTube demo video.
 *
 * The video is only embedded after an explicit click. Until then nothing is
 * requested from YouTube, so no IP address is transmitted and no cookies are set
 * (Art. 6 (1) (a) GDPR, § 25 (1) TDDDG).
 */

const YOUTUBE_EMBED_BASE = "https://www.youtube-nocookie.com/embed/";

/** How far Left/Right move along the documentation tabs, wrapping at the ends. */
const ARROW_STEPS: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1 };

document.addEventListener("DOMContentLoaded", () => {
  setupDocTabs();
  setupVideoGate();
});

/**
 * Wires the Overview / Manual / Releases buttons so exactly one panel shows.
 *
 * The hash is the single source of truth: clicking a tab only writes the hash and
 * every panel change flows through `hashchange`. A hash names either a panel
 * (`#manual`) or a heading inside one (`#usage`), so headings can be linked to
 * across panels even though only one panel is visible at a time.
 *
 * These are plain buttons in a nav rather than an ARIA tabs widget, so each one is
 * its own tab stop and `aria-current` marks the panel on display. Left/Right are
 * wired up on top of that because the buttons sit in a row and readers reach for
 * them; the browser does not do this on its own.
 */
function setupDocTabs(): void {
  const tabList = document.querySelector<HTMLElement>("[data-doc-tabs]");
  const panels = Array.from(
    document.querySelectorAll<HTMLElement>("[data-doc-panel]"),
  );
  if (!tabList || panels.length === 0) return;

  const tabs = Array.from(
    tabList.querySelectorAll<HTMLButtonElement>("[data-doc-target]"),
  );

  /** Reveals `panel` alone and marks its tab as the one on display. */
  const showPanel = (panel: HTMLElement): void => {
    for (const other of panels) other.hidden = other !== panel;
    for (const tab of tabs) {
      tab.setAttribute(
        "aria-current",
        String(tab.dataset.docTarget === panel.dataset.docPanel),
      );
    }
  };

  /**
   * Shows the panel the current hash points into and scrolls it into view: a
   * heading hash (`#usage`) scrolls to that heading, a panel hash (`#manual`) to
   * the tab bar above the panel. An unknown or empty hash leaves the panels as
   * they are.
   *
   * Only hash navigation scrolls: a tab click is a request to swap the content
   * under the cursor, so moving the viewport there would be disorienting.
   */
  const applyHash = (): void => {
    const id = decodeURIComponent(location.hash.slice(1));
    const heading = document.getElementById(id);
    const named = panels.find((candidate) => candidate.dataset.docPanel === id);
    const panel = named ?? heading?.closest<HTMLElement>("[data-doc-panel]");
    if (!panel) return;

    showPanel(panel);
    // The panel may have just lost its `hidden` attribute, so a heading inside it
    // has no box yet in this tick; wait a frame for layout before scrolling.
    const scrollTo = named ? tabList : heading;
    if (scrollTo) requestAnimationFrame(() => scrollTo.scrollIntoView());
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const target = tab.dataset.docTarget;
      const panel = panels.find((candidate) => candidate.dataset.docPanel === target);
      if (!panel) return;

      showPanel(panel);
      history.replaceState(null, "", `#${target}`);
    });
  }

  tabList.addEventListener("keydown", (event) => {
    const step = ARROW_STEPS[event.key];
    const index = tabs.indexOf(event.target as HTMLButtonElement);
    if (step === undefined || index === -1) return;

    event.preventDefault();
    const next = tabs[(index + step + tabs.length) % tabs.length];
    next.focus();
    next.click();
  });

  window.addEventListener("hashchange", applyHash);
  applyHash();
}

/**
 * Replaces the preview image and consent bar with the real YouTube iframe once the
 * reader clicks "Play teaser". Because that click is a user gesture, the video may
 * autoplay with sound.
 */
function setupVideoGate(): void {
  const figure = document.querySelector<HTMLElement>("[data-video]");
  const button = figure?.querySelector<HTMLButtonElement>("[data-video-play]");
  if (!figure || !button) return;

  const videoId = figure.dataset.videoId;
  if (!videoId) return;

  button.addEventListener("click", () => {
    const iframe = document.createElement("iframe");
    iframe.src
      = `${YOUTUBE_EMBED_BASE}${encodeURIComponent(videoId)}`
        + "?autoplay=1&rel=0&vq=hd1440";
    iframe.title = figure.dataset.videoTitle ?? "Teaser video";
    iframe.allow
      = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; "
        + "picture-in-picture; web-share";
    iframe.allowFullscreen = true;

    figure.querySelector(".store-video-gate")?.remove();
    figure.querySelector(".store-video-poster")?.remove();
    figure.appendChild(iframe);
  });
}

export {};
