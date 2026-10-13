/**
 * Level catalog barrel. Assembles the per-series modules (one file each) into
 * the ordered `sequences` list, plus the flat accessors the UI and tests use.
 * English is the base language (lives in the series files).
 */

import type { Level, Sequence } from '../engine/types';
import { series as matrices } from './matrices';
import { series as vectors } from './vectors';

/** All series, in teaching order. */
export const sequences: Sequence[] = [
  ...vectors,
  ...matrices,
  // Next series (each a single module): spaces, decompositions, calculus,
  // loss — added as they are authored.
];

/**
 * Flatten all levels in order.
 */
export function allLevels(): Level[] {
  return sequences.flatMap((s) => s.levels);
}

/**
 * Look up a level by id.
 */
export function getLevel(id: string): Level | null {
  return allLevels().find((l) => l.id === id) || null;
}

/**
 * Index of a level in the flat list, or -1.
 */
export function levelIndex(id: string): number {
  return allLevels().findIndex((l) => l.id === id);
}

/**
 * The series a level belongs to (for its deep lesson), or null.
 */
export function sequenceOfLevel(id: string): Sequence | null {
  return sequences.find((s) => s.levels.some((l) => l.id === id)) || null;
}
