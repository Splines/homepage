import type { Clock } from "./clock";
import type { Point, View } from "./view";

/** Finds a required element inside `root`, failing loudly if the markup is incomplete. */
export function requireElement<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Missing element: ${selector}`);
  return element;
}

/** Keeps a play/pause button's icon (via `data-playing`) and label in sync with a clock. */
export function bindPlayButton(button: HTMLButtonElement, clock: Clock): void {
  const sync = () => {
    button.dataset.playing = String(clock.playing);
    button.setAttribute("aria-label", clock.playing ? "Pause animation" : "Play animation");
  };
  button.addEventListener("click", () => clock.toggle());
  clock.onToggle(sync);
  sync();
}

/**
 * Makes `buttons` a single-choice group: a click marks that button as pressed,
 * unmarks the others and reports its `data-<key>` value.
 */
export function bindChoice(buttons: HTMLButtonElement[], key: string, onChange: (value: string) => void): void {
  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      buttons.forEach(other => other.setAttribute("aria-pressed", String(other === button)));
      onChange(button.dataset[key] ?? "");
    });
  }
}

/** Arrow keys and the direction they move a draggable point in (world units, y up). */
const ARROW_DIRECTIONS: Record<string, Point> = {
  ArrowLeft: [-1, 0],
  ArrowRight: [1, 0],
  ArrowUp: [0, 1],
  ArrowDown: [0, -1],
};

/**
 * Lets the reader move a world point by dragging `handle` over the canvas of `view`,
 * or with the arrow keys while the handle has focus (Shift for larger steps).
 * `move` receives the requested position and is responsible for clamping it.
 */
export function bindDraggable(
  handle: HTMLElement,
  view: View,
  position: () => Point,
  move: (target: Point) => void,
  keyStep = 0.05,
): void {
  let grab: Point | null = null;

  const pointerToWorld = (event: PointerEvent): Point => {
    const rect = view.canvas.getBoundingClientRect();
    return [view.worldX(event.clientX - rect.left), view.worldY(event.clientY - rect.top)];
  };

  handle.addEventListener("pointerdown", (event) => {
    const [x, y] = pointerToWorld(event);
    const [px, py] = position();
    grab = [x - px, y - py];
    handle.setPointerCapture(event.pointerId);
    event.preventDefault();
  });
  handle.addEventListener("pointermove", (event) => {
    if (!grab) return;
    const [x, y] = pointerToWorld(event);
    move([x - grab[0], y - grab[1]]);
  });
  const release = () => {
    grab = null;
  };
  handle.addEventListener("pointerup", release);
  handle.addEventListener("pointercancel", release);

  handle.addEventListener("keydown", (event) => {
    const direction = ARROW_DIRECTIONS[event.key];
    if (!direction) return;
    const step = event.shiftKey ? 4 * keyStep : keyStep;
    const [x, y] = position();
    move([x + direction[0] * step, y + direction[1] * step]);
    event.preventDefault();
  });
}

/** Writes `value` into an `<output>` (or any element), touching the DOM only on change. */
export function setText(element: Element, value: string): void {
  if (element.textContent !== value) element.textContent = value;
}
