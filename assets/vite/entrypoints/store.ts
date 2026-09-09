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

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      for (const panel of panels) {
        panel.hidden = panel.dataset.docPanel !== tab.dataset.docTarget;
      }
      for (const other of tabs) {
        other.setAttribute("aria-current", String(other === tab));
      }
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
