/**
 * Shared types for LearnMLMath — a simulated matrix/vector/scalar runtime,
 * a small math DSL, and the level catalog.
 *
 * The runtime is a pure in-memory interpreter (no async, no DOM). The learner
 * types Python-flavoured math statements; the evaluator updates `MatState`,
 * the scene renders a projection of it, and goals check a snapshot within
 * numeric tolerance.
 */

/* —— Runtime values (tagged, so vectors and scalars never collide) —— */

export interface MNum {
  k: 'num';
  v: number;
}
export interface MVec {
  k: 'vec';
  data: number[];
}
export interface MMat {
  k: 'mat';
  rows: number[][];
}

/** Any value held by a name in the runtime. */
export type MValue = MNum | MVec | MMat;

/* —— Visualization (the board canvas projection of state) —— */

/** A named 2-D arrow drawn over the shared coordinate frame. */
export interface Arrow {
  name: string;
  x: number;
  y: number;
}

/** A dashed helper: the projection of `from` onto a line, landing at `foot`. */
export interface Projection {
  from: [number, number];
  foot: [number, number];
}

/**
 * The live scene handed to `scene.ts` each state change. It is an open,
 * optional-field record so each series emits only what it draws: vectors use
 * `arrows`/`projection`, matrices add `grid`, calculus will add `surface` and
 * `flow`, loss will add `hill`/`ball`. The scene ignores fields it does not
 * know about.
 */
export interface VizState {
  /** named vectors as arrows (2-D). */
  arrows: Arrow[];
  /** projection helper, if the last statement was a `proj(...)`. */
  projection?: Projection | null;
  /** unit-square image under a linear map (matrices series). */
  grid?: { label: string; ex: [number, number]; ey: [number, number] } | null;
  /** free-text scalar readouts shown in the board footer. */
  readouts: Record<string, string>;
}

/* —— Program state —— */

export interface MatState {
  /** name → value, in binding order (order is preserved for the canvas). */
  bindings: Record<string, MValue>;
  bindingOrder: string[];
  stdout: string[];
  errors: string[];
  viz: VizState;
  /** raw source lines executed, for the terminal history. */
  history: string[];
}

/* —— Tokens & AST —— */

export type Tok =
  | { t: 'num'; v: number }
  | { t: 'name'; v: string }
  | { t: 'op'; v: string }
  | { t: 'end' };

export type Expr =
  | { t: 'num'; v: number }
  | { t: 'list'; items: Expr[] }
  | { t: 'ident'; name: string }
  | { t: 'bin'; op: '+' | '-' | '*' | '/'; l: Expr; r: Expr }
  | { t: 'un'; op: '-'; e: Expr }
  | { t: 'call'; name: string; args: Expr[] };

export type Stmt =
  | { t: 'assign'; name: string; expr: Expr }
  | { t: 'print'; expr: Expr }
  | { t: 'expr'; expr: Expr };

/* —— Goals / checks (numeric, tolerance-based) —— */

/** A predicate over the snapshot; `true` passes, a string is a failure note. */
export type Predicate = (snap: Snapshot, state: MatState) => boolean | string;

export type GoalSpec =
  | { type: 'predicates'; predicates: Predicate[] }
  | { type: 'stdout'; lines: string[] };

export interface GoalResult {
  ok: boolean;
  message: string;
}

/** The stable, board-facing projection of state checked by goals. */
export interface Snapshot {
  bindings: Record<string, MValue>;
}

/* —— Level catalog —— */

/**
 * The pedagogical band a level lives on. A first-class curriculum attribute,
 * exactly as in the sibling courses: the ELI bands are woven through the
 * levels and the lessons, not just reported. The band tracks `difficulty`
 * (1→5 = eli5→eliphd).
 */
export type EliBand = 'eli5' | 'eli10' | 'eli15' | 'eli20' | 'eliphd';

export interface Level {
  id: string;
  name: string;
  /** The ELI band this level teaches on (first-class curriculum attribute). */
  eli: EliBand;
  /** One-line objective shown in the dock. */
  brief: string;
  hint: string;
  /** Source run to seed the level (empty for a clean slate). */
  start: string;
  /** Statement-golf par. */
  par: number;
  /** Difficulty 1–5, shown as a dot rating in the catalog. */
  difficulty: number;
  goal: GoalSpec;
  solution: string;
  /** Full markdown lesson (EN base; i18n overlays it). */
  lesson?: string;
  /** "You are learning" bullets. */
  learning?: string[];
  /** "In production" field notes — the industrial transfer. */
  fieldNotes?: string[];
}

export interface Sequence {
  id: string;
  title: string;
  levels: Level[];
  /**
   * The per-topic deep lesson that ramps ELI5→ELI-PHD and carries the full
   * professional coverage for the series. Rendered in the lesson panel.
   */
  deepLesson?: string;
}
