# LearnMLMath — Syllabus

The course outline for `learn-mlmath`, derived from the canonical math-for-ML
books and built to run on the shared Aghili Labs platform (Vite + TS + Vitest,
goal-driven levels, live 2-D board, ELI5→ELI-PHD ramps).

Every level is **machine-checked**: a `goal` (numeric predicates within
tolerance) that the tests prove is satisfiable by the level's `solution`.

## Source books (table of contents, mapped)

| Book | Used for |
|---|---|
| **Deisenroth, Faisal, Ong — *Mathematics for Machine Learning*** | The backbone: Ch. 2 Linear Algebra, Ch. 4 Matrix Decompositions, Ch. 5 Vector Calculus, Ch. 7 Continuous Optimization (entry only) |
| **Strang — *Linear Algebra and Learning from Data*** | Matrices as linear maps, SVD → PCA |
| **Goodfellow et al. — *Deep Learning*** | Ch. 2 Linear Algebra, §4.5 Matrix Calculus, Ch. 8 Optimization (entry only) |
| **Sola — *Matrix Calculus for Computer Science*** (free) | The autodiff / chain-rule core (calculus series) |
| **3Blue1Brown — *Essence of Linear Algebra*** | The visual intuition behind the board |

**Deliberately excluded** (owned by other courses, per the roadmap): probability
& distributions → `learn-mlstats`; backprop on networks → `learn-dl`; PCA /
regression as ML algorithms → `learn-ml`; the full optimization machinery →
`learn-optimization`.

## The ELI contract

- Each level has an **`eli` band** (`eli5/10/15/20/eliphd`) = where it teaches.
- Each level has a **`lesson`** at that band.
- Each series has a **`deepLesson`** that ramps `## ELI5 → ## ELI-PHD` (full
  professional coverage) — the depth layer a reader can go to.
- Each level has **`fieldNotes`** — the industrial transfer.

Difficulty (1–5) is locked to the ELI band by the test suite.

---

## Series 1 — `vectors.ts` — *The Language of ML Math* (done — reference)

| id | name | eli | goal (machine-checked) | viz |
|---|---|---|---|---|
| `vec-first` | Meet a vector | eli5 | `a` is a vector = `[3,4]` | arrow |
| `vec-add` | Adding head-to-tail | eli5 | `c = a + b = [4,6]` | 3 arrows |
| `vec-scalar` | Scaling: stretch a vector | eli10 | `b = 3*a = [6,3]` | stretched arrow |
| `vec-dot` | The dot product | eli15 | `d = dot(a,b) = 11` | readout |
| `vec-norm` | Length: the norm | eli15 | `n = norm(a) = 5` | arrow length |
| `vec-proj` | Projection: the shadow | eli20 | `p = proj(a,b) = [4.4,2.2]` | perpendicular + shadow |
| `vec-proj-ortho` | Capstone: the projection theorem | eliphd | `dot(res, b) = 0` (residual ⟂ line) | shadow + residual |

`deepLesson`: ELI5 (an arrow on a floor plan) → ELI10 (add/scale/dot/norm) →
ELI15 (dot = `||a|| ||b|| cosθ`; projection as least squares) → ELI20 (inner-
product space, Gram–Schmidt, Cauchy–Schwarz, L1/L2/∞) → ELI-PHD (inner product →
norm → metric → topology; Riesz representation; the orthogonal projection
theorem; numerical care).

## Series 2 — `spaces.ts` — *What a vector can reach* (planned)

| id | name | eli | goal | viz |
|---|---|---|---|---|
| `sp-combo` | Linear combinations | eli5 | `c = 2*a + b` | reachable cloud |
| `sp-span` | The span | eli5 | `span(a,b)` fills a plane | point cloud |
| `sp-indep` | Independence | eli10 | detect dependence (det / cross) | collapse |
| `sp-basis` | Basis & dimension | eli15 | a basis spans, minimally | frame |
| `sp-map` | A linear map is a matrix | eli15 | `M` sends basis to basis | unit-square deform |

`deepLesson`: ELI5 (reach by mixing) → ELI10 (span, combinations) → ELI15
(independence, basis, change of basis) → ELI20 (subspaces, rank/nullity, kernel
& image) → ELI-PHD (basis theorems, direct sums, coordinate functionals).

## Series 3 — `matrices.ts` — *Maps, not tables* (planned)

