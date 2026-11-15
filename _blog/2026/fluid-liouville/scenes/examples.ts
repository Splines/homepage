import { normal, type Random } from "../lib/random";
import type { Bounds, Point } from "../lib/view";

/**
 * An ensemble moving through a two-dimensional phase space (q, p), with everything
 * known exactly: the flow map and the density at every point and time.
 */
export interface PhaseExample {
  bounds: Bounds;
  /** Simulated duration of one loop. */
  period: number;
  /** Simulated time units per real second. */
  speed: number;
  /** Phase-space density ρ(q, p, t). */
  density(q: number, p: number, t: number): number;
  /** Density that is drawn with full opacity. */
  densityScale: number;
  /** Position at time t of the copy that started at `start`. */
  flow(start: Point, t: number): Point;
  /** Draws a start position of a copy from the initial density. */
  sample(random: Random): Point;
  /** Start of the copy the riding observer sits on. */
  riderStart: Point;
  /** Position of the observer who stands still. */
  fixedPoint: Point;
  /** If set, q is an angle with this period, and positions are wrapped into the bounds. */
  qPeriod?: number;
}

const TAU = 2 * Math.PI;

/** Normalized axis-aligned Gaussian density around `center`. */
function gaussian(center: Point, spread: Point) {
  const peak = 1 / (TAU * spread[0] * spread[1]);
  return {
    peak,
    density: (q: number, p: number) => {
      const u = (q - center[0]) / spread[0];
      const v = (p - center[1]) / spread[1];
      return peak * Math.exp(-0.5 * (u * u + v * v));
    },
    sample: (random: Random): Point => [
      center[0] + spread[0] * normal(random),
      center[1] + spread[1] * normal(random),
    ],
  };
}

/** Harmonic oscillator H = (q² + p²)/2: phase space turns clockwise like a rigid body. */
function rotate([q, p]: Point, t: number): Point {
  const c = Math.cos(t);
  const s = Math.sin(t);
  return [q * c + p * s, -q * s + p * c];
}

const OSCILLATOR_BOUNDS: Bounds = { xMin: -3, xMax: 3, yMin: -3, yMax: 3 };

/** A Gaussian blob in the harmonic oscillator: dρ/dt = 0, but ∂ρ/∂t ≠ 0. */
function blob(): PhaseExample {
  const initial = gaussian([1.9, 0], [0.45, 0.28]);
  return {
    bounds: OSCILLATOR_BOUNDS,
    period: TAU,
    speed: 0.8,
    density: (q, p, t) => initial.density(...rotate([q, p], -t)),
    densityScale: initial.peak,
    flow: rotate,
    sample: initial.sample,
    riderStart: [2.05, 0.12],
    fixedPoint: [0, -1.9],
  };
}

/** A density that depends only on the energy, ρ = Φ(H): dρ/dt = 0 and ∂ρ/∂t = 0. */
function ring(): PhaseExample {
  const energy = 1.8;
  const spread = 0.3;
  const peak = 1 / (TAU * Math.sqrt(TAU) * spread);
  const phi = (h: number) => peak * Math.exp(-0.5 * ((h - energy) / spread) ** 2);
  return {
    bounds: OSCILLATOR_BOUNDS,
    period: TAU,
    speed: 0.8,
    density: (q, p) => phi((q * q + p * p) / 2),
    densityScale: peak,
    flow: rotate,
    sample: (random) => {
      const h = Math.max(1e-4, energy + spread * normal(random));
      const angle = TAU * random();
      const r = Math.sqrt(2 * h);
      return [r * Math.cos(angle), r * Math.sin(angle)];
    },
    riderStart: [2.1, 0],
    // In the middle of the ring, where the density is highest.
    fixedPoint: [0, -Math.sqrt(2 * energy)],
  };
}

/**
 * Damped oscillator q̇ = p, ṗ = −q − γp. The flow is linear, x(t) = M(t) x(0),
 * and squeezes areas by det M = exp(−γt): dρ/dt ≠ 0 and ∂ρ/∂t ≠ 0.
 */
