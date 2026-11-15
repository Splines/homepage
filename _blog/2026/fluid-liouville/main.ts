/**
 * Animations for the post "Liouville's theorem, the fluid way".
 *
 * Every element with a `data-scene` attribute is turned into the scene of that name.
 * The markup (canvas, buttons, outputs) lives in index.md, the styling in
 * fluid-liouville.css and the colors are read from its `--fl-*` custom properties.
 */

import { mountBalance } from "./scenes/balance";
import { mountDerivatives } from "./scenes/derivatives";
import { mountEulerian } from "./scenes/eulerian";
import { mountIncompressible } from "./scenes/incompressible";
import { mountLagrangian } from "./scenes/lagrangian";
import { mountMaterialVolume } from "./scenes/material-volume";
import { mountOscillator } from "./scenes/oscillator";

const SCENES: Record<string, (root: HTMLElement) => void> = {
  "lagrangian": mountLagrangian,
  "eulerian": mountEulerian,
  "material-volume": mountMaterialVolume,
  "balance": mountBalance,
  "oscillator": mountOscillator,
  "incompressible": mountIncompressible,
  "derivatives": mountDerivatives,
};

for (const root of document.querySelectorAll<HTMLElement>("[data-scene]")) {
  SCENES[root.dataset.scene!](root);
  root.classList.add("fl-ready");
}