| id | name | eli | goal | viz |
|---|---|---|---|---|
| `ma-map` | A matrix is a map | eli5 | `M * a` sends a to the image | unit-square + vector |
| `ma-product` | Multiplication = composition | eli10 | `matmul(A,B)` = A after B | two deformations compose |
| `ma-inverse` | The inverse | eli15 | `A @ Ainv = I` | map then un-map |
| `ma-det` | Determinant = volume scale | eli20 | `det(M)` = area scale | area readout |
| `ma-rank` | Rank = what survives | eli20 | `rank(M)` = dimension of image | collapse to line/point |

`deepLesson`: ELI5 (shuffling the grid) → ELI10 (product as do-one-then-the-
other) → ELI15 (inverse, systems `Ax=b`) → ELI20 (det as signed volume, rank,
nullity, image/kernel) → ELI-PHD (invertibility ⇔ det ≠ 0 ⇔ full rank; the four
fundamental subspaces; conditioning).

## Series 4 — `decompositions.ts` — *The capstone* (planned)

| id | name | eli | goal | viz |
|---|---|---|---|---|
| `dc-eigen` | Eigenvectors: directions that only stretch | eli10 | `A v = λ v` | vector stays on its line |
| `dc-spec` | Spectral decomposition | eli15 | `A = Q Λ Qᵀ` (symmetric) | diagonalize |
| `dc-svd` | SVD: rotate → scale → rotate | eli20 | `A = U Σ Vᵀ` | 3-step animation |
| `dc-svd-best` | SVD is the best rank-k fit | eli20 | truncated SVD error | Eckart–Young |
| `dc-pca` | PCA = SVD of centered data | eli20 | top components of a data cloud | data projected |

`deepLesson`: ELI10 (find the "important directions") → ELI15 (eigen as fixed
directions, symmetric → orthogonal) → ELI20 (SVD exists for all; truncation;
why PCA = SVD) → ELI-PHD (Eckart–Young–Mirsky theorem, von Neumann trace
inequality, condition number, numerical SVD).

## Series 5 — `calculus.ts` — *Where the gradient comes from* (planned)

| id | name | eli | goal | viz |
|---|---|---|---|---|
| `ca-grad` | Gradient = direction of steepest increase | eli10 | `grad(f)` at a point | arrow on a contour |
| `ca-contour` | Level sets & the perpendicular | eli15 | grad ⟂ level set | contour + arrow |
| `ca-jac` | Jacobian: the linear part of a map | eli20 | `J(f)` at a point | local linearization |
| `ca-chain` | The chain rule (backprop's math) | eli20 | `d/dx f(g(x)) = f'(g) g'` | pipeline flow |
| `ca-backprop` | Backprop = the chain rule, applied | eliphd | grads flow backward | reverse pass |

`deepLesson`: ELI10 (slope on a hill) → ELI15 (gradient, directional derivative)
→ ELI20 (Jacobian, Hessian, chain rule, composition) → ELI-PHD (autodiff as
reverse-mode accumulation, the computational graph, why backprop is O(params)).

## Series 6 — `loss.ts` — *The first nail of optimization* (planned)

**This series is short on purpose** — it drives in the first nail and points
over to `learn-optimization`.

| id | name | eli | goal | viz |
|---|---|---|---|---|
| `lo-loss` | A loss: one number to minimize | eli10 | `L = ...` defined | loss readout |
| `lo-grad-step` | One gradient-descent step | eli10 | `x1 = x0 − lr·∇L(x0)` | ball takes one step |
| `lo-lr` | Learning rate = step size | eli15 | too big → diverge; too small → crawl | two trajectories |
| `lo-bridge` | **→ learn-optimization** | eli15 | a bridge level (reference) | pointer card |

`deepLesson`: ELI10 (a hill, one step downhill) → ELI15 (convex vs non-convex
intuition, why LR matters) → and then an explicit handoff: *"The math of why
gradient descent works is here. The machinery that makes it fast and robust —
line search, momentum, Adam, Newton, convexity theory, and MILP/OR-Tools — is
the whole of `learn-optimization`. Continue there."*

---

## Coverage & the 90% target

The **depth/coverage** is carried by the `deepLesson` ramps (read layer), the
**skill** by the levels (do layer), and the **industrial relevance** by
`fieldNotes` (apply layer). Together across the six series they cover the
roadmap's stated scope — *linear algebra, vector calculus, matrix decompositions,
loss optimization (first nail)* — with the professional (ELI-PHD) tier present
in every series, which is what gets to ~90% of the canonical material without
turning the interactive catalog into a lecture series.
