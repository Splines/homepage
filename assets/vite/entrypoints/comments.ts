/**
 * Loads the Giscus comment section only after an explicit click.
 *
 * Giscus embeds content from giscus.app and GitHub, which transmits the reader's IP
 * address to both and lets GitHub set cookies. Injecting the script on demand keeps that
 * from happening until the reader asks for it (Art. 6 (1) (a) GDPR, § 25 (1) TDDDG).
 */

const GISCUS_SRC = "https://giscus.app/client.js";
const CONFIG_PREFIX = "data-giscus-";

document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector<HTMLElement>("[data-comments]");
  if (!section) return;

  const consent = section.querySelector<HTMLElement>(".comments-consent");
  const button = section.querySelector<HTMLButtonElement>(".comments-load");
  const target = section.querySelector<HTMLElement>(".giscus");
  if (!consent || !button || !target) return;

  button.addEventListener("click", () => {
    button.disabled = true;
    button.textContent = "Loading comments…";
    loadGiscus(section, consent, button, target);
  });
});

/**
 * Builds the Giscus script from the `data-giscus-*` attributes on the section and
 * appends it, which makes Giscus render into the neighboring `.giscus` element.
 */
function loadGiscus(
  section: HTMLElement,
  consent: HTMLElement,
  button: HTMLButtonElement,
  target: HTMLElement,
): void {
  const script = document.createElement("script");
  script.src = GISCUS_SRC;
  script.async = true;
  script.crossOrigin = "anonymous";

  for (const attr of Array.from(section.attributes)) {
    if (attr.name.startsWith(CONFIG_PREFIX)) {
      script.setAttribute(`data-${attr.name.slice(CONFIG_PREFIX.length)}`, attr.value);
    }
  }

  script.addEventListener("load", () => {
    consent.hidden = true;
  });

  script.addEventListener("error", () => {
    script.remove();
    button.disabled = false;
    button.textContent = "Load comments";
    showError(consent);
  });

  target.appendChild(script);
}

/**
 * Tells the reader that the embed could not be reached, e.g. because a content blocker
 * rejected it, rather than leaving the button in a dead state.
 */
function showError(consent: HTMLElement): void {
  if (consent.querySelector(".comments-error")) return;

  const message = document.createElement("p");
  message.className = "comments-error";
  message.textContent
    = "The comments could not be loaded. A content blocker or network problem may be "
      + "preventing the connection to giscus.app.";
  consent.appendChild(message);
}

export {};
