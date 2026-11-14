/** Something a {@link Clock} can play in a loop. */
export interface Animation {
  /** Simulated duration of one loop. Afterwards, time jumps back to 0. */
  readonly period: number;
  /** Simulated time units per real second. */
  readonly speed: number;
  /** Restores the state at t = 0. */
  reset(): void;
  /** Advances the state to time `t`, which is `dt` after the previous call. */
  update(t: number, dt: number): void;
  /** Renders the current state. */
  draw(t: number): void;
}

/** Longest real time step per frame, so a hiccup (or a background tab) does not skip ahead. */
const MAX_FRAME_SECONDS = 1 / 20;

const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

/**
 * Plays an animation in an endless loop, restarting at t = 0 without a transition.
 *
 * It only runs while `root` is on screen, starts paused for readers who prefer
 * reduced motion and redraws whenever `root` changes its size.
 */
export class Clock {
  time = 0;
  private wantsToPlay = !reducedMotion.matches;
  private onScreen = false;
  private frame = 0;
  private lastTimestamp = 0;
  private redrawQueued = false;
  private readonly listeners: (() => void)[] = [];

  constructor(private readonly animation: Animation, root: HTMLElement) {
    animation.reset();
    animation.update(0, 0);

    new IntersectionObserver((entries) => {
      this.onScreen = entries.some(entry => entry.isIntersecting);
      this.sync();
    }).observe(root);
    new ResizeObserver(() => this.redraw()).observe(root);
    reducedMotion.addEventListener("change", () => {
      if (reducedMotion.matches && this.wantsToPlay) this.toggle();
    });
    // Canvas text falls back to another font until the web fonts are ready.
    void document.fonts.ready.then(() => this.redraw());
  }

  get playing(): boolean {
    return this.wantsToPlay;
  }

  toggle(): void {
    this.wantsToPlay = !this.wantsToPlay;
    this.sync();
    this.listeners.forEach(listener => listener());
  }

  /** Calls `listener` whenever playback is started or paused. */
  onToggle(listener: () => void): void {
    this.listeners.push(listener);
  }

  /** Jumps back to t = 0, e.g. after the reader changed the scene. */
  restart(): void {
    this.time = 0;
    this.animation.reset();
    this.animation.update(0, 0);
    this.redraw();
  }

  /** Schedules a single redraw, e.g. after an interaction while paused. */
  redraw(): void {
    if (this.redrawQueued) return;
    this.redrawQueued = true;
    requestAnimationFrame(() => {
      this.redrawQueued = false;
      this.animation.draw(this.time);
    });
  }

  /** Starts or stops the frame loop depending on playback state and visibility. */
  private sync(): void {
    const shouldRun = this.wantsToPlay && this.onScreen;
    if (shouldRun && !this.frame) {
      this.lastTimestamp = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
    else if (!shouldRun && this.frame) {
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }

  private readonly tick = (timestamp: number): void => {
    const seconds = Math.min(Math.max(0, timestamp - this.lastTimestamp) / 1000, MAX_FRAME_SECONDS);
    this.lastTimestamp = timestamp;
    this.advance(seconds * this.animation.speed);
    this.animation.draw(this.time);
    this.frame = requestAnimationFrame(this.tick);
  };

  private advance(dt: number): void {
    this.time += dt;
    if (this.time < this.animation.period) {
      this.animation.update(this.time, dt);
      return;
    }
    this.time = 0;
    this.animation.reset();
    this.animation.update(0, 0);
  }
}
