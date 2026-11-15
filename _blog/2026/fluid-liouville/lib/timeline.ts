/** Longest real time step per frame, so a hiccup (or a background tab) does not skip ahead. */
const MAX_FRAME_SECONDS = 1 / 20;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Plays a drawing of one loop, 0 ≤ progress < 1, over and over, controlled by the play
 * button and the time slider in `root`.
 *
 * It only runs while `root` is on screen, starts paused for readers who prefer reduced
 * motion and redraws whenever `root` changes its size. Dragging the slider holds the
 * animation and lets it continue afterwards.
 */
export class Timeline {
  progress = 0;
  private playing = !reducedMotion.matches;
  private onScreen = false;
  private frame = 0;
  private lastTimestamp = 0;
  private redrawQueued = false;
  private readonly button: HTMLButtonElement;
  private readonly slider: HTMLInputElement;

  /** `seconds` is the real duration of one loop. */
  constructor(
    root: HTMLElement,
    private readonly draw: (progress: number) => void,
    public seconds: number,
  ) {
    this.button = root.querySelector<HTMLButtonElement>(".fl-play")!;
    this.slider = root.querySelector<HTMLInputElement>("input[type='range']")!;

    this.button.addEventListener("click", () => {
      this.setPlaying(!this.playing);
    });

    let resumeAfterDrag = false;
    this.slider.addEventListener("pointerdown", () => {
      resumeAfterDrag = this.playing;
      this.setPlaying(false);
    });
    const release = () => {
      if (resumeAfterDrag) this.setPlaying(true);
      resumeAfterDrag = false;
    };
    this.slider.addEventListener("pointerup", release);
    this.slider.addEventListener("pointercancel", release);
    this.slider.addEventListener("input", () => {
      this.progress = this.slider.valueAsNumber;
      this.redraw();
    });

    new IntersectionObserver((entries) => {
      this.onScreen = entries.some(entry => entry.isIntersecting);
      this.sync();
    }).observe(root);
    new ResizeObserver(() => {
      this.redraw();
    }).observe(root);
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches) this.setPlaying(false);
    });
    // Canvas text falls back to another font until the web fonts are ready.
    void document.fonts.ready.then(() => {
      this.redraw();
    });

    this.setPlaying(this.playing);
  }

  /** Jumps back to the start of the loop, e.g. after the reader changed the scene. */
  restart(): void {
    this.progress = 0;
    this.redraw();
  }

  /** Schedules a single redraw, e.g. after an interaction while paused. */
  redraw(): void {
    if (this.redrawQueued) return;
    this.redrawQueued = true;
    requestAnimationFrame(() => {
      this.redrawQueued = false;
      this.render();
    });
  }

  private render(): void {
    this.slider.value = String(this.progress);
    this.draw(this.progress);
  }

  private setPlaying(playing: boolean): void {
    this.playing = playing;
    this.button.dataset.playing = String(playing);
    this.button.setAttribute("aria-label", playing ? "Pause animation" : "Play animation");
    this.sync();
  }

  /** Starts or stops the frame loop depending on playback state and visibility. */
  private sync(): void {
    const shouldRun = this.playing && this.onScreen;
    if (shouldRun && !this.frame) {
      this.lastTimestamp = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    } else if (!shouldRun && this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private readonly tick = (timestamp: number): void => {
    const seconds = Math.min(Math.max(0, timestamp - this.lastTimestamp) / 1000, MAX_FRAME_SECONDS);
    this.lastTimestamp = timestamp;
    this.progress += seconds / this.seconds;
    if (this.progress >= 1) this.progress = 0;
    this.render();
    this.frame = requestAnimationFrame(this.tick);
  };
}

/**
 * Makes the buttons with a `data-<key>` attribute in `root` a single-choice group: a click
 * marks that button as pressed, unmarks the others and reports its value.
 */
export function bindChoice(
  root: HTMLElement,
  key: string,
  onChange: (value: string, button: HTMLButtonElement) => void,
): void {
  const buttons = [...root.querySelectorAll<HTMLButtonElement>(`[data-${key}]`)];
  for (const button of buttons) {
    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") return;
      buttons.forEach((other) => {
        other.setAttribute("aria-pressed", String(other === button));
      });
      onChange(button.dataset[key]!, button);
    });
  }
}
