# LearnMLMath — Design Spec

Interactive **mathematics of machine learning**: a browser-native, goal-driven
course on linear algebra, vector & matrix calculus, matrix decompositions, and
the *first nail* of loss optimization. Same platform as `learn-dvc`,
`learn-fp`, `learn-python`, and the rest of the Aghili Labs suite: Vite +
TypeScript (strict) + Vitest, no backend, deployed to GitHub Pages.

The math is made **visible** (a live 2-D geometry board) and **ramped** — every
topic carries a lesson that goes **ELI5 → ELI-PHD**, so the same course serves a
complete beginner and a practitioner, and the industrial transfer is explicit
per level.

## Identity & scope (from the Aghili Labs roadmap)

> `learn-mlmath` — ML Math: Linear algebra, vector calculus, matrix decompositions,
> loss optimization.

The scope is the **math**, not the ML algorithms. Boundaries (no overlap with
neighbouring courses):

| Topic | Owner |
|---|---|
| Linear algebra + vector/matrix calculus + decompositions + **first-nail** loss optimization | **`learn-mlmath` (this course)** |
| Full optimization machinery (line search, momentum, Newton, convexity, MILP/OR-Tools) | `learn-optimization` — we reference it, not build it |
| Probability, distributions, Bayesian inference | `learn-mlstats` |
| Running backprop **on a network** (we teach the *math*: chain rule / Jacobians) | `learn-dl` |
| PCA / regression **as ML algorithms** (we teach them as SVD / projections) | `learn-ml` |

The loss-optimization series is deliberately short — a loss function, a gradient,
one gradient-descent step, and a bridge that points over to `learn-optimization`.

## Style anchor

- **Product genre**: terminal-native learning game for math.
- **Real-world feel**: a *whiteboard* where vectors are arrows, matrices deform
  the unit square, and projections drop a perpendicular — not a SaaS page, not a
  plot-matplotlib clone.
- **Mode**: expressive educational UI (game chrome + technical density).

## Palette (CSS custom properties, see `src/style.css`)

| Token | Hex | Role |
|---|---|---|
| `--ink` | `#0E1318` | App chrome / terminal background |
| `--panel` | `#182029` | Raised panels, toolbar, cards |
| `--panel-2` | `#22303C` | Nested chips, hover fills |
| `--line` | `#2E3D4D` | Hairline borders |
| `--haze` | `#8FA0B2` | Secondary text |
| `--text` | `#E8EEF4` | Primary text |
| `--vectors` | `#5BC4B0` | **teal** — vectors / linear maps (signature accent) |
| `--remote` | `#F59E0B` | **amber** — the unit-square deformation / labels |
| `--coral` | `#F07070` | projection perpendicular / the "shadow" |
| `--code` | `#60A5FA` | Code / commands |
| `--ok` / `--warn` / `--err` | `#34D399` / `#FBBF24` / `#F87171` | success / hint / error |

## Typography

| Role | Stack | Usage |
|---|---|---|
| UI | `Segoe UI, system-ui, -apple-system, sans-serif` | Dialogs, toolbar, dock |
| Mono | `Cascadia Code, JetBrains Mono, Consolas, ui-monospace` | Terminal, math, readouts |

Display personality comes from **density + mono data**, not a decorative webfont.

## Layout system

```
┌──────────────────────────────────────────────────────────────┐
│ toolbar: brand · level title · levels/lesson/hint/solution/  │
│          undo/reset/sandbox/references/help                  │
├──────────────────────────────────────────────────┬───────────┤
│ GEOMETRY BOARD (signature canvas)                │ LEARNING  │
│  <svg> coordinate frame: vectors, unit-square    │ DOCK      │
│  deformation, projection helper                  │  · ELI    │
│  readout strip: a=[3,4] ‖a‖=5  M=…  d=11        │  badge    │
├──────────────────────────────────────────────────┤ · goal    │
│ terminal (console REPL, history, tab-complete)   │  checklist│
└──────────────────────────────────────────────────┴───────────┘
```

- Two columns on wide screens (`.app-main` + `.dock`); stack vertically under
  1024px. The terminal is always last in the main column.
- The goal is a **right dock** (always-on per-check checklist), not a modal.
- RTL-first: the chrome flips under `[dir="rtl"]`; the canvas, terminal, and
  math tokens stay LTR.

## Signature moments (one animation teaches a concept better than a paragraph)

- **`proj(a, b)`** — a coral perpendicular (the "light ray") drops from `a` to
  the shadow `p` on the line of `b`. This single animation *is* projection.
- **Matrix `M`** — the dashed unit square deforms into its image; `det` is the
  area scale, `rank` is the collapse.
- **`M * a`** — the vector `a` moves to where the map sends it.
- **GD step (loss series)** — a "ball" takes one step down the loss hill; the
  learning rate is the step length.

## Engine model (simplified but honest)

A small, dependency-free **matrix/vector/scalar interpreter**:

