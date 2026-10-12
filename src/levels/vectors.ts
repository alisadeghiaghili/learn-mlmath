/**
 * Series: Vectors — the language everything else is built from.
 *
 * The reference series: it demonstrates the full three-layer ELI model (a
 * per-level `eli` band + `lesson`, a series `deepLesson` that ramps
 * ELI5→ELI-PHD, and `fieldNotes` for industrial transfer) and the board viz
 * (bound 2-D vectors are drawn as arrows; `proj` drops a perpendicular).
 *
 * Every goal is machine-checked with numeric tolerance, so a wrong answer is
 * caught, not just accepted.
 */

import { preds } from '../engine/checks';
import type { Sequence } from '../engine/types';

export const series: Sequence[] = [
  {
    id: 'vectors',
    title: 'Vectors: The Language of ML Math',
    levels: [
      {
        id: 'vec-first',
        eli: 'eli5',
        name: 'Meet a vector',
        brief:
          'A vector is just a list of numbers — but on the board it becomes an **arrow**. Type `a = [3, 4]`: it points 3 right, 4 up.',
        hint: 'a = [3, 4]',
        start: '',
        par: 1,
        difficulty: 1,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('a'), preds.vecEq('a', [3, 4])],
        },
        solution: 'a = [3, 4]',
        lesson: `A vector is a little instruction that says "go 3 to the right, 4 up". The two numbers are its **components** — one per axis.

On the board, \`a = [3, 4]\` draws a teal arrow from the origin to the point (3, 4). That arrow is the whole idea. Everything in machine learning — a data point, a weight, a feature — is stored this way.`,
        learning: ['A vector is an arrow from the origin to a point', 'Its numbers are components, one per axis'],
        fieldNotes: ['A data point is a vector: [age, income, clicks] is one vector in a 3-D space', 'Word embeddings in NLP are 300-D vectors, same idea, more axes'],
      },
      {
        id: 'vec-add',
        eli: 'eli5',
        name: 'Adding head-to-tail',
        brief:
          'Add vectors by putting the second arrow’s tail on the first arrow’s head. With `a=[1,2]` and `b=[3,4]` given, make `c = a + b` and watch all three on the board.',
        hint: 'c = a + b',
        start: 'a = [1, 2]\nb = [3, 4]',
        par: 1,
        difficulty: 1,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('c'), preds.vecEq('c', [4, 6])],
        },
        solution: 'c = a + b',
        lesson: `Adding vectors is physical: walk along \`a\` (1 right, 2 up), then continue along \`b\` (3 right, 4 up). You end at (4, 6).

Component by component it’s just addition — \`1+3\` on the x-axis, \`2+4\` on the y-axis. That’s why \`a + b = [4, 6]\`. On the board you can see the triangle they form.`,
        learning: ['Vector addition is head-to-tail', 'Components add independently, axis by axis'],
        fieldNotes: ['"Combine two forces" in physics = add their vectors', 'Averages in ML are vector means — add feature-vectors, then divide'],
      },
      {
        id: 'vec-scalar',
        eli: 'eli10',
        name: 'Scaling: stretch a vector',
        brief:
          'Multiplying by a number stretches the arrow. `a=[2,1]`; make `b = 3 * a`. It should point the same way, three times longer.',
        hint: 'b = 3 * a',
        start: 'a = [2, 1]',
        par: 1,
        difficulty: 2,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('b'), preds.vecEq('b', [6, 3])],
        },
        solution: 'b = 3 * a',
        lesson: `Scaling multiplies every component: \`3 * [2, 1] = [6, 3]\`. The arrow points the **same direction** but is now three times as long.

Direction is preserved, length changes. That’s the key move behind learning rates, momentum, and every "step size" in optimization — a direction (the gradient) scaled by a number (how big a step to take).`,
        learning: ['Scaling multiplies every component', 'Direction is kept; only length changes'],
        fieldNotes: ['A learning rate is exactly this: gradient direction × scalar step size', 'Negative scaling flips the arrow — moving "against" a direction'],
      },
      {
        id: 'vec-dot',
        eli: 'eli15',
        name: 'The dot product',
        brief:
          'The dot product collapses two vectors into **one number** — a measure of "how much they agree". With `a=[1,2]`, `b=[3,4]`, compute `d = dot(a, b)` and `print(d)`. It’s 1·3 + 2·4 = **11**.',
        hint: 'd = dot(a, b)',
        start: 'a = [1, 2]\nb = [3, 4]',
        par: 2,
        difficulty: 3,
        goal: {
          type: 'predicates',
          predicates: [preds.isNum('d'), preds.valEq('d', 11)],
        },
        solution: 'd = dot(a, b)\nprint(d)',
        lesson: `The dot product multiplies matching components and adds them up: \`1·3 + 2·4 = 11\`.

Think of it as "agreement". If two vectors point the same way, the dot product is large. If they point opposite, it’s negative. If they’re perpendicular, it’s **zero** — no agreement at all.

This one number is the engine room of ML: a neural network layer is literally a stack of dot products between your input and the learned weights.`,
        learning: ['dot(a,b) = sum of component-wise products', 'Large = aligned, zero = perpendicular, negative = opposed'],
        fieldNotes: ['A linear layer is y = dot(input, weights) + bias — the dot product everywhere', 'Cosine similarity = dot product normalized — powers "similar document" search'],
      },
      {
        id: 'vec-norm',
        eli: 'eli15',
        name: 'Length: the norm',
        brief:
          'The norm is the arrow’s **length**. For `a=[3,4]` it’s sqrt(3²+4²) = **5** (a 3-4-5 triangle). Make `n = norm(a)` and `print(n)`.',
        hint: 'n = norm(a)',
        start: 'a = [3, 4]',
        par: 2,
        difficulty: 3,
        goal: {
          type: 'predicates',
          predicates: [preds.isNum('n'), preds.valEq('n', 5)],
        },
        solution: 'n = norm(a)\nprint(n)',
        lesson: `The norm \`||a||\` is the Euclidean length of the arrow: the square root of the sum of squares. For \`[3, 4]\` that’s \`sqrt(9 + 16) = 5\`.

Length is the "how much" of a vector. Distance between two points is just the norm of their difference: \`distance(a, b) = norm(a - b)\`. Nearly every "how similar / how far apart" in ML is a distance, and every distance is a norm of a difference.`,
        learning: ['norm(a) = sqrt of sum of squares = arrow length', 'Distance between points = norm of their difference'],
        fieldNotes: ['L2 norm is the "ordinary" length; L1 (sum of |components|) is its sparser cousin', 'Regularization penalizes the norm of weights to keep models simple'],
      },
      {
        id: 'vec-proj',
        eli: 'eli20',
        name: 'Projection: the shadow',
        brief:
          'Projecting a vector onto another is finding its **shadow** on that line. Project `a=[5,1]` onto `b=[2,1]`: `p = proj(a, b)`. The board drops a perpendicular — `p` is where it lands.',
        hint: 'p = proj(a, b)',
        start: 'a = [5, 1]\nb = [2, 1]',
        par: 1,
        difficulty: 4,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('p'), preds.vecEq('p', [4.4, 2.2])],
        },
        solution: 'p = proj(a, b)',
        lesson: `Projecting \`a\` onto \`b\` asks: "if I shine light perpendicular to \`b\`, where does \`a\` cast its shadow on the line of \`b\`?"

The formula is elegant: take the dot product \`a·b\` (how much of a is "along" b), divide by \`b·b\`, and scale \`b\`. Here that gives \`t = 11/5 = 2.2\`, so \`p = 2.2·[2,1] = [4.4, 2.2]\`.

The board draws the perpendicular (the "light ray") and the shadow \`p\` in coral. Projections are how models **fit** — you project data onto the directions that matter.`,
        learning: ['proj(a, b) = the shadow of a on the line spanned by b', 'It’s (a·b / b·b) * b — pure dot products'],
        fieldNotes: ['Linear regression is "project data onto the feature directions"', 'PCA, embeddings, and retrieval all rely on projecting high-D data down'],
      },
      {
        id: 'vec-proj-ortho',
        eli: 'eliphd',
        name: 'Capstone: the projection theorem',
        brief:
          'ELI-PHD. The shadow `p = proj(a, b)` is the **unique** closest point on `b`’s line to `a` — so the error (residual) must be perpendicular to that line. With `p` already set, make `res = a - p` and `print(dot(res, b))`. It must come out **0**.',
        hint: 'res = a - p, then print(dot(res, b)) → 0',
        start: 'a = [5, 1]\nb = [2, 1]\np = proj(a, b)',
        par: 2,
        difficulty: 5,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('res'), preds.dotEquals('res', 'b', 0)],
        },
        solution: 'res = a - p\nprint(dot(res, b))',
        lesson: `The **projection theorem** says: the residual \`r = a - proj_b(a)\` is orthogonal to the whole subspace (here, the line spanned by \`b\`). So \`dot(r, b)\` is exactly 0.

Prove it live: \`res = a - p\` gives \`[0.6, -1.2]\`, and \`dot(res, b) = 0.6·2 + (-1.2)·1 = 0\`.

Why this is the capstone: least squares, linear regression, and PCA are all *orthogonal projections*. "Fitting" means choosing the point in your model’s reachable subspace that makes the residual perpendicular — the unique minimizer of the error norm. You have now derived, in one line, the geometric core of linear regression.`,
        learning: ['The residual of a projection is orthogonal to the target subspace', 'dot(res, b) = 0 is the statement "best fit"'],
        fieldNotes: ['Least squares = orthogonal projection; the normal equations are just dot(res, X) = 0', 'This orthogonality is why the projection is the unique least-norm solution'],
      },
    ],
    deepLesson: `# Vectors, end to end

This is the full ramp for the series. Read the band you need — or read them all, top to bottom.

## ELI5

Imagine an arrow on a floor plan. It tells you where to walk and how far. A **vector** is just that arrow, written as two numbers: "walk 3 east, 4 north." Nothing more. Machine learning is mostly the story of lots of these arrows, and how to add them, stretch them, and measure how closely they line up.

## ELI10

A vector lives in a space with an axis per number. Two operations do almost all the work:

- **Add** — put the arrows head-to-tail; components add.
- **Scale** — multiply by a number; the arrow stretches or flips but keeps its direction.

Two measurements complete the toolkit:

- **Dot product** \`a·b\` — one number for "how aligned" two arrows are.
- **Norm** \`||a||\` — the arrow’s length; distance is the norm of a difference.

That’s the whole beginner vocabulary, and it’s enough to read half of any ML paper.

## ELI15

Now the geometry sharpens. The dot product has two faces:

1. Algebraic: \`a·b = Σ aᵢbᵢ\`.
2. Geometric: \`a·b = ||a|| ||b|| cos θ\` — so it’s the product of the lengths times the cosine of the angle. Perpendicular ⇒ 0; parallel ⇒ the product of the lengths.

**Projection** makes this operational. The shadow of \`a\` on \`b\` is \`proj_b(a) = (a·b / b·b) b\`. It’s the unique point on the line of \`b\` that minimizes the distance to \`a\`. Every least-squares fit is a projection: you project your data onto the subspace your model can reach, and the residual is the perpendicular error.

## ELI20

Treat vectors as elements of an inner-product space (ℝⁿ with the dot product). Then:

- The **Gram–Schmidt process** builds an orthonormal basis from any independent set — repeatedly project away the parts already explained.
- **Cauchy–Schwarz** \|a·b\| ≤ \|a\|\|b\| is the statement that cosine stays in [−1, 1]; it underpins cosine similarity and the stability of normalization.
- **Distance metrics** are norms of differences: L2 (Euclidean) for geometry, L1 (Manhattan) for sparsity, L∞ for worst-case component error.

In practice, a data matrix is a stack of these vectors. Column vectors are "one sample"; rows are "one feature across samples." Keeping straight which orientation you’re in is half of writing bug-free linear algebra.

## ELI-PHD

Vectors sit at the base of a tower: **inner product → norm → metric → topology**. The dot product is the non-degenerate bilinear form that makes ℝⁿ a Euclidean (hence Hilbert) space; the induced norm makes it a Banach space; the metric gives a topology.

Two facts do the heavy lifting in ML:

1. **Riesz representation** — every linear functional \`f\` on a finite-dimensional inner-product space is \`f(x) = w·x\` for a unique \`w\`. So "weights" are not arbitrary; they *are* the functionals. A linear model is a vector in the dual space.
2. **Orthogonal projections** onto a subspace are the unique minimizers of residual norm (the projection theorem). This is why least squares is not a heuristic — it’s the geometry of Hilbert spaces, and it is the reason the normal equations have a clean closed form.

Numerical care: compute \`||a||\` as \`sqrt(dot(a,a))\` (one pass, stable), and normalize as \`a / max(||a||, eps)\` to avoid division blow-up. In floating point, dot products accumulate error O(n·ε) — for huge embeddings this is why libraries use compensated (Kahan) or SIMD-blocked sums.
`,
  },
];
