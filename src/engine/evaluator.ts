/**
 * Evaluator: runs parsed statements against `MatState`. Pure over state (no
 * DOM), so the UI, the tests, and `runFresh` all share one code path.
 *
 * Builtins: vec, dot, norm, proj, cross, det, transpose, matmul, matvec, round.
 * Operators follow Python precedence (built in the parser).
 */

import * as li from './linalg';
import { parse } from './parser';
import { createModuleState, rebuildViz } from './state';
import { tokenize } from './tokenizer';
import type { Expr, MNum, MatState, MValue, MVec } from './types';

/* —— coercion helpers —— */

function toVec(v: MValue, fn: string): number[] {
  if (v.k !== 'vec') throw new Error(`${fn}() expects a vector, got ${v.k}`);
  return v.data;
}
function toNum(v: MValue, fn: string): number {
  if (v.k !== 'num') throw new Error(`${fn}() expects a number, got ${v.k}`);
  return v.v;
}
function toMat(v: MValue, fn: string): number[][] {
  if (v.k !== 'mat') throw new Error(`${fn}() expects a matrix, got ${v.k}`);
  return v.rows;
}

/* —— expression evaluation —— */

function evalExpr(e: Expr, env: MatState): MValue {
  switch (e.t) {
    case 'num':
      return li.num(e.v);
    case 'ident': {
      const v = env.bindings[e.name];
      if (!v) throw new Error(`'${e.name}' is not defined`);
      return v;
    }
    case 'un': {
      const v = evalExpr(e.e, env);
      if (v.k === 'num') return li.num(-v.v);
      if (v.k === 'vec') return li.vec(li.vScale(v.data, -1));
      if (v.k === 'mat') return li.mat(li.matScale(v.rows, -1));
      throw new Error('cannot negate');
    }
    case 'list': {
      const items = e.items.map((it) => evalExpr(it, env));
      const allNum = items.every((it) => it.k === 'num');
      if (allNum) return li.vec(items.map((it) => (it as MNum).v));
      const allVec = items.every((it) => it.k === 'vec');
      if (allVec) {
        const rows = items.map((it) => (it as MVec).data);
        return li.mat(rows);
      }
      throw new Error('lists must be flat numbers (vector) or uniform vectors (matrix)');
    }
    case 'bin': {
      const l = evalExpr(e.l, env);
      const r = evalExpr(e.r, env);
      return combine(e.op, l, r);
    }
    case 'call':
      return callBuiltin(e.name, e.args.map((a) => evalExpr(a, env)), env);
    default:
      throw new Error('unreachable');
  }
}

function scalarOp(op: '+' | '-' | '*' | '/', a: number, b: number): number {
  if (op === '+') return a + b;
  if (op === '-') return a - b;
  if (op === '*') return a * b;
  if (b === 0) throw new Error('division by zero');
  return a / b;
}

function combine(op: '+' | '-' | '*' | '/', l: MValue, r: MValue): MValue {
  // scalar / scalar
  if (l.k === 'num' && r.k === 'num') return li.num(scalarOp(op, l.v, r.v));

  // matrix leading products
  if (l.k === 'mat' && op === '*') {
    if (r.k === 'vec') return li.vec(li.matVec(l.rows, r.data));
    if (r.k === 'mat') return li.mat(li.matMul(l.rows, r.rows));
    if (r.k === 'num') return li.mat(li.matScale(l.rows, r.v));
    throw new Error(`unsupported '*' for matrix`);
  }

  // matrix op matrix (elementwise +/-)
  if (l.k === 'mat' && r.k === 'mat') {
    if (op === '+') return li.mat(li.matAdd(l.rows, r.rows));
    if (op === '-') return li.mat(l.rows.map((row, i) => row.map((x, j) => x - r.rows[i]![j]!)));
    throw new Error(`unsupported '${op}' for matrices`);
  }

  // scalar on one side (l is num), vector or matrix on the other
  if (l.k === 'num') {
    const s = l.v;
    if (r.k === 'vec') return numVec(op, s, r.data);
    if (r.k === 'mat') return numMat(op, s, r.rows);
  }
  // scalar on one side (r is num)
  if (r.k === 'num') {
    const s = r.v;
    if (l.k === 'vec') return vecNum(op, l.data, s);
    if (l.k === 'mat') return matNum(op, l.rows, s);
  }

  // vector op vector
  if (l.k === 'vec' && r.k === 'vec') {
    if (op === '+') return li.vec(li.vAdd(l.data, r.data));
    if (op === '-') return li.vec(li.vSub(l.data, r.data));
    if (op === '*') throw new Error('vector * vector is dot product, not multiplication — use dot(a, b)');
    throw new Error(`unsupported '${op}' for vectors`);
  }

  throw new Error(`unsupported ${l.k} ${op} ${r.k}`);
}