- `tokenizer.ts` → `parser.ts` (recursive descent, Python precedence) →
  `evaluator.ts` (binds names into `MatState`, dispatches builtins).
- Values are tagged: `num` / `vec` (vector) / `mat` (matrix). Vectors and
  scalars never collide.
- `linalg.ts` — the pure math core (vAdd, dot, norm, proj, cross, matVec,
  matMul, det, transpose, formatting) shared by the evaluator, the checks, and
  the tests.
- **Builtins**: `vec, dot, norm, len, proj, cross, det, transpose, matmul,
  matvec, round`. Operators: `+ - * /` with Python precedence; `a * b` for
  vectors is rejected in favour of the explicit `dot(a, b)` (a teaching choice).
- Goals are **numeric predicates with tolerance** (`checks.ts`) — a wrong number
  is caught, not accepted. The dock shows one labelled row per predicate.

## The ELI ramp (the pedagogy, first-class)

ELI is not a sidebar widget; it is the shape of the content, and the tests
enforce it:

- **`Level.eli: EliBand`** — `'eli5'|'eli10'|'eli15'|'eli20'|'eliphd'`. A
  first-class attribute of every level; the band tracks `difficulty` (1→5) and
  the tests assert the pairing.
- **`Level.lesson`** — the lesson *at that band*, rendered in the lesson modal.
- **`Sequence.deepLesson`** — the per-topic deep lesson that **ramps
  `## ELI5 … ## ELI-PHD`** and carries the full professional coverage. The
  tests assert every deep lesson contains the core bands.
- **`Level.fieldNotes`** — "In production" bullets: the industrial transfer.

So a topic is served at three times at once: the level's band (where you are),
the level's lesson (that band in prose), and the series deep dive (the whole
ladder, on demand). `levels` carry the *do* (skill); `deepLesson` carries the
*depth* (read); `fieldNotes` carry the *apply*. That division is what lets a
short catalog cover ~90% of depth without turning into a 300-level swamp.

## Board / visualization (`src/ui/scene.ts`)

Hand-rolled SVG (no chart library) — the same approach as `learn-python`'s
memory canvas. `renderScene(svg, viz)` draws the projection of a `VizState`:

- **coordinate frame** — unit grid + axes, auto-scaled square window.
- **arrows** — every bound 2-D vector, named, colour-cycled, with a label.
- **projection helper** — the perpendicular + the coral shadow.
- **unit-square deformation** — the image of a bound 2×2 matrix (matrices
  series).
- a **readout strip** under the canvas: `a=[3,4] ‖a‖=5  d=11  M=[…]`.

`VizState` is an open, optional-field record, so each later series (calculus,
loss) adds its own fields (`surface`, `flow`, `hill`, `ball`) and the scene
renders them without the others changing.

## Product surface

1. **Sandbox** — free-form math with a fresh board.
2. **Levels** — series packs; each has a start state, goal checks, hint,
   solution, par, an ELI band, a lesson, and field notes.
3. **Console** — type math; **Tab** autocompletes from the level's own
   solution + a math base set; **Alt+−** inserts ` = `; history with ↑/↓.
4. **Meta commands** — `help, levels, lesson, hint, solution, undo, reset,
   sandbox, clear, script, golf`.
5. **References modal** — the source books, the course boundaries, and the
   "get real → NumPy" mapping.
6. **Persistence** — solved levels + best statement counts in `localStorage`.

## Level packs (planned, in teaching order)

| # | Series (`src/levels/*.ts`) | Teaches | ELI span | Status |
|---|---|---|---|---|
| 1 | `vectors.ts` | vectors, add, scale, dot, norm, projection, projection theorem | eli5→eliphd | **done (reference)** |
| 2 | `spaces.ts` | linear combos, span, independence, basis, dimension | eli5→eli15 | planned |
| 3 | `matrices.ts` | matrices as maps, product, inverse, determinant, rank | eli5→eli20 | planned |
| 4 | `decompositions.ts` | eigen, spectral, SVD, PCA-via-SVD (capstone) | eli10→eliphd | planned |
| 5 | `calculus.ts` | gradient, Jacobian, Hessian, chain rule (backprop math) | eli10→eliphd | planned |
| 6 | `loss.ts` | **first nail**: loss, one GD step, convexity intuition → reference `learn-optimization` | eli10→eli15 | planned |

Each level id is kebab-case `<series>-<n>`; one module file per series, wired
into `src/levels/index.ts`.

## Engineering conventions

- TypeScript strict, English identifiers, no dependencies beyond the dev toolchain.
- Vitest: catalog invariants + a **solvability gate** (every level's `solution`
  actually meets its `goal` within `par`).
- Files/docs in English; product voice is direct and technical.
- No AI footprint in git history when committing.

## Future (out of v1)

- **i18n** `en/de/fa` — the catalog is English-base (like `learn-python`);
  the `learn-dvc`-style locale packs (with a `fa` RTL pass over the lessons and
  the deep dives) come next.
- The remaining five series above.
- Level builder / import JSON (parity with `learn-fp`'s `examples/`).
