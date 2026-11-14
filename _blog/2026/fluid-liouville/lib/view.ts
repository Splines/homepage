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
 *
 * The bounds are fit into the canvas with a uniform scale and centered. The offset
 * shifts the camera without zooming, e.g. to ride along with a particle.
 */
export class View {
  readonly ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  scale = 1;
  offset: Point = [0, 0];

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

  /** World point at the center of the canvas. */
  get center(): Point {
    const { xMin, xMax, yMin, yMax } = this.bounds;
    return [(xMin + xMax) / 2 + this.offset[0], (yMin + yMax) / 2 + this.offset[1]];
  }

  screenX(x: number): number {
    return this.width / 2 + (x - this.center[0]) * this.scale;
  }

  screenY(y: number): number {
    return this.height / 2 - (y - this.center[1]) * this.scale;
  }

  worldX(px: number): number {
    return this.center[0] + (px - this.width / 2) / this.scale;
  }

  worldY(py: number): number {
    return this.center[1] - (py - this.height / 2) / this.scale;
  }

  /** World rectangle that is currently visible on the canvas. */
  visible(): Bounds {
    return {
      xMin: this.worldX(0),
      xMax: this.worldX(this.width),
      yMin: this.worldY(this.height),
      yMax: this.worldY(0),
    };
  }
}
