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
