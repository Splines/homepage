---
layout: page
title: "Two electrons in a box: from Slater determinants to an interacting ground state"
katex:
  enabled: true
excerpt: >
  We build up the same-spin two-electron wavefunction in a 1D box from scratch — starting with spin orbitals and the Slater determinant, deriving the antisymmetric pair, then turning on the Coulomb interaction. The latter is solved numerically on a uniform grid; an interactive widget lets you dial the coupling strength λ from 0 to 200 and watch the ground state deform in real time.
---

{% vite_typescript_tag ~/quantum %}
{% vite_stylesheet_tag ~/quantum.css %}

These are notes I made while working through the first exercise sheet of a quantum-chemistry course. The end goal is an interactive widget that shows the ground-state spatial wavefunction $\psi(r_1, r_2)$ of two same-spin electrons in a one-dimensional box as we dial the Coulomb coupling $\lambda$ continuously from $0$ (non-interacting) up to $200$ (strongly correlated). To understand what we're looking at, we first need to derive the wavefunction we are about to plot.

## Setting

We work in atomic units throughout. Two electrons live in a one-dimensional box of length $1$, i.e. $r \in (0, 1)$. The single-particle Hamiltonian inside the box is just the kinetic term $-\tfrac{1}{2}\,\partial^2_r$, with hard walls at $r=0$ and $r=1$ enforced by

$$
  v_\text{box}(r) =
  \begin{cases}
    0 & 0 < r < 1 \\
    \infty & \text{otherwise.}
  \end{cases}
$$

The normalized one-electron _spatial orbitals_ and corresponding eigenenergies are

$$
\begin{aligned}
  \psi_n(r) &= \sqrt{2}\,\sin(n\pi r), \\
  \varepsilon_n &= \frac{n^2\pi^2}{2}, \qquad n = 1, 2, \dots
\end{aligned}
$$

A one-electron _spin orbital_ couples a spatial part to a spin function:

$$
  \phi(x) = \psi(r)\,s(\omega), \qquad x = (r, \omega),
$$

where $s(\omega) \in \{\alpha(\omega), \beta(\omega)\}$ stands for spin up ($\uparrow$) and spin down ($\downarrow$), respectively. The two spin functions are orthonormal: $\langle \alpha \mid \alpha \rangle = \langle \beta \mid \beta \rangle = 1$ and $\langle \alpha \mid \beta \rangle = 0$.

## The Slater determinant

A two-electron wavefunction must be _antisymmetric_ under exchange of the two electrons (Pauli principle):

$$
  \Phi(x_1, x_2) = -\Phi(x_2, x_1).
$$

Given two orthonormal spin orbitals $\phi_a$ and $\phi_b$, the simplest antisymmetric wavefunction we can build out of them is the _Slater determinant_

$$
\begin{aligned}
  \Phi(x_1, x_2)
    &= \frac{1}{\sqrt{2}}
       \begin{vmatrix}
         \phi_a(x_1) & \phi_b(x_1) \\
         \phi_a(x_2) & \phi_b(x_2)
       \end{vmatrix} \\
    &= \frac{1}{\sqrt{2}}\Bigl(\phi_a(x_1)\phi_b(x_2) - \phi_a(x_2)\phi_b(x_1)\Bigr).
\end{aligned}
$$

Swapping $x_1 \leftrightarrow x_2$ swaps the two rows of the determinant and therefore flips its sign — antisymmetry comes for free. We will use this construction twice below.

## Non-interacting opposite spins ($\uparrow, \downarrow$)

For two non-interacting electrons (no Coulomb term yet), the lowest-energy occupation puts both electrons into $\psi_1$, one with spin up and one with spin down:

$$
\begin{aligned}
  \phi_a(x) &= \psi_1(r)\,\alpha(\omega), \\
  \phi_b(x) &= \psi_1(r)\,\beta(\omega).
\end{aligned}
$$

These are orthogonal because their _spin_ parts are. Plugging them into the Slater determinant and collecting spatial vs. spin factors yields

$$
\begin{aligned}
  \Phi_{\uparrow\downarrow}(x_1, x_2)
    &= \underbrace{\psi_1(r_1)\,\psi_1(r_2)}_{\text{spatial (symmetric)}} \\
    &\quad \cdot
       \underbrace{\frac{1}{\sqrt{2}}\Bigl(\alpha(\omega_1)\beta(\omega_2) - \alpha(\omega_2)\beta(\omega_1)\Bigr)}_{\text{spin (antisymmetric)}}.
\end{aligned}
$$

The total wavefunction is antisymmetric, but cleanly factors into a _symmetric_ spatial part and an _antisymmetric_ spin singlet. The total energy is just $E_{\uparrow\downarrow} = 2\varepsilon_1 = \pi^2 \approx 9.87 \,\text{a.u.}$

> **TODO:** add an interactive plot of the spatial factor $\psi_1(r_1)\psi_1(r_2) = 2\sin(\pi r_1)\sin(\pi r_2)$ side by side with the same-spin one further below. Both should share the same colorbar so the difference in concentration along the diagonal is visible at a glance.

