/**
 * Animations for the post "Liouville's theorem, the fluid way".
 *
 * Every element with a `data-scene` attribute is turned into the scene of that name.
 * The markup (canvas, buttons, outputs) lives in index.md, the styling in
 * fluid-liouville.css and the colors are read from its `--fl-*` custom properties.
 */

import { mountBalance } from "./scenes/balance";
import { mountDerivatives } from "./scenes/derivatives";
import { mountIncompressible } from "./scenes/incompressible";
import { mountTwoViews } from "./scenes/two-views";

const SCENES: Record<string, (root: HTMLElement) => void> = {
  "two-views": mountTwoViews,
  "balance": mountBalance,
  "incompressible": mountIncompressible,
  "derivatives": mountDerivatives,
};

for (const root of document.querySelectorAll<HTMLElement>("[data-scene]")) {
  const mount = SCENES[root.dataset.scene ?? ""];
  if (!mount) {
    console.warn(`Unknown scene "${root.dataset.scene}"`);
    continue;
  }
  try {
    mount(root);
    root.classList.add("fl-ready");
  }
  catch (error) {
    // One broken scene should not take down the others.
    console.error(`Could not start scene "${root.dataset.scene}"`, error);
  }
}
