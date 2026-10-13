/**
 * Small, dependency-free linear-algebra helpers for the 2-D / small-matrix
 * subset the course needs. Pure and deterministic — reused by the evaluator,
 * the goal checks, and the tests.
 */

import type { MMat, MNum, MValue, MVec } from './types';

/* —— type guards —— */

export function isNum(v: MValue): v is MNum {
  return v.k === 'num';
}
export function isVec(v: MValue): v is MVec {
  return v.k === 'vec';
}
export function isMat(v: MValue): v is MMat {
  return v.k === 'mat';
}

/* —— constructors —— */

export function num(v: number): MNum {
  return { k: 'num', v };
}
export function vec(data: number[]): MVec {
  return { k: 'vec', data };
}
export function mat(rows: number[][]): MMat {
  return { k: 'mat', rows };
}

/* —— vector ops —— */

function sameLen(a: number[], b: number[], what: string): void {
  if (a.length !== b.length) throw new Error(`${what}: length mismatch (${a.length} vs ${b.length})`);
}

export function vAdd(a: number[], b: number[]): number[] {
  sameLen(a, b, 'add');
  return a.map((x, i) => x + b[i]!);
}
export function vSub(a: number[], b: number[]): number[] {
  sameLen(a, b, 'sub');
  return a.map((x, i) => x - b[i]!);
}
export function vScale(a: number[], s: number): number[] {
  return a.map((x) => x * s);
}
export function vDot(a: number[], b: number[]): number {
  sameLen(a, b, 'dot');
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i]! * b[i]!;
  return s;
}
export function vNorm(a: number[]): number {
  return Math.sqrt(vDot(a, a));
}
export function vLen(a: number[]): number {
  return a.length;
}
/** Orthogonal projection of vector `a` onto the line spanned by `b`. */
export function vProj(a: number[], b: number[]): number[] {
  const bb = vDot(b, b);
  if (bb === 0) throw new Error('proj: target vector is the zero vector');
  const t = vDot(a, b) / bb;
  return vScale(b, t);
}
/** 3-D cross product. */
export function vCross(a: number[], b: number[]): number[] {
  if (a.length !== 3 || b.length !== 3) throw new Error('cross: both vectors must be 3-D');
  return [
    a[1]! * b[2]! - a[2]! * b[1]!,
    a[2]! * b[0]! - a[0]! * b[2]!,
    a[0]! * b[1]! - a[1]! * b[0]!,
  ];
}

/* —— matrix ops —— */

export function matTranspose(rows: number[][]): number[][] {
  const r = rows.length;
  const c = rows[0]?.length ?? 0;
  const out: number[][] = [];
  for (let j = 0; j < c; j++) {
    const row: number[] = [];
    for (let i = 0; i < r; i++) row.push(rows[i]![j]!);
    out.push(row);
  }
  return out;
}

export function matVec(rows: number[][], v: number[]): number[] {
  const r = rows.length;
  const c = rows[0]?.length ?? 0;
  if (c !== v.length) throw new Error(`matVec: matrix has ${c} cols, vector has length ${v.length}`);
  const out: number[] = [];
  for (let i = 0; i < r; i++) out.push(vDot(rows[i]!, v));
  return out;
}

