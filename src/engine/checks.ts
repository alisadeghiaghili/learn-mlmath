/**
 * Goal checking for levels. Numeric goals compare within a tolerance so the
 * learner's answer need not be bit-exact. Each predicate returns `true` to
 * pass or a string describing the failure.
 */

import * as li from './linalg';
import type { GoalResult, GoalSpec, MatState, MValue, Predicate, Snapshot } from './types';

const TOL = 1e-6;

/** Numeric tolerance comparison (integer-ish values snap to exact integers). */
export function close(a: number, b: number, tol = TOL): boolean {
  const tol2 = Math.max(tol, 1e-9);
  const ai = Math.round(a * 1000) / 1000;
  const bi = Math.round(b * 1000) / 1000;
  return Math.abs(ai - bi) <= tol2 || Math.abs(a - b) <= tol2;
}

export function vClose(a: number[], b: number[], tol = TOL): boolean {
  if (a.length !== b.length) return false;
  return a.every((x, i) => close(x, b[i]!, tol));
}

/** The snapshot slot for `name`, or null if unbound. */
function get(snap: Snapshot, name: string): MValue | null {
  return snap.bindings[name] ?? null;
}

/** Check a level goal against the current snapshot and state. */
export function checkGoal(goal: GoalSpec | null, snap: Snapshot, _state: MatState): GoalResult {
  if (!goal) return { ok: false, message: 'No goal defined.' };

  if (goal.type === 'stdout') {
    const lines = _state.stdout.slice(-goal.lines.length);
    const ok =
      lines.length === goal.lines.length && goal.lines.every((ln, i) => ln === lines[i]);
    return {
      ok,
      message: ok ? 'Goal reached.' : `stdout mismatch. Got ${JSON.stringify(lines)}, expected ${JSON.stringify(goal.lines)}.`,
    };
  }

  for (const pred of goal.predicates) {
    const r = pred(snap, _state);
    if (r !== true) return { ok: false, message: typeof r === 'string' ? r : 'A goal predicate is not satisfied yet.' };
  }
  return { ok: true, message: 'Goal reached.' };
}

/* —— predicate builders —— */

function expectVec(snap: Snapshot, name: string): number[] {
  const v = get(snap, name);
  if (!v || v.k !== 'vec') throw new Error(`Define a vector named '${name}'.`);
  return v.data;
}
function expectNum(snap: Snapshot, name: string): number {
  const v = get(snap, name);
  if (!v || v.k !== 'num') throw new Error(`Define a number named '${name}'.`);
  return v.v;
}
function expectMat(snap: Snapshot, name: string): number[][] {
  const v = get(snap, name);
  if (!v || v.k !== 'mat') throw new Error(`Define a matrix named '${name}'.`);
  return v.rows;
}
function kindOf(snap: Snapshot, name: string): string {
  return (get(snap, name) ?? null)?.k ?? 'undefined';
}

