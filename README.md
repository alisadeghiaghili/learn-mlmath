# learn-mlmath — Interactive ML Math

See the **mathematics of machine learning** — made visible and made to make
sense. An interactive, goal-driven course on **linear algebra, vector & matrix
calculus, matrix decompositions, and the first nail of loss optimization**,
built on the [Aghili Labs](https://github.com/alisadeghiaghili/aghili-labs)
platform.

Vectors are **arrows**. Matrices **deform the unit square**. Projections **drop
a perpendicular**. Every idea you could not see before, you can now *do* and
*watch*.

Each topic is **ramped ELI5 → ELI-PHD**: a lesson at your level, a deep-dive
that takes a complete beginner to a practitioner, and real "in production"
notes. The same course serves both.

> **Scope.** This is the *math*, not the ML algorithms. Probability →
> `learn-mlstats`, backprop on networks → `learn-dl`, PCA/regression as
> algorithms → `learn-ml`, and the full optimization machinery →
> [`learn-optimization`](https://github.com/alisadeghiaghili/learn-optimization)
> (loss optimization here is a first nail that points over there).

## Run it

```bash
npm install
npm run dev      # local dev server
```

## Build & test

```bash
npm test         # vitest: catalog invariants + solvability gate
npm run build    # tsc --noEmit && vite build → dist/
```

The test suite enforces the pedagogy: every level's `solution` actually meets
its machine-checked `goal` (within tolerance) and its `par`; every ELI band
pairs with a difficulty; every series' deep lesson ramps through
`## ELI5 … ## ELI20` (and up to `## ELI-PHD`).

## The platform (shared with learn-dvc / learn-fp / learn-python)

- **Vite + TypeScript (strict) + Vitest**, no backend, deploys to GitHub Pages.
- `src/engine/` — a small matrix/vector/scalar interpreter (tokenizer → parser
  → evaluator) with a pure `linalg` core, plus numeric **goal checks with
  tolerance**.
- `src/levels/*.ts` — one module per series; each level is a `Level` with an
  `eli` band, `brief`, `hint`, `start`, `par`, `goal`, `solution`, `lesson`,
  `learning`, `fieldNotes`; each series carries a `deepLesson`.
- `src/ui/` — a signature **2-D geometry canvas** (`scene.ts`, hand-rolled
  SVG), a console REPL with Tab-autocomplete, and an always-on learning dock
  with a live per-check checklist.
- **Progress** persists in `localStorage`.

## Current catalog

- **Series 1 — Vectors** (7 levels, `eli5` → `eliphd`) — the reference series:
  meet a vector, add, scale, dot, norm, projection, and the projection
  theorem capstone.

Planned series (see [SYLLABUS.md](SYLLABUS.md)): spaces, matrices,
decompositions, calculus, and the first-nail loss-optimization bridge.

## Docs

- [DESIGN.md](DESIGN.md) — design spec (identity, palette, layout, engine, the
  ELI ramp, the board, level packs).
- [SYLLABUS.md](SYLLABUS.md) — the full course outline, book sources, and
  per-level goals.
