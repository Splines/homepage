/** Red, green and blue channels in 0–255. */
export type RGB = [number, number, number];

/** Colors shared by all animations of the post. */
export interface Palette {
  /** Background of the canvases, also used for halos that separate marks from the background. */
  paper: string;
  /** Fluid particles or copies of the system. */
  ink: string;
  /** Background particles and guides that should stay in the background. */
  muted: string;
  /** Very light guide lines. */
  faint: string;
  /** Things that move with the flow: material volumes, the observer riding along. */
  accent: string;
  /** Things fixed in space: control volumes, the observer standing still. */
  fixed: string;
  /** Color wash of a density field. */
  density: RGB;
  /** Particles entering a fixed region. */
  inflow: string;
  /** Particles leaving a fixed region. */
  outflow: string;
}

/**
 * Reads the palette from the `--fl-*` custom properties on `element`, so the
 * stylesheet stays the single source of truth for the design.
 */
export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const color = (name: string) => style.getPropertyValue(`--fl-${name}`).trim();
  return {
    paper: color("paper"),
    ink: color("ink"),
    muted: color("muted"),
    faint: color("faint"),
    accent: color("accent"),
    fixed: color("fixed"),
    density: hexToRgb(color("density")),
    inflow: color("inflow"),
    outflow: color("outflow"),
  };
}

/** Parses `#rgb` or `#rrggbb`. */
export function hexToRgb(hex: string): RGB {
  let digits = hex.replace("#", "");
  if (digits.length === 3) digits = digits.replace(/./g, "$&$&");
  const value = parseInt(digits, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}