function damped(): PhaseExample {
  const gamma = 0.3;
  const a = gamma / 2;
  const omega = Math.sqrt(1 - a * a);
  // The density is evaluated for many points at the same time, so remember the last matrix.
  let cachedTime = NaN;
  let cachedMatrix = [1, 0, 0, 1];
  const matrix = (t: number) => {
    if (t === cachedTime) return cachedMatrix;
    const e = Math.exp(-a * t);
    const c = Math.cos(omega * t);
    const s = Math.sin(omega * t);
    cachedTime = t;
    const m11 = e * (c + (a / omega) * s);
    const m12 = (e * s) / omega;
    const m21 = (-e * s) / omega;
    const m22 = e * (c - (a / omega) * s);
    cachedMatrix = [m11, m12, m21, m22];
    return cachedMatrix;
  };
  const initial = gaussian([2, 0], [0.3, 0.3]);
  const flow = ([q, p]: Point, t: number): Point => {
    const [m11, m12, m21, m22] = matrix(t);
    return [m11 * q + m12 * p, m21 * q + m22 * p];
  };
  return {
    bounds: OSCILLATOR_BOUNDS,
    period: 7,
    speed: 0.9,
    density: (q, p, t) => {
      const [m11, m12, m21, m22] = matrix(t);
      const det = m11 * m22 - m12 * m21;
      return initial.density((m22 * q - m12 * p) / det, (-m21 * q + m11 * p) / det) / det;
    },
    densityScale: 3 * initial.peak,
    flow,
    sample: initial.sample,
    riderStart: [2.08, 0.06],
    fixedPoint: flow([2, 0], 1.7),
  };
}

/**
 * A made-up, non-Hamiltonian flow on a ring: q̇ = 1 + a sin q, ṗ = 0. Copies jam where
 * they are slow, but the jam stays in place: ∂ρ/∂t = 0, while dρ/dt ≠ 0.
 */
function traffic(): PhaseExample {
  const a = 0.7;
  const spread = 0.9;
  const speedAt = (q: number) => 1 + a * Math.sin(q);
  const normalization = TAU / Math.sqrt(1 - a * a);
  const profile = (p: number) => Math.exp(-0.5 * (p / spread) ** 2) / (Math.sqrt(TAU) * spread);

  // Travel time τ(q) from −π to q, tabulated so it can be inverted.
  const samples = 4096;
  const angleStep = TAU / samples;
  const angles = Float64Array.from({ length: samples + 1 }, (_, i) => -Math.PI + i * angleStep);
  const travelTime = new Float64Array(samples + 1);
  for (let i = 1; i <= samples; i++) {
    // Trapezoidal rule for the integral of dq / q̇.
    const slowness = 0.5 * (1 / speedAt(angles[i - 1]) + 1 / speedAt(angles[i]));
    travelTime[i] = travelTime[i - 1] + slowness * angleStep;
  }
  const lap = travelTime[samples];
  const wrap = (q: number) => ((((q + Math.PI) % TAU) + TAU) % TAU) - Math.PI;
  const timeAt = (q: number) => {
    const x = ((wrap(q) + Math.PI) / TAU) * samples;
    const i = Math.min(samples - 1, Math.floor(x));
    return travelTime[i] + (x - i) * (travelTime[i + 1] - travelTime[i]);
  };
  const angleAt = (time: number) => {
    let low = 0;
    let high = samples;
    while (high - low > 1) {
      const middle = (low + high) >> 1;
      if (travelTime[middle] <= time) low = middle;
      else high = middle;
    }
    const f = (time - travelTime[low]) / (travelTime[high] - travelTime[low]);
    return angles[low] + f * (angles[high] - angles[low]);
  };

  return {
    bounds: { xMin: -Math.PI, xMax: Math.PI, yMin: -3, yMax: 3 },
    period: lap,
    speed: 1,
    density: (q, p) => profile(p) / (normalization * speedAt(wrap(q))),
    densityScale: (0.9 * profile(0)) / (normalization * (1 - a)),
    // Unwrapped: q keeps growing lap after lap. The scene wraps it back into the bounds.
    flow: ([q, p], t) => {
      const time = timeAt(q) + t;
      const laps = Math.floor(time / lap);
      return [angleAt(time - laps * lap) + TAU * laps, p];
    },
    sample: (random) => {
      let q: number;
      do q = -Math.PI + TAU * random();
      while (random() > (1 - a) / speedAt(q));
      return [q, spread * normal(random)];
    },
    riderStart: [0.6, 0.5],
    fixedPoint: [-Math.PI / 2, 0],
    qPeriod: TAU,
  };
}

/** All examples, keyed by the `data-example` value of their button. */
export const EXAMPLES: Record<string, () => PhaseExample> = { blob, ring, damped, traffic };
