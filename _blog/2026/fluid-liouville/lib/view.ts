/** A point or vector in world coordinates. */
export type Point = [number, number];

/** Axis-aligned rectangle in world coordinates. */
export interface Bounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

/**
 * Camera onto a world plane (y pointing up) that is drawn into a canvas in CSS pixels.
 * The bounds are fit into the canvas with a uniform scale and centered.
 */
export class View {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  /** CSS pixels per world unit. */
  scale = 1;

  constructor(readonly canvas: HTMLCanvasElement, public bounds: Bounds) {
    this.ctx = canvas.getContext("2d")!;
  }

  /**
   * Syncs the backing store with the displayed size and pixel ratio, clears it and
   * sets up drawing in CSS pixels. Returns false if the canvas is not displayed.
   */
  begin(): boolean {
    const { clientWidth: width, clientHeight: height } = this.canvas;
    if (width === 0 || height === 0) return false;

    const ratio = window.devicePixelRatio || 1;
    const backingWidth = Math.round(width * ratio);
    const backingHeight = Math.round(height * ratio);
    if (this.canvas.width !== backingWidth || this.canvas.height !== backingHeight) {
      this.canvas.width = backingWidth;
      this.canvas.height = backingHeight;
    }

    const { xMin, xMax, yMin, yMax } = this.bounds;
    this.width = width;
    this.height = height;
    this.scale = Math.min(width / (xMax - xMin), height / (yMax - yMin));
    this.ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    this.ctx.clearRect(0, 0, width, height);
    return true;
  }

  screenX(x: number): number {
    const { xMin, xMax } = this.bounds;
    return this.width / 2 + (x - (xMin + xMax) / 2) * this.scale;
  }

  screenY(y: number): number {
    const { yMin, yMax } = this.bounds;
    return this.height / 2 - (y - (yMin + yMax) / 2) * this.scale;
  }

  worldX(px: number): number {
    const { xMin, xMax } = this.bounds;
    return (xMin + xMax) / 2 + (px - this.width / 2) / this.scale;
  }

  worldY(py: number): number {
    const { yMin, yMax } = this.bounds;
    return (yMin + yMax) / 2 - (py - this.height / 2) / this.scale;
  }
}