## Non-interacting same spins ($\uparrow, \uparrow$)

If the two electrons share the same spin, the Pauli principle forbids them from sharing the same spatial orbital. The lowest-energy occupation therefore promotes one of them to $\psi_2$:

$$
\begin{aligned}
  \phi_a(x) &= \psi_1(r)\,\alpha(\omega), \\
  \phi_b(x) &= \psi_2(r)\,\alpha(\omega).
\end{aligned}
$$

This time the orthogonality comes from the spatial parts. The Slater determinant now factorises the other way around:

$$
\begin{aligned}
  \Phi_{\uparrow\uparrow}(x_1, x_2)
    &= \underbrace{\frac{1}{\sqrt{2}}\Bigl(\psi_1(r_1)\psi_2(r_2) - \psi_2(r_1)\psi_1(r_2)\Bigr)}_{\text{spatial (antisymmetric)}} \\
    &\quad \cdot \underbrace{\alpha(\omega_1)\,\alpha(\omega_2)}_{\text{spin (symmetric)}}.
\end{aligned}
$$

Two important consequences follow from the antisymmetric spatial factor:

1. Setting $r := r_1 = r_2$ gives $\psi_1(r)\psi_2(r) - \psi_2(r)\psi_1(r) = 0$. The probability of finding both electrons at the same position is exactly zero — the so-called _exchange hole_.
2. The total energy is $E_{\uparrow\uparrow} = \varepsilon_1 + \varepsilon_2 = \tfrac{5}{2}\pi^2 \approx 24.67 \,\text{a.u.}$, which is higher than $E_{\uparrow\downarrow}$ because one electron is forced into the higher orbital.

This non-interacting same-spin state is precisely what we will recover from the numerical solver below at $\lambda = 0$.

> **TODO:** plot of the one-electron densities $n(r)$ for the two cases. The opposite-spin density $4\sin^2(\pi r)$ is sharply peaked at the centre, whereas the same-spin density gets an extra $2\sin^2(2\pi r)$ contribution from $\psi_2$ that pushes weight toward the edges.

## Switching on the Coulomb interaction

We now add a tunable Coulomb repulsion between the two electrons. The two-electron Hamiltonian becomes

$$
\begin{aligned}
  H_\lambda
    &= -\frac{1}{2}\,\frac{\partial^2}{\partial r_1^2}
       - \frac{1}{2}\,\frac{\partial^2}{\partial r_2^2} \\
    &\quad + v_{\mathrm{box}}(r_1) + v_{\mathrm{box}}(r_2)
       + \lambda\,\frac{1}{\lvert r_1 - r_2 \rvert}.
\end{aligned}
$$

The dimensionless coupling $\lambda \ge 0$ smoothly interpolates between the non-interacting case ($\lambda = 0$, where we already know the answer analytically) and a strongly correlated regime where the two electrons want to sit as far apart as possible. We focus on the same-spin sector, so the spatial wavefunction stays antisymmetric:

$$
  \psi(r_1, r_2) = -\psi(r_2, r_1),
  \qquad
  \psi(r, r) = 0.
$$

The diagonal-zero condition is what saves us from the Coulomb singularity: the wavefunction simply vanishes wherever the two electrons would coincide.

## Discretisation on a uniform grid

We discretise the box with $N$ equally-spaced grid points

$$
  \Delta r = \frac{1}{N-1},
  \qquad
  r_i = i\,\Delta r,
  \qquad
  i = 0, \dots, N-1,
$$

and store the wavefunction as $\psi_{i,j} := \psi(r_i, r_j)$. The boundary conditions force $\psi_{0, j} = \psi_{N-1, j} = \psi_{i, 0} = \psi_{i, N-1} = 0$, and antisymmetry plus the diagonal-zero condition mean that the only independent unknowns are the strictly upper-triangular _interior_ pairs

$$
  \mathcal{P} := \bigl\{(i, j) : 1 \le i < j \le N-2\bigr\},
  \qquad
  M := \lvert \mathcal{P} \rvert = \binom{N-2}{2}.
$$

The remaining values are reconstructed via $\psi_{j,i} = -\psi_{i,j}$ and the boundaries.

### Finite-difference operator

A standard central-difference Taylor expansion in each coordinate gives

$$
  \left.\frac{\partial^2 \psi}{\partial r_1^2}\right|_{i,j}
  \approx \frac{\psi_{i-1,j} - 2\psi_{i,j} + \psi_{i+1,j}}{(\Delta r)^2}
  + \mathcal{O}\bigl((\Delta r)^2\bigr),
$$

and analogously for $r_2$. Substituting both into $H_\lambda \psi = E\psi$ at an interior pair $(i, j) \in \mathcal{P}$ yields a five-point stencil:

$$
\begin{aligned}
  \frac{2}{(\Delta r)^2}\,\psi_{i,j}
    &- \frac{1}{2(\Delta r)^2}\Bigl(\psi_{i-1,j} + \psi_{i+1,j} + \psi_{i,j-1} + \psi_{i,j+1}\Bigr) \\
    &+ \lambda\,\frac{\psi_{i,j}}{\lvert r_j - r_i \rvert}
     = E\,\psi_{i,j}.
