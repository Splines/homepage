/** Colors shared by all animations, documented next to their `--fl-*` custom properties. */
const COLORS = [
  "paper",
  "ink",
  "muted",
  "faint",
  "accent",
  "fixed",
  "density",
  "inflow",
  "outflow",
  "text",
] as const;

export type Palette = Record<(typeof COLORS)[number], string>;

/**
 * Reads the palette from the `--fl-*` custom properties on `element`, so the
 * stylesheet stays the single source of truth for the design.
 */
export function readPalette(element: Element): Palette {
  const style = getComputedStyle(element);
  const entries = COLORS.map(name => [name, style.getPropertyValue(`--fl-${name}`).trim()]);
  return Object.fromEntries(entries) as Palette;
}
