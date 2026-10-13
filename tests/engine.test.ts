/**
 * Engine unit tests: the tokenizer → parser → evaluator pipeline, the linalg
 * helpers, and the goal predicates.
 */

import { test, expect } from 'vitest';
import * as li from '../src/engine/linalg';
import { runFresh, snapshot } from '../src/engine/session';
import { preds, vClose, close } from '../src/engine/checks';
import type { MMat, MNum, MVec } from '../src/engine/types';

function num(state: ReturnType<typeof runFresh>, name: string): number {
  return (state.bindings[name] as MNum).v;
}
function vec(state: ReturnType<typeof runFresh>, name: string): number[] {
  return (state.bindings[name] as MVec).data;
}
function mat(state: ReturnType<typeof runFresh>, name: string): number[][] {
  return (state.bindings[name] as MMat).rows;
}

test('vector construction and arithmetic', () => {
  const s = runFresh('a = [1, 2]\nb = [3, 4]\nc = a + b\nd = a - b\nf = 3 * a');
  expect(li.isVec(s.bindings['c']!)).toBe(true);
  expect(vClose(vec(s, 'c'), [4, 6])).toBe(true);
  expect(vClose(vec(s, 'd'), [-2, -2])).toBe(true);
  expect(vClose(vec(s, 'f'), [3, 6])).toBe(true);
});

test('dot, norm, len builtins', () => {
  const s = runFresh('a = [1, 2]\nb = [3, 4]\nd = dot(a, b)\nn = norm([3, 4])\nl = len(a)');
  expect(close(num(s, 'd'), 11)).toBe(true);
  expect(close(num(s, 'n'), 5)).toBe(true);
  expect(num(s, 'l')).toBe(2);
});

test('projection and the orthogonality theorem', () => {
  const s = runFresh('a = [5, 1]\nb = [2, 1]\np = proj(a, b)\nres = a - p\ne = dot(res, b)');
  expect(vClose(vec(s, 'p'), [4.4, 2.2])).toBe(true);
  expect(close(num(s, 'e'), 0, 1e-9)).toBe(true);
  // the board viz carried the projection helper
  expect(s.viz.projection).not.toBeNull();
});

test('matrices: construction, matvec, det, transpose, matmul', () => {
  const s = runFresh('M = [[2, 1], [1, 3]]\nv = M * [1, 0]\nd = det(M)\nT = transpose(M)\nB = [[1, 0], [0, 1]]\nC = matmul(M, B)');
  expect(vClose(vec(s, 'v'), [2, 1])).toBe(true);
  expect(close(num(s, 'd'), 5)).toBe(true);
  expect(mat(s, 'T')).toEqual([[2, 1], [1, 3]]);
  expect(mat(s, 'C')).toEqual([[2, 1], [1, 3]]);
});

test('trace builtin', () => {
  const s = runFresh('M = [[2, 1], [1, 3]]\nT = trace(M)');
  expect(num(s, 'T')).toBe(5);
});

test('inv(M) @ M == I for 2x2 and 3x3', () => {
  const s2 = runFresh('M = [[2, 1], [1, 3]]\nMi = inv(M)\nP = matmul(M, Mi)\np0 = P[0]\np1 = P[1]');
  expect(vClose(vec(s2, 'p0'), [1, 0])).toBe(true);
  expect(vClose(vec(s2, 'p1'), [0, 1])).toBe(true);
  const s3 = runFresh('M = [[1, 2, 3], [4, 5, 6], [7, 8, 10]]\nMi = inv(M)\nP = matmul(M, Mi)\np0 = P[0]\np1 = P[1]\np2 = P[2]');
  expect(vClose(vec(s3, 'p0'), [1, 0, 0], 1e-6)).toBe(true);
  expect(vClose(vec(s3, 'p1'), [0, 1, 0], 1e-6)).toBe(true);
  expect(vClose(vec(s3, 'p2'), [0, 0, 1], 1e-6)).toBe(true);
});