\end{aligned}
$$

Whenever a neighbour falls onto a wall ($i' = 0$ or $j' = N-1$) or onto the diagonal ($i' = j'$), the corresponding $\psi$ value is zero, so the Coulomb singularity at $r_i = r_j$ is _never touched_.

### From a 2D table to a vector

To pose this as a matrix eigenvalue problem we lay out the interior pairs in lexicographic order and assign each one a single linear index $k$. Counting the entries before the row that starts with $i$,

$$
  k(i, j) = \frac{(i-1)(2N - i - 4)}{2} + (j - i - 1),
  \qquad k = 0, 1, \dots, M-1.
$$

Stacking the unknowns into $\mathbf{c} \in \mathbb{R}^M$ with $c_{k(i,j)} := \psi_{i,j}$ turns the five-point stencil above into a sparse linear eigenvalue problem

$$
  H\mathbf{c} = E\,\mathbf{c},
  \qquad
  H \in \mathbb{R}^{M \times M}.
$$

The diagonal entry of $H$ is the on-site coefficient $\tfrac{2}{(\Delta r)^2} + \tfrac{\lambda}{\lvert r_j - r_i \rvert}$, and each surviving 4-neighbour contributes one off-diagonal entry $-\tfrac{1}{2(\Delta r)^2}$. Each row of $H$ therefore has at most five non-zeros, so $H$ is sparse.

### Solving for the ground state

Our solver uses an inverse-iteration scheme with a conjugate-gradient inner solve (see the [solver source](https://github.com/Splines/homepage/blob/main/assets/vite/quantum/solver.ts) for details) to obtain the smallest eigenpair $(E, \mathbf{c})$ of $H$. Sparsity is what makes this practical: every CG step costs only $\mathcal{O}(M)$ work. The full $N \times N$ wavefunction is reconstructed from $\mathbf{c}$ via antisymmetry and finally normalised to satisfy the discrete two-electron condition

$$
  \sum_{i, j} \lvert \psi_{i, j} \rvert^2\,(\Delta r)^2 \stackrel{!}{\approx} 1.
$$

At $\lambda = 0$ the solver reproduces the analytic non-interacting ground-state energy $\tfrac{5}{2}\pi^2 \approx 24.67\,\text{a.u.}$ to four decimals — a useful sanity check.

## The interactive ground state

The widget below uses $N = 42$ grid points (so $M = \binom{40}{2} = 780$ unknowns), recomputes the ground state on every change of $\lambda$, and renders $\psi(r_1, r_2)$ as a diverging colour map (red for positive, blue for negative). The dashed diagonal $r_1 = r_2$ marks the line on which $\psi$ must vanish by antisymmetry. The colorbar is fixed to the $\lambda = 200$ scale so that the visual contrast is _comparable_ across all values of $\lambda$ — at small $\lambda$ the colours look pale on purpose.

<!-- markdownlint-disable-next-line MD033 -->
<div id="d3-wave" class="quantum-figure"></div>

A few things to look out for as you drag the slider:

- At $\lambda = 0$ the two extrema sit exactly at $(r_1, r_2) \approx (1/4, 3/4)$ and $(3/4, 1/4)$, as predicted by the analytic Slater determinant of $\psi_1$ and $\psi_2$.
- As $\lambda$ grows, the Coulomb repulsion pushes amplitude away from the diagonal: the extrema migrate toward the corners $(0, 1)$ and $(1, 0)$, and the wavefunction develops a noticeably sharper "valley" along $r_1 = r_2$.
- The energy printed above the slider increases monotonically with $\lambda$, since adding a positive interaction term can only raise the ground-state energy (variational principle).

> **TODO:** add a second, smaller interactive plot underneath showing the one-electron density $n(r) = 2 \int_0^1 \lvert \psi(r, r') \rvert^2\,\mathrm{d}r'$ for the same $\lambda$. As $\lambda$ grows the density should redistribute toward the box edges.
>
> **TODO:** add an interactive scree plot of the singular values of $\psi(r_i, r_j)$ on a logarithmic axis. At $\lambda = 0$ exactly two singular values are non-negligible (the Slater determinant has rank $2$). As $\lambda$ grows the spectrum fattens, signalling that the state becomes increasingly _multideterminantal_ — a single Slater determinant is no longer enough.

## Why this approach doesn't scale

For $n$ electrons in $d$ spatial dimensions, the size of the discrete eigenvalue problem grows as

$$
  M \in \mathcal{O}\left(\frac{N^{nd}}{n!}\right).
$$

For two electrons in 1D ($n = 2$, $d = 1$), this is just a few thousand unknowns and runs comfortably in the browser. For real molecules with even a handful of electrons in 3D the matrix size explodes — this is the famous _curse of dimensionality_ that motivates basis-set methods, density-functional theory, and pretty much the rest of quantum chemistry. Add to that the Coulomb cusps near each nucleus, which a uniform real-space grid would resolve only at ruinous resolution, and it becomes clear why direct grid discretisation is a tutorial-scale technique only.
