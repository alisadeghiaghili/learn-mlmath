/**
 * Series: Matrices — a grid of numbers that acts as a *map*.
 *
 * Builds directly on Vectors. The through-line: a matrix is a machine that
 * sends every arrow to a new arrow. We climb from "apply it" to "invert it"
 * to "find the directions it doesn't rotate" (eigenvectors), ending on the
 * eigen capstone — the same geometric move behind PCA, principal directions,
 * and every spectral method in ML.
 *
 * Every goal is machine-checked with numeric tolerance, so a wrong answer is
 * caught, not just accepted.
 */

import { preds } from '../engine/checks';
import type { Sequence } from '../engine/types';

export const series: Sequence[] = [
  {
    id: 'matrices',
    title: 'Matrices: Machines That Move Arrows',
    levels: [
      {
        id: 'mat-first',
        eli: 'eli5',
        name: 'Meet a matrix',
        brief:
          'A matrix is a **grid of numbers** — but on the board it is a *machine*. It takes any arrow and moves it. Type `M = [[2, 0], [0, 3]]`: it stretches x by 2 and y by 3, and you’ll watch the unit square deform.',
        hint: 'M = [[2, 0], [0, 3]]',
        start: '',
        par: 1,
        difficulty: 1,
        goal: {
          type: 'predicates',
          predicates: [preds.isMat('M'), preds.matEq('M', [[2, 0], [0, 3]])],
        },
        solution: 'M = [[2, 0], [0, 3]]',
        lesson: `A matrix is a little machine. Feed it a point and it spits out a new point. \`M = [[2, 0], [0, 3]]\` says "double the x-coordinate, triple the y-coordinate."

On the board, a matrix is drawn by showing where the **unit square** goes. The square’s corners are stretched by the map. That deformed square *is* the matrix, made visible — one of the most important pictures in all of linear algebra.`,
        learning: ['A matrix is a grid of numbers that acts as a map', 'The board shows its effect by deforming the unit square'],
        fieldNotes: ['A neural-net layer is a matrix: it maps your input vector to an output vector', 'Image filters (blur, sharpen) are matrices that remap each pixel’s neighborhood'],
      },
      {
        id: 'mat-matvec',
        eli: 'eli5',
        name: 'Applying the map',
        brief:
          'To apply `M` to a vector `a`, take each **row** of `M` and dot it with `a`. With `M = [[2, 0], [0, 3]]` and `a = [1, 4]` given, make `v = M * a`. The board draws the deformed square *and* the new arrow `v`.',
        hint: 'v = M * a',
        start: 'M = [[2, 0], [0, 3]]\na = [1, 4]',
        par: 1,
        difficulty: 1,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('v'), preds.vecEq('v', [2, 12])],
        },
        solution: 'v = M * a',
        lesson: `Applying a matrix to a vector is "row-dots-vector":

\`M @ a = [ 2·1 + 0·4 ,  0·1 + 3·4 ] = [ 2, 12 ]\`

Each output component is a dot product between a row of the matrix and the input. That’s the whole operation — a stack of dot products, exactly the layers you’ll meet in a network. On the board you can see \`a = [1, 4]\` and its image \`v = [2, 12]\` together.`,
        learning: ['M @ a is each row of M dotted with a', 'Matrix application = a stack of dot products'],
        fieldNotes: ['`y = W @ x` is the core of a linear layer — one matvec per output neuron', 'Gaussian / blur kernels are matvecs applied to a patch of pixels'],
      },
      {
        id: 'mat-matmul',
        eli: 'eli10',
        name: 'Composing maps',
        brief:
          'Two maps in a row is a **composition** — and it’s just matrix multiplication. With `A` and `B` given, make `C = A * B`. The order matters: `A * B` means "apply `B` first, then `A`".',
        hint: 'C = A * B',
        start: 'A = [[2, 0], [0, 1]]\nB = [[1, 1], [0, 2]]',
        par: 1,
        difficulty: 2,
        goal: {
          type: 'predicates',
          predicates: [preds.isMat('C'), preds.matEq('C', [[2, 2], [0, 2]])],
        },
        solution: 'C = A * B',
        lesson: `Multiplying matrices composes their maps. \`A * B\` means: first run the input through \`B\`, then through \`A\`.

\`A @ B = [[2, 2], [0, 2]]\` — check it: apply \`B\` to the x-axis, then \`A\`.

The catch that trips everyone up: **order**. In general \`A * B ≠ B * A\`. Maps don’t commute — stretch-then-rotate is a different machine than rotate-then-stretch. Once you start chaining layers, this non-commutativity is what makes the network expressive.`,
        learning: ['(A * B) applies B first, then A', 'Matrix multiplication is non-commutative — order changes the map'],
        fieldNotes: ['A deep network is just a long composition of matrices (plus nonlinearities between them)', 'The Jacobian of a network is a product of per-layer matrices'],
      },
      {
        id: 'mat-transpose',
        eli: 'eli10',
        name: 'Flipping: transpose',
        brief:
          'The **transpose** flips a matrix over its diagonal — rows become columns. With `M = [[1, 5, 2], [3, 0, 4]]` given (a 2×3), make `T = transpose(M)`. It comes out 3×2.',
        hint: 'T = transpose(M)',
        start: 'M = [[1, 5, 2], [3, 0, 4]]',
        par: 1,
        difficulty: 2,
        goal: {
          type: 'predicates',
          predicates: [preds.isMat('T'), preds.matEq('T', [[1, 3], [5, 0], [2, 4]])],
        },
        solution: 'T = transpose(M)',
        lesson: `Transposing swaps rows and columns: \`T[i][j] = M[j][i]\`. A 2×3 becomes a 3×2.

\`transpose([[1, 5, 2], [3, 0, 4]]) = [[1, 3], [5, 0], [2, 4]]\`

The transpose shows up constantly because it swaps "row-vector" and "column-vector" conventions, and it appears in the **Gram matrix** \`XᵀX\` — the heart of least squares — and in every attention computation as \`QᵀK\`.`,
        learning: ['transpose flips rows and columns', 'XᵀX is the Gram matrix that powers least squares'],
        fieldNotes: ['`X.T @ X` is how you compute pairwise feature correlations', 'In transformers, `Q @ K.T` scores token-to-token attention'],
      },
      {
        id: 'mat-det',
        eli: 'eli15',
        name: 'Determinant: the area scale',
        brief:
          'The **determinant** is the (signed) factor by which a map scales area. For `M = [[3, 1], [2, 4]]` it’s `3·4 − 1·2 = 10`: the unit square’s area grows ten-fold. Make `d = det(M)` and `print(d)`.',
        hint: 'd = det(M)',
        start: 'M = [[3, 1], [2, 4]]',
        par: 2,
        difficulty: 3,
        goal: {
          type: 'predicates',
          predicates: [preds.isNum('d'), preds.valEq('d', 10)],
        },
        solution: 'd = det(M)\nprint(d)',
        lesson: `The determinant tells you how a map distorts **area**. \`det(M) = 3·4 − 1·2 = 10\` means the unit square (area 1) is turned into a parallelogram of area 10.

Three things to read off the sign and size:
- \`det > 0\`: orientation preserved (not mirrored).
- \`det < 0\`: the map **flips** the plane over.
- \`det = 0\`: the map crushes the plane to a line (or a point) — it has **no inverse**.

That last case is the one that matters: a zero determinant means the map is singular and information is lost.`,
        learning: ['det(M) = the signed area-scale factor', 'det = 0 means the map is singular (no inverse)'],
        fieldNotes: ['A zero det on a covariance matrix means features are perfectly redundant', 'The determinant appears in the Gaussian likelihood’s normalizing constant'],
      },
      {
        id: 'mat-rank',
        eli: 'eli15',
        name: 'Rank: how many directions survive',
        brief:
          'The **rank** of a matrix is how many *independent directions* it preserves. If two rows are just multiples of each other, the map squashes a dimension. With `M = [[1, 2], [2, 4]]` (row 2 is 2× row 1), make `r = rank(M)` and `print(r)`. It collapses to **1**.',
        hint: 'r = rank(M)',
        start: 'M = [[1, 2], [2, 4]]',
        par: 2,
        difficulty: 3,
        goal: {
          type: 'predicates',
          predicates: [preds.isNum('r'), preds.valEq('r', 1)],
        },
        solution: 'r = rank(M)\nprint(r)',
        lesson: `Rank counts the independent rows (equivalently, independent columns). In \`M = [[1, 2], [2, 4]]\`, the second row is just 2× the first, so there’s only **one** independent direction: the whole 2-D plane gets crushed onto a line. Rank 1.

Rank is the honest measure of "how much information this map keeps." A full-rank 2×2 (rank 2) is invertible; a rank-1 2×2 is a projection onto a line. Rank deficiency is exactly what makes a system of equations under-determined.`,
        learning: ['rank = number of independent rows/columns', 'A map is invertible iff it is full rank (det ≠ 0)'],
        fieldNotes: ['PCA keeps the top-rank directions of your data — the ones with the most variance', 'A low-rank approximation is how you compress a weight matrix (LoRA)'],
      },
      {
        id: 'mat-inv',
        eli: 'eli20',
        name: 'The inverse: undoing the map',
        brief:
          'The **inverse** is the map that undoes the original: `M @ inv(M) = I`. With `M = [[4, 7], [2, 6]]`, make `Mi = inv(M)` and `P = M * Mi`. The product `P` must be the identity `[[1,0],[0,1]]`.',
        hint: 'Mi = inv(M)\nthen P = M * Mi',
        start: 'M = [[4, 7], [2, 6]]',
        par: 2,
        difficulty: 4,
        goal: {
          type: 'predicates',
          predicates: [preds.isMat('Mi'), preds.matEq('P', [[1, 0], [0, 1]])],
        },
        solution: 'Mi = inv(M)\nP = M * Mi',
        lesson: `The inverse \`M⁻¹\` is the unique map such that \`M @ M⁻¹ = I\`. Apply the map, then its inverse, and you land exactly where you started.

You can verify it live: \`P = M * Mi\` and every off-diagonal collapses to 0, every diagonal to 1. That’s the definition of "undoing."

The key constraint: an inverse exists **only if** the map is full rank (det ≠ 0). A singular matrix squashed a direction away, so there is no way to recover it. In ML we rarely invert matrices outright — it’s numerically fragile — but the *concept* of the inverse is what lets us solve \`Ax = b\` for the weights \`x\`.`,
        learning: ['inv(M) is the map with M @ inv(M) = I', 'An inverse exists only when the matrix is full rank'],
        fieldNotes: ['Solving a least-squares fit means multiplying by (XᵀX)⁻¹', 'We usually avoid explicit inverses (they’re unstable) and solve the linear system instead'],
      },
      {
        id: 'mat-eigen',
        eli: 'eliphd',
        name: 'Capstone: eigen-directions',
        brief:
          'ELI-PHD. An **eigenvector** is a special direction a map only *stretches*, never rotates — by the factor **eigenvalue** `λ`. For `M = [[2, 1], [1, 2]]`, the pair `l = L[0]` and `v = V[0]` is already extracted. Prove the eigen-relation: make `res = M * v - l * v` and `print(norm(res))`. It must be **0** — that *is* `M·v = λ·v`.',
        hint: 'res = M * v - l * v, then print(norm(res)) → 0',
        start: 'M = [[2, 1], [1, 2]]\nL = eigenvalues(M)\nV = eigenvectors(M)\nl = L[0]\nv = V[0]',
        par: 2,
        difficulty: 5,
        goal: {
          type: 'predicates',
          predicates: [preds.isVec('res'), preds.normEquals('res', 0)],
        },
        solution: 'res = M * v - l * v\nprint(norm(res))',
        lesson: `The eigen-relation \`M @ v = λ v\` says: apply the map to \`v\` and you get the **same arrow**, just longer (or shorter) by \`λ\`. The direction doesn’t change — only the length.

Prove it the way we proved projections: compute the residual \`res = M @ v − λ v\` and show its norm is 0. For \`M = [[2, 1], [1, 2]]\` and \`v = [1, 1]/√2\`, \`M @ v = 3v\` — the map only stretches the diagonal by 3.

This is the capstone because **eigenvectors are the coordinate system a matrix is simplest in.** Diagonalize \`M = PΛP⁻¹\` and the matrix becomes a bag of pure scalings. That one idea is PCA (principal components = eigenvectors of the covariance), the power method for PageRank, spectral clustering, and the stability analysis of any dynamical system — including, ultimately, the fixed-point geometry of neural networks.`,
        learning: ['An eigenvector is a direction the map only scales, by the eigenvalue', 'The eigen-residual M@v − λv is zero — the defining relation', 'Diagonalization makes a matrix a bag of scalar stretches'],
        fieldNotes: ['PCA = eigenvectors of the covariance matrix, ordered by eigenvalue', 'Power iteration finds the dominant eigenvector — the engine behind PageRank'],
      },
    ],
    deepLesson: `# Matrices, end to end

This is the full ramp for the series. Read the band you need — or read them all, top to bottom.

## ELI5

A matrix is a machine with slots. Put a point in, get a different point out. You can stack machines (multiply matrices), flip one around (transpose), and — if the machine didn’t crush anything — run it *backwards* (inverse). The board always shows you what a machine does by watching where the unit square lands.

## ELI10

A matrix \`A\` is a linear map: it preserves straight lines and the origin. "Linear" is the whole contract — \`A@(x+y) = Ax + Ay\` and \`A@(c·x) = c·Ax\`.

The toolkit that follows from that contract:
- **Apply**: \`A @ v\` is each row of \`A\` dotted with \`v\`.
- **Compose**: \`A @ B\` means "B first, then A." Order matters.
- **Transpose**: \`Aᵀ\` swaps rows and columns.
- **Determinant**: the signed area-scale. Zero ⇒ the map crushed a direction.
- **Rank**: how many independent directions survive. Full rank ⇒ invertible.
- **Inverse**: the map with \`A A⁻¹ = I\`, existing only when full rank.

## ELI15

Now the invariants that make the whole subject cohere:

- **det** is the determinant of the map on the plane; it’s the volume of the parallelepiped the basis vectors span. \`det(AB) = det(A)det(B)\`, \`det(Aᵀ) = det(A)\`, and \`det(A) = 0\` exactly when the columns are linearly dependent.
- **rank** is the dimension of the image (column space). The **rank-nullity theorem** — \`rank + nullity = n\` — says the information lost (the null space) is exactly the complement of what’s kept.
- **Inverses** exist iff \`rank = n\`. Solve \`Ax = b\` by \`x = A⁻¹b\`, but in practice solve the system directly (Gaussian elimination) — forming the explicit inverse is numerically unstable.
- The **Gram matrix** \`AᵀA\` encodes all pairwise dot products of the columns; it is symmetric positive semi-definite and is the skeleton of least squares.

## ELI20

Treat a matrix as an operator on an inner-product space. Two pillars:

1. **Spectral view.** The eigenvalues of a *symmetric* matrix are real and its eigenvectors can be chosen orthonormal, so \`A = QΛQᵀ\` with \`Q\` orthogonal. That is the **spectral theorem** — the reason symmetric operators (covariance, Gram, Laplacian) diagonalize cleanly. Non-symmetric matrices are messier (complex eigenvalues, defective forms), which is why the SVD is the general-purpose "always works" factorization.
2. **Singular values.** The **SVD** \`A = UΣVᵀ\` factors *any* matrix into rotate — stretch — rotate. The singular values are the eigenvalues of \`AᵀA\` (up to sqrt). Truncating the SVD gives the best rank-k approximation (Eckart–Young) — the theoretical backbone of compression, denoising, and low-rank adaptation.

Rank is the SVD seen head-on: it is the number of *nonzero* singular values. So "rank-1" is literally "one singular value, all others zero."

## ELI-PHD

Matrices live at the top of the tower built in the Vectors series: an **endomorphism** of a finite-dimensional inner-product space. The structure theorem splits by symmetry:

- **Self-adjoint (Hermitian)**: spectral theorem — real eigenvalues, orthonormal eigenbasis, functional calculus \`f(A) = Q f(Λ) Qᵀ\`. This is why covariance, Hessian, and graph-Laplacian operators all behave.
- **Normal** (\`AAᵀ = AᵀA\`): still orthogonally diagonalizable, but eigenvalues may be complex (rotations are the prototype).
- **General**: Jordan canonical form (algebraic) or SVD (analytic). The SVD is the stable, numerically honest object; it is what \`numpy.linalg.svd\` returns and what every low-rank method optimizes.

Two facts do the heavy lifting in ML:

1. **PCA is an eigendecomposition.** The principal components of data \`X\` are the eigenvectors of \`C = XᵀX / n\`, the covariance, ordered by eigenvalue. The kth component captures the kth-largest eigenvalue of variance. "Explained variance" is literally the eigenvalue.
2. **The power method finds the top eigenpair.** Iterating \`v ← A v / ‖A v‖\` converges to the dominant eigenvector when the top eigenvalue is separated — the algorithm under PageRank and the workhorse for huge eigenproblems where you cannot form \`A\` explicitly.

Numerical care: compute rank via SVD (count singular values > tol), not via \`det\` (which overflows/underflows and is a single global number). For a near-singular system, solve with a pivoted factorization and check the condition number — a matrix is "effectively singular" when \`1/κ(A)\` is near machine precision, long before \`det\` reads 0.
`,
  },
];