test('rank builtins', () => {
  const s = runFresh('A = [[1, 2], [2, 4]]\nB = [[1, 2], [3, 4]]\nC = [[1, 2, 3], [2, 4, 6], [1, 1, 1]]\nra = rank(A)\nrb = rank(B)\nrc = rank(C)');
  expect(num(s, 'ra')).toBe(1);
  expect(num(s, 'rb')).toBe(2);
  expect(num(s, 'rc')).toBe(2);
});

test('eigenvalues and eigenvectors builtins satisfy M@v = lambda*v', () => {
  const s = runFresh(
    'M = [[2, 1], [1, 2]]\nL = eigenvalues(M)\nV = eigenvectors(M)\nl0 = L[0]\nl1 = L[1]\nv0 = V[0]\nv1 = V[1]\nav0 = M * v0\nav1 = M * v1',
  );
  expect(close(num(s, 'l0'), 3, 1e-6)).toBe(true);
  expect(close(num(s, 'l1'), 1, 1e-6)).toBe(true);
  const v0 = vec(s, 'v0');
  const v1 = vec(s, 'v1');
  // M @ v0 == l0 * v0  and  M @ v1 == l1 * v1
  expect(vClose(vec(s, 'av0'), [num(s, 'l0') * v0[0]!, num(s, 'l0') * v0[1]!], 1e-6)).toBe(true);
  expect(vClose(vec(s, 'av1'), [num(s, 'l1') * v1[0]!, num(s, 'l1') * v1[1]!], 1e-6)).toBe(true);
});

test('indexing: vector[i] -> scalar, matrix[i] -> row', () => {
  const s = runFresh('a = [10, 20, 30]\nx = a[1]\nM = [[1, 2], [3, 4], [5, 6]]\nr1 = M[2]');
  expect(num(s, 'x')).toBe(20);
  expect(vClose(vec(s, 'r1'), [5, 6])).toBe(true);
});

test('indexing out of range throws', () => {
  expect(() => runFresh('a = [1, 2]\nx = a[5]')).toThrow();
  expect(() => runFresh('M = [[1, 2]]\nr = M[5]')).toThrow();
});

test('sum builtin', () => {
  const s = runFresh('a = [1, 2, 3, 4]\nt = sum(a)');
  expect(num(s, 't')).toBe(10);
});

test('3-D cross product', () => {
  const s = runFresh('a = [1, 0, 0]\nb = [0, 1, 0]\nc = cross(a, b)');
  expect(vClose(vec(s, 'c'), [0, 0, 1])).toBe(true);
});

test('print goes to stdout', () => {
  const s = runFresh('a = [1, 2]\nprint(dot(a, a))');
  expect(s.stdout).toEqual(['5']);
});

test('unknown name throws', () => {
  expect(() => runFresh('a = [1, 2]\nb = zzz + a')).toThrow();
});

test('unknown function throws', () => {
  expect(() => runFresh('a = [1, 2]\nq = nothere(a)')).toThrow();
});

test('predicates report clear failure messages and pass on success', () => {
  const pred = preds.vecEq('a', [1, 2]);
  const empty = snapshot(runFresh(''));
  const emptyState = runFresh('');
  expect(typeof pred(empty, emptyState)).toBe('string'); // not bound → message
  const ok = snapshot(runFresh('a = [1, 2]'));
  expect(pred(ok, runFresh('a = [1, 2]'))).toBe(true);
});

test('linalg helpers are correct in isolation', () => {
  expect(li.vDot([1, 2, 3], [4, 5, 6])).toBe(32);
  expect(li.det([[1, 2, 3], [4, 5, 6], [7, 8, 10]])).toBe(-3);
  expect(li.det([[2, 0], [0, 3]])).toBe(6);
  expect(li.matVec([[1, 2], [3, 4]], [5, 6])).toEqual([17, 39]);
});