function numVec(op: '+' | '-' | '*' | '/', s: number, d: number[]): MValue {
  if (op === '*') return li.vec(li.vScale(d, s));
  if (op === '/') throw new Error('a number is not divisible by a vector');
  if (op === '+') return li.vec(d.map((x) => s + x));
  return li.vec(d.map((x) => s - x));
}
function vecNum(op: '+' | '-' | '*' | '/', d: number[], s: number): MValue {
  if (op === '*') return li.vec(li.vScale(d, s));
  if (op === '/') {
    if (s === 0) throw new Error('division by zero');
    return li.vec(li.vScale(d, 1 / s));
  }
  if (op === '+') return li.vec(d.map((x) => x + s));
  return li.vec(d.map((x) => x - s));
}
function numMat(op: '+' | '-' | '*' | '/', s: number, rows: number[][]): MValue {
  if (op === '*') return li.mat(li.matScale(rows, s));
  if (op === '/') throw new Error('a number is not divisible by a matrix');
  if (op === '+') return li.mat(rows.map((r) => r.map((x) => s + x)));
  return li.mat(rows.map((r) => r.map((x) => s - x)));
}
function matNum(op: '+' | '-' | '*' | '/', rows: number[][], s: number): MValue {
  if (op === '*') return li.mat(li.matScale(rows, s));
  if (op === '/') {
    if (s === 0) throw new Error('division by zero');
    return li.mat(li.matScale(rows, 1 / s));
  }
  if (op === '+') return li.mat(rows.map((r) => r.map((x) => x + s)));
  return li.mat(rows.map((r) => r.map((x) => x - s)));
}

/* —— builtins —— */

function callBuiltin(name: string, args: MValue[], env: MatState): MValue {
  switch (name) {
    case 'vec': {
      if (args.length === 1 && args[0]!.k === 'vec') return args[0]!;
      if (args.length === 1 && args[0]!.k === 'mat') return args[0]!; // vec of a matrix is odd; allow passthrough
      return li.vec(args.map((a) => toNum(a, 'vec')));
    }
    case 'dot': {
      if (args.length !== 2) throw new Error('dot(a, b)');
      return li.num(li.vDot(toVec(args[0]!, 'dot'), toVec(args[1]!, 'dot')));
    }
    case 'norm': {
      if (args.length !== 1) throw new Error('norm(v)');
      return li.num(li.vNorm(toVec(args[0]!, 'norm')));
    }
    case 'len': {
      if (args.length !== 1) throw new Error('len(v)');
      const a = args[0]!;
      if (a.k === 'vec') return li.num(a.data.length);
      if (a.k === 'mat') return li.num(a.rows.length);
      throw new Error('len() expects a vector or matrix');
    }
    case 'proj': {
      if (args.length !== 2) throw new Error('proj(a, b): projection of a onto b');
      const a = toVec(args[0]!, 'proj');
      const b = toVec(args[1]!, 'proj');
      const p = li.vProj(a, b);
      if (a.length === 2 && p.length === 2) {
        env.viz.projection = { from: [a[0]!, a[1]!], foot: [p[0]!, p[1]!] };
      }
      return li.vec(p);
    }
    case 'cross': {
      if (args.length !== 2) throw new Error('cross(a, b)');
      return li.vec(li.vCross(toVec(args[0]!, 'cross'), toVec(args[1]!, 'cross')));
    }
    case 'det': {
      if (args.length !== 1) throw new Error('det(M)');
      return li.num(li.det(toMat(args[0]!, 'det')));
    }
    case 'transpose': {
      if (args.length !== 1) throw new Error('transpose(M)');
      return li.mat(li.matTranspose(toMat(args[0]!, 'transpose')));
    }
    case 'matmul': {
      if (args.length !== 2) throw new Error('matmul(A, B)');
      return li.mat(li.matMul(toMat(args[0]!, 'matmul'), toMat(args[1]!, 'matmul')));
    }
    case 'matvec': {
      if (args.length !== 2) throw new Error('matvec(M, v)');
      return li.vec(li.matVec(toMat(args[0]!, 'matvec'), toVec(args[1]!, 'matvec')));
    }
    case 'round': {
      if (args.length < 1) throw new Error('round(x)');
      const n = args[0]!;
      const places = args[1] ? toNum(args[1]!, 'round') : 0;
      const f = 10 ** places;
      return li.num(Math.round(toNum(n, 'round') * f) / f);
    }
    default:
      throw new Error(`unknown function '${name}' (try: vec, dot, norm, proj, cross, det, transpose, matmul, matvec, round, print)`);
  }
}

/* —— public run API —— */

export function formatValue(v: MValue): string {
  if (v.k === 'num') return li.fmtNum(v.v);
  if (v.k === 'vec') return li.fmtVec(v.data);
  return li.fmtMat(v.rows);
}

export function displayValue(v: MValue): string {
  return formatValue(v);
}

/**
 * Run source text against `state` in place. The projection helper (the dropped
 * perpendicular from the last `proj(...)`) persists across statements so the
 * board keeps showing it; a new `proj(...)` updates it, and a level reset
 * (fresh state) clears it.
 */
export function run(source: string, state: MatState): MatState {
  const stmts = parse(tokenize(source));
  for (const stmt of stmts) {
    if (stmt.t === 'assign') {
      const val = evalExpr(stmt.expr, state);
      if (!(stmt.name in state.bindings)) state.bindingOrder.push(stmt.name);
      state.bindings[stmt.name] = val;
    } else if (stmt.t === 'print') {
      const val = evalExpr(stmt.expr, state);
      state.stdout.push(formatValue(val));
    } else {
      evalExpr(stmt.expr, state);
    }
  }
  if (source.trim()) state.history.push(source);
  rebuildViz(state);
  return state;
}

/** Convenience: a fresh state with `source` already run. */
export function runFresh(source: string): MatState {
  return run(source, createModuleState());
}
