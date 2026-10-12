/**
 * Statement counting / splitting for golf (par) and the dock's per-step guide.
 * A "statement" is a non-blank, non-comment line — the same unit the evaluator
 * executes line by line.
 */

/** Rough statement count for golf: logical lines that are not blank / comments. */
export function countStatements(source: string): number {
  return source
    .split(/\r?\n/)
    .filter((l) => {
      const t = l.trim();
      return t && !t.startsWith('#');
    }).length;
}

/** Split source into non-blank, non-comment lines (the executable statements). */
export function splitStatements(source: string): string[] {
  return source
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((t) => t && !t.startsWith('#'));
}
