/**
 * State lifecycle for the math runtime: fresh state, cloning for undo,
 * snapshots for goal-checking, and the board-facing viz projection.
 */

import * as li from './linalg';
import type { MatState, Snapshot, VizState } from './types';

/** A brand-new, empty runtime state. */
export function createModuleState(): MatState {
  return {
    bindings: {},
    bindingOrder: [],
    stdout: [],
    errors: [],
    viz: { arrows: [], projection: null, grid: null, readouts: {} },
    history: [],
  };
}

/** Deep clone (safe: state is plain structured-cloneable data). */
export function cloneState(state: MatState): MatState {
  return structuredClone(state);
}

/** Stable projection checked by goals and shown to the board. */
export function snapshot(state: MatState): Snapshot {
  return { bindings: structuredClone(state.bindings) };
}

/**
 * Recompute the board viz from bindings. Idempotent and pure over `bindings`:
 * arrows come from every bound 2-D vector, the grid from the most recent 2×2
 * matrix, and readouts from every binding. `projection` is left untouched —
 * the evaluator owns it (set by the last `proj(...)`, persisting until reset).
 */
export function rebuildViz(state: MatState): void {
  const viz: VizState = state.viz;
  viz.arrows = [];
  viz.grid = null;
  viz.readouts = {};

  for (const name of state.bindingOrder) {
    const v = state.bindings[name]!;
    if (v.k === 'vec' && v.data.length === 2) {
      viz.arrows.push({ name, x: v.data[0]!, y: v.data[1]! });
      viz.readouts[name] = `${li.fmtVec(v.data)}  ‖${name}‖=${li.fmtNum(li.vNorm(v.data))}`;
    } else if (v.k === 'vec') {
      viz.readouts[name] = li.fmtVec(v.data);
    } else if (v.k === 'num') {
      viz.readouts[name] = li.fmtNum(v.v);
    } else if (v.k === 'mat') {
      viz.readouts[name] = li.fmtMat(v.rows);
      if (v.rows.length === 2 && v.rows[0]!.length === 2) {
        viz.grid = {
          label: name,
          ex: [v.rows[0]![0]!, v.rows[1]![0]!],
          ey: [v.rows[0]![1]!, v.rows[1]![1]!],
        };
      }
    }
  }
}
