/**
 * Headless smoke: drive the flow through the engine only (no DOM).
 * Browser/visual QA is separate.
 */

import { test, expect } from 'vitest';
import { runFresh, snapshot } from '../src/engine/session';
import { checkGoal } from '../src/engine/checks';
import { getLevel } from '../src/levels/index';
import { countStatements } from '../src/engine/steps';

test('the projection capstone solves and its goal passes', () => {
  const level = getLevel('vec-proj-ortho')!;
  expect(level, 'vec-proj-ortho level must exist').toBeTruthy();
  const source = level.start.trim() ? level.start + '\n' + level.solution : level.solution;
  const state = runFresh(source);
  const result = checkGoal(level.goal, snapshot(state), state);
  expect(result.ok, result.message).toBe(true);
  expect(countStatements(level.solution)).toBeLessThanOrEqual(level.par);
});

test('the first level (eli5) is solvable from a clean slate', () => {
  const level = getLevel('vec-first')!;
  const state = runFresh(level.solution);
  const result = checkGoal(level.goal, snapshot(state), state);
  expect(result.ok, result.message).toBe(true);
});

test('binding a 2-D vector produces a board arrow', () => {
  const state = runFresh('a = [3, 4]');
  expect(state.viz.arrows).toEqual([{ name: 'a', x: 3, y: 4 }]);
  expect(state.viz.readouts['a']).toContain('‖a‖=5');
});