export function matMul(a: number[][], b: number[][]): number[][] {
  const ra = a.length;
  const ca = a[0]?.length ?? 0;
  const cb = b[0]?.length ?? 0;
  if (b.length !== ca) throw new Error(`matMul: ${ca} cols in A vs ${b.length} rows in B`);
  const out: number[][] = [];
  for (let i = 0; i < ra; i++) {
    const row: number[] = [];
    for (let j = 0; j < cb; j++) {
      let s = 0;
      for (let k = 0; k < ca; k++) s += a[i]![k]! * b[k]![j]!;
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

export function matScale(rows: number[][], s: number): number[][] {
  return rows.map((r) => r.map((x) => x * s));
}

export function matAdd(a: number[][], b: number[][]): number[][] {
  if (a.length !== b.length || (a[0]?.length ?? 0) !== (b[0]?.length ?? 0)) {
    throw new Error('matAdd: shape mismatch');
  }
  return a.map((r, i) => r.map((x, j) => x + b[i]![j]!));
}

/** Determinant for 1×1, 2×2, and 3×3 square matrices (Sarrus / cofactor). */
export function det(rows: number[][]): number {
  const n = rows.length;
  if (n === 0) throw new Error('det: empty matrix');
  if (rows.some((r) => r.length !== n)) throw new Error('det: matrix is not square');
  if (n === 1) return rows[0]![0]!;
  if (n === 2) {
    const [a, b, c, d] = [rows[0]![0]!, rows[0]![1]!, rows[1]![0]!, rows[1]![1]!];
    return a * d - b * c;
  }
  if (n === 3) {
    const m = rows;
    return (
      m[0]![0]! * (m[1]![1]! * m[2]![2]! - m[1]![2]! * m[2]![1]!) -
      m[0]![1]! * (m[1]![0]! * m[2]![2]! - m[1]![2]! * m[2]![0]!) +
      m[0]![2]! * (m[1]![0]! * m[2]![1]! - m[1]![1]! * m[2]![0]!)
    );
  }
  throw new Error('det: only 1×1, 2×2 and 3×3 matrices are supported');
}

/** Sum of the diagonal of a square matrix. */
export function trace(rows: number[][]): number {
  let s = 0;
  for (let i = 0; i < rows.length; i++) s += rows[i]![i] ?? 0;
  return s;
}

/**
 * The 2×2 minor of a square matrix with row `i` and column `j` removed.
 * Used to build the cofactor matrix in `inv`.
 */
function minor2x2(rows: number[][], i: number, j: number): number[][] {
  const out: number[][] = [];
  for (let r = 0; r < rows.length; r++) {
    if (r === i) continue;
    const row: number[] = [];
    for (let c = 0; c < rows[r]!.length; c++) {
      if (c === j) continue;
      row.push(rows[r]![c]!);
    }
    out.push(row);
  }
  return out;
}

/**
 * Inverse of a 2×2 or 3×3 matrix (the 3×3 path uses the adjugate / cofactor
 * method). Throws for singular or non-square input.
 */
export function inv(rows: number[][]): number[][] {
  const n = rows.length;
  if (rows.some((r) => r.length !== n)) throw new Error('inv: matrix is not square');
  if (n === 2) {
    const [a, b, c, d] = [rows[0]![0]!, rows[0]![1]!, rows[1]![0]!, rows[1]![1]!];
    const det2 = det(rows);
    if (Math.abs(det2) < 1e-12) throw new Error('inv: matrix is singular');
    const s = 1 / det2;
    // [[a, b], [c, d]]^-1 = 1/det * [[d, -b], [-c, a]]
    return [[d * s, -b * s], [-c * s, a * s]];
  }
  if (n === 3) {
    const d = det(rows);
    if (Math.abs(d) < 1e-12) throw new Error('inv: matrix is singular');
    // Cofactor matrix (row-major), then adjugate = transpose / det.
    const C: number[][] = [];
    for (let i = 0; i < 3; i++) {
      const row: number[] = [];
      for (let j = 0; j < 3; j++) {
        const minor = minor2x2(rows, i, j);
        row.push(((i + j) % 2 === 0 ? 1 : -1) * det(minor));
      }
      C.push(row);
    }
    return matScale(matTranspose(C), 1 / d);
  }
  throw new Error('inv: only 2×2 and 3×3 matrices are supported');
}

/**
 * Rank via row-reduction with partial pivoting. Works for small matrices
 * (any shape up to ~6×6 comfortably); uses a tolerance for numerical safety.
 */
export function rank(rows: number[][], tol = 1e-9): number {
  const a = rows.map((r) => [...r]);
  const n = a.length;
  const m = a[0]?.length ?? 0;
  let r = 0;
  for (let c = 0; c < m && r < n; c++) {
    // find pivot in column c at or below row r
    let pivot = r;
    for (let i = r + 1; i < n; i++) if (Math.abs(a[i]![c]!) > Math.abs(a[pivot]![c]!)) pivot = i;
    if (Math.abs(a[pivot]![c]!) <= tol) continue;
    [a[r], a[pivot]] = [a[pivot], a[r]];
    for (let i = r + 1; i < n; i++) {
      const factor = a[i]![c]! / a[r]![c]!;
      for (let k = c; k < m; k++) a[i]![k] = a[i]![k]! - factor * a[r]![k]!;
    }
    r++;
  }
  return r;
}

/**
 * Eigenpairs of a 2×2 matrix via the characteristic polynomial. For a symmetric
 * 2×2 the two eigenvectors are orthogonal. Returns `[{value, vector}]` with the
 * eigenvectors normalized. Throws for non-2×2 (SVD is the 2-D decompositions
 * capstone handled at the level, not as a general builtin).
 */
export function eig(rows: number[][]): Array<{ value: number; vector: number[] }> {
  if (rows.length !== 2 || rows[0]?.length !== 2) throw new Error('eig: only 2×2 matrices are supported');
  const a = rows[0]![0]!;
  const b = rows[0]![1]!;
  const c = rows[1]![0]!;
  const d = rows[1]![1]!;
  const tr = a + d;
  const disc = Math.sqrt(Math.max(0, tr * tr - 4 * (a * d - b * c)));
  const l1 = (tr + disc) / 2;
  const l2 = (tr - disc) / 2;
  const vecFor = (l: number): number[] => {
    // (A - lI) v = 0 → pick the row with larger coefficient, solve.
    let v: number[];
    if (Math.abs(a - l) + Math.abs(b) >= Math.abs(c) + Math.abs(d - l)) {
      v = [b, l - a];
    } else {
      v = [l - d, c];
    }
    const n = Math.hypot(v[0]!, v[1]!);
    if (n < 1e-12) v = [1, 0];
    else v = [v[0]! / n, v[1]! / n];
    return v;
  };
  return [
    { value: l1, vector: vecFor(l1) },
    { value: l2, vector: vecFor(l2) },
  ];
}

/* —— formatting —— */

export function fmtNum(x: number): string {
  if (Number.isInteger(x)) return String(x);
  const r = Math.round(x * 1000) / 1000;
  return String(r);
}
export function fmtVec(data: number[]): string {
  return '[' + data.map(fmtNum).join(', ') + ']';
}
export function fmtMat(rows: number[][]): string {
  return '[' + rows.map((r) => '[' + r.map(fmtNum).join(', ') + ']').join(', ') + ']';
}
