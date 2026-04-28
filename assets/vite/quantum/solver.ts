/**
 * Finite-difference ground-state solver for two same-spin electrons in a 1D box.
 *
 * The wavefunction is sampled on a uniform grid r_i = i / (N-1) and stored
 * via its strictly upper-triangular interior pairs (1 <= i < j <= N-2).
 * Antisymmetry psi(i,j) = -psi(j,i) and the diagonal-zero constraint reduce
 * the eigenvalue problem to those interior pairs.
 *
 * The ground state is found by inverse iteration with shift 0: each step
 * solves H x = c via conjugate gradient and re-normalizes.
 */

export interface GridData {
  readonly nGrid: number;
  readonly dr: number;
  readonly pairI: Int16Array;
  readonly pairJ: Int16Array;
  readonly neighbors: Int32Array;
  readonly coulombFactors: Float64Array;
  readonly matrixSize: number;
}

export interface Solution {
  readonly lambda: number;
  readonly psi: Float64Array;
  readonly energy: number;
  readonly maxAbs: number;
}

export function buildGridData(nGrid: number): GridData {
  const dr = 1 / (nGrid - 1);
  const r = new Float64Array(nGrid);
  for (let i = 0; i < nGrid; i += 1) {
    r[i] = i * dr;
  }

  const pairsI: number[] = [];
  const pairsJ: number[] = [];
  for (let i = 1; i < nGrid - 1; i += 1) {
    for (let j = i + 1; j < nGrid - 1; j += 1) {
      pairsI.push(i);
      pairsJ.push(j);
    }
  }

  const matrixSize = pairsI.length;
  const pairI = Int16Array.from(pairsI);
  const pairJ = Int16Array.from(pairsJ);

  const pairIndex = new Int32Array(nGrid * nGrid).fill(-1);
  for (let k = 0; k < matrixSize; k += 1) {
    pairIndex[pairI[k] * nGrid + pairJ[k]] = k;
  }

  const neighbors = new Int32Array(matrixSize * 4).fill(-1);
  const coulombFactors = new Float64Array(matrixSize);
  const offsets: ReadonlyArray<readonly [number, number]> = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ];

  for (let k = 0; k < matrixSize; k += 1) {
    const i = pairI[k];
    const j = pairJ[k];
    coulombFactors[k] = 1 / Math.abs(r[j] - r[i]);

    for (let n = 0; n < 4; n += 1) {
      const ii = i + offsets[n][0];
      const jj = j + offsets[n][1];
      if (ii >= 0 && ii < nGrid && jj >= 0 && jj < nGrid && ii < jj) {
        neighbors[k * 4 + n] = pairIndex[ii * nGrid + jj];
      }
    }
  }

  return { nGrid, dr, pairI, pairJ, neighbors, coulombFactors, matrixSize };
}

function hamiltonianMatVec(
  vector: Float64Array,
  output: Float64Array,
  lambda: number,
  grid: GridData,
): void {
  const invDr2 = 1 / (grid.dr * grid.dr);
  const diagonalBase = 2 * invDr2;
  const offDiagonal = -0.5 * invDr2;

  for (let k = 0; k < grid.matrixSize; k += 1) {
    let sum = (diagonalBase + lambda * grid.coulombFactors[k]) * vector[k];
    const offset = k * 4;
    for (let n = 0; n < 4; n += 1) {
      const idx = grid.neighbors[offset + n];
      if (idx >= 0) {
        sum += offDiagonal * vector[idx];
      }
    }
    output[k] = sum;
  }
}

function dot(a: Float64Array, b: Float64Array): number {
  let value = 0;
  for (let i = 0; i < a.length; i += 1) {
    value += a[i] * b[i];
  }
  return value;
}

function l2Norm(vector: Float64Array): number {
  return Math.sqrt(dot(vector, vector));
}

function scaleInPlace(vector: Float64Array, factor: number): void {
  for (let i = 0; i < vector.length; i += 1) {
    vector[i] *= factor;
  }
}

function addScaledInPlace(target: Float64Array, source: Float64Array, scale: number): void {
  for (let i = 0; i < target.length; i += 1) {
    target[i] += scale * source[i];
  }
}

function solveLinearSystemCG(
  lambda: number,
  rhs: Float64Array,
  grid: GridData,
  maxIter = 1600,
  tolerance = 1e-11,
): Float64Array {
  const x = new Float64Array(rhs.length);
  const residual = Float64Array.from(rhs);
  const direction = Float64Array.from(residual);
  const ad = new Float64Array(rhs.length);

  let residualSq = dot(residual, residual);
  if (Math.sqrt(residualSq) < tolerance) {
    return x;
  }

  for (let iter = 0; iter < maxIter; iter += 1) {
    hamiltonianMatVec(direction, ad, lambda, grid);
    const alpha = residualSq / dot(direction, ad);
    addScaledInPlace(x, direction, alpha);
    addScaledInPlace(residual, ad, -alpha);

    const nextResidualSq = dot(residual, residual);
    if (Math.sqrt(nextResidualSq) < tolerance) {
      break;
    }

    const beta = nextResidualSq / residualSq;
    for (let i = 0; i < direction.length; i += 1) {
      direction[i] = residual[i] + beta * direction[i];
    }
    residualSq = nextResidualSq;
  }

  return x;
}

function reconstructWavefunction(coefficients: Float64Array, grid: GridData): Float64Array {
  const psi = new Float64Array(grid.nGrid * grid.nGrid);
  for (let k = 0; k < grid.matrixSize; k += 1) {
    const i = grid.pairI[k];
    const j = grid.pairJ[k];
    const value = coefficients[k];
    psi[i * grid.nGrid + j] = value;
    psi[j * grid.nGrid + i] = -value;
  }
  return psi;
}

export function solveGroundState(lambda: number, grid: GridData): Solution {
  const coefficients = new Float64Array(grid.matrixSize);
  for (let i = 0; i < coefficients.length; i += 1) {
    coefficients[i] = Math.sin((i + 1) * 0.37);
  }
  scaleInPlace(coefficients, 1 / l2Norm(coefficients));

  const hCoefficients = new Float64Array(grid.matrixSize);

  for (let iter = 0; iter < 18; iter += 1) {
    const next = solveLinearSystemCG(lambda, coefficients, grid);
    const norm = l2Norm(next);
    if (norm > 0) {
      scaleInPlace(next, 1 / norm);
    }
    coefficients.set(next);

    hamiltonianMatVec(coefficients, hCoefficients, lambda, grid);
    const energy = dot(coefficients, hCoefficients);
    let residualNormSq = 0;
    for (let i = 0; i < coefficients.length; i += 1) {
      const value = hCoefficients[i] - energy * coefficients[i];
      residualNormSq += value * value;
    }
    if (Math.sqrt(residualNormSq) < 1e-7) {
      break;
    }
  }

  hamiltonianMatVec(coefficients, hCoefficients, lambda, grid);
  const energy = dot(coefficients, hCoefficients);

  const psi = reconstructWavefunction(coefficients, grid);
  const normalizationFactor = Math.sqrt(dot(psi, psi) * grid.dr * grid.dr);
  if (normalizationFactor > 0) {
    scaleInPlace(psi, 1 / normalizationFactor);
  }

  let maxAbs = 0;
  let signProbe = 0;
  for (let i = 0; i < psi.length; i += 1) {
    const absValue = Math.abs(psi[i]);
    if (absValue > maxAbs) {
      maxAbs = absValue;
      signProbe = psi[i];
    }
  }
  if (signProbe < 0) {
    scaleInPlace(psi, -1);
  }

  return { lambda, psi, energy, maxAbs };
}