export const preds = {
  isVec(name: string): Predicate {
    return (snap) => (kindOf(snap, name) === 'vec' ? true : `'${name}' is not a vector (it is ${kindOf(snap, name)}).`);
  },
  isMat(name: string): Predicate {
    return (snap) => (kindOf(snap, name) === 'mat' ? true : `'${name}' is not a matrix (it is ${kindOf(snap, name)}).`);
  },
  isNum(name: string): Predicate {
    return (snap) => (kindOf(snap, name) === 'num' ? true : `'${name}' is not a number (it is ${kindOf(snap, name)}).`);
  },
  /** `name` holds a vector equal to `expected` (within tolerance). */
  vecEq(name: string, expected: number[]): Predicate {
    return (snap) => {
      try {
        const v = expectVec(snap, name);
        return vClose(v, expected) ? true : `'${name}' is ${li.fmtVec(v)}, expected ${li.fmtVec(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `name` holds a scalar equal to `expected` (within tolerance). */
  valEq(name: string, expected: number): Predicate {
    return (snap) => {
      try {
        const v = expectNum(snap, name);
        return close(v, expected) ? true : `'${name}' is ${li.fmtNum(v)}, expected ${li.fmtNum(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `name` holds a matrix equal to `expected` (within tolerance). */
  matEq(name: string, expected: number[][]): Predicate {
    return (snap) => {
      try {
        const v = expectMat(snap, name);
        const ok = v.length === expected.length && v.every((row, i) => vClose(row, expected[i]!));
        return ok ? true : `'${name}' is ${li.fmtMat(v)}, expected ${li.fmtMat(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `dot` of the first `a` names equals `expected`. */
  dotEquals(a: string, b: string, expected: number): Predicate {
    return (snap) => {
      try {
        const d = li.vDot(expectVec(snap, a), expectVec(snap, b));
        return close(d, expected) ? true : `dot(${a}, ${b}) is ${li.fmtNum(d)}, expected ${li.fmtNum(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `norm(a)` equals `expected`. */
  normEquals(a: string, expected: number): Predicate {
    return (snap) => {
      try {
        const d = li.vNorm(expectVec(snap, a));
        return close(d, expected) ? true : `norm(${a}) is ${li.fmtNum(d)}, expected ${li.fmtNum(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** length of vector `name` equals `expected`. */
  lenEquals(name: string, expected: number): Predicate {
    return (snap) => {
      try {
        const l = expectVec(snap, name).length;
        return l === expected ? true : `${name} has length ${l}, expected ${expected}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /**
   * `proj` is the scalar projection of `name` onto `onto` (i.e. the number
   * t with proj(name, onto) = t * onto). Checks the component, not the vector.
   */
  projScalarEquals(name: string, onto: string, expected: number): Predicate {
    return (snap) => {
      try {
        const n = expectVec(snap, name);
        const o = expectVec(snap, onto);
        const bb = li.vDot(o, o);
        const t = li.vDot(n, o) / bb;
        return close(t, expected) ? true : `proj(${name}, ${onto}) along ${onto} is ${li.fmtNum(t)}, expected ${li.fmtNum(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `proj` (bound) equals the vector projection of `name` onto `onto`. */
  projClose(name: string, onto: string): Predicate {
    return (snap) => {
      try {
        const n = expectVec(snap, name);
        const o = expectVec(snap, onto);
        const expected = li.vProj(n, o);
        const got = expectVec(snap, 'proj');
        return vClose(got, expected) ? true : `proj is ${li.fmtVec(got)}, expected ${li.fmtVec(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `cross(a, b)` equals `expected`. */
  crossEquals(a: string, b: string, expected: number[]): Predicate {
    return (snap) => {
      try {
        const c = li.vCross(expectVec(snap, a), expectVec(snap, b));
        return vClose(c, expected) ? true : `cross(${a}, ${b}) is ${li.fmtVec(c)}, expected ${li.fmtVec(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `det(name)` equals `expected`. */
  detEquals(name: string, expected: number): Predicate {
    return (snap) => {
      try {
        const d = li.det(expectMat(snap, name));
        return close(d, expected) ? true : `det(${name}) is ${li.fmtNum(d)}, expected ${li.fmtNum(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `name` equals `M @ v` for bound matrix M and vector v. */
  matVecEquals(name: string, m: string, v: string): Predicate {
    return (snap) => {
      try {
        const expected = li.matVec(expectMat(snap, m), expectVec(snap, v));
        const got = expectVec(snap, name);
        return vClose(got, expected) ? true : `${name} is ${li.fmtVec(got)}, expected ${li.fmtVec(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
  /** `name` equals the product of two bound matrices A @ B. */
  matMulEquals(name: string, a: string, b: string): Predicate {
    return (snap) => {
      try {
        const expected = li.matMul(expectMat(snap, a), expectMat(snap, b));
        const got = expectMat(snap, name);
        const ok = got.length === expected.length && got.every((row, i) => vClose(row, expected[i]!));
        return ok ? true : `${name} is ${li.fmtMat(got)}, expected ${li.fmtMat(expected)}.`;
      } catch (e) {
        return (e as Error).message;
      }
    };
  },
};
