import { Clock, type Animation } from "./clock";

/** Keeps a play/pause button's icon (via `data-playing`) and label in sync with a clock. */
export function bindPlayButton(button: HTMLButtonElement, clock: Clock): void {
  const sync = () => {
    button.dataset.playing = String(clock.playing);
    button.setAttribute("aria-label", clock.playing ? "Pause animation" : "Play animation");
  };
  button.addEventListener("click", () => {
    clock.toggle();
  });
  clock.onToggle(sync);
  sync();
}

/**
 * Makes `buttons` a single-choice group: a click marks that button as pressed,
 * unmarks the others and reports its `data-<key>` value.
 */
export function bindChoice(
  buttons: HTMLButtonElement[],
  key: string,
  onChange: (value: string) => void,
): void {
  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      buttons.forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
      onChange(button.dataset[key] ?? "");
    });
  }
}

/** Writes `value` into an `<output>` (or any element), touching the DOM only on change. */
export function setText(element: Element, value: string): void {
  if (element.textContent !== value) element.textContent = value;
}

/**
 * Plays a drawing of 0 ≤ t ≤ 1 in a loop of `seconds` real seconds, controlled by the
 * play button and the time slider in `root`. Dragging the slider holds the animation
 * and lets it continue afterwards. Returns the clock, e.g. to redraw after an interaction.
 */
export function playTimeline(root: HTMLElement, draw: (t: number) => void, seconds = 8): Clock {
  const slider = root.querySelector<HTMLInputElement>("input[type='range']")!;
  const animation: Animation = {
    period: 1,
    speed: 1 / seconds,
    reset() {},
    update() {},
    draw(t) {
      slider.value = String(t);
      draw(t);
    },
  };

  const clock = new Clock(animation, root);
  bindPlayButton(root.querySelector<HTMLButtonElement>(".fl-play")!, clock);
  bindTimeSlider(slider, clock, 1);
  return clock;
}

/**
 * Lets a slider from 0 to 1 seek `clock` within a loop of the given simulated `period`.
 * Dragging holds the animation and lets it continue afterwards. Keeping the slider in
 * sync with the clock is up to the animation's `draw`.
 */
export function bindTimeSlider(slider: HTMLInputElement, clock: Clock, period: number): void {
  let resumeAfterDrag = false;
  slider.addEventListener("pointerdown", () => {
    resumeAfterDrag = clock.playing;
    if (resumeAfterDrag) clock.toggle();
  });
  const release = () => {
    if (resumeAfterDrag && !clock.playing) clock.toggle();
    resumeAfterDrag = false;
  };
  slider.addEventListener("pointerup", release);
  slider.addEventListener("pointercancel", release);
  slider.addEventListener("input", () => {
    clock.seek(slider.valueAsNumber * period);
  });
}
