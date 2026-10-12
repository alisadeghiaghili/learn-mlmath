/**
 * Public facade of the math runtime for the UI and tests.
 */

import { displayValue, run, runFresh } from './evaluator';
import { cloneState, createModuleState, rebuildViz, snapshot } from './state';
import type { MatState, MValue, Snapshot } from './types';

export interface Session {
  readonly state: MatState;
  run: (source: string) => MatState;
  snapshot: () => Snapshot;
  clone: () => MatState;
  display: (v: MValue) => string;
  reset: () => MatState;
}

/** Create a new interpreter session. */
export function createSession(): Session {
  let state = createModuleState();
  return {
    get state() {
      return state;
    },
    run(source: string): MatState {
      return run(source, state);
    },
    snapshot(): Snapshot {
      return snapshot(state);
    },
    clone(): MatState {
      return cloneState(state);
    },
    display(v: MValue): string {
      return displayValue(v);
    },
    reset(): MatState {
      state = createModuleState();
      return state;
    },
  };
}

export { run, runFresh, cloneState, createModuleState, snapshot, rebuildViz, displayValue };
