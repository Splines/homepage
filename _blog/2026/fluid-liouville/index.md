---
layout: page
date: 2026-11-14
title: "A Fluid Dynamics View on Liouville's Theorem"
katex:
  enabled: true
  macros:
    \dv: '\frac{\mathrm{d}#1}{\mathrm{d}#2}'
    \pdv: '\frac{\partial #1}{\partial #2}'
    \Ham: '\mathcal{H}'
    \RR: '\mathbb{R}'
custom_css: /blog/2026/fluid-liouville/fluid-liouville.css
vite_entrypoint: main.ts
table_of_contents: true
excerpt: >
  It is surprising how many ideas and formulas from fluid dynamics appear in statistical physics. In this post, we derive Liouville's theorem from mass conservation, the Reynolds transport theorem and Hamilton's equations. We then use Jeans' theorem to see which ensembles are in equilibrium.
---

Lately in my statistical physics course at university, I was quite surprised to run across many ideas and formulas I have already encountered in fluid dynamics. It's beautiful to see two fields that at first sight have nothing to do with each other come together. In this post, I want to share this beauty with you. We will derive Liouville's theorem, starting from mass conservation, then using the Reynolds transport theorem and finally Hamilton's equations. At the end, we'll use Jeans' theorem to see which ensembles are in equilibrium.

<small>
_Tip: Hover over footnote and equation references to get a preview without scrolling._
</small>

## Lagrangian & Eulerian

There are two different views to describe the motion of a fluid:

In the **Lagrangian** (material) description, we follow each fluid particle individually. A particle is labeled by its position $\bm X$ at the initial time $t = 0$. Its motion is described by a map[^phi] $\phi$ that tells us where this particle is at time $t$:

$$
\phi(\bm X, 0) = \bm X, \qquad \bm x = \phi(\bm X, t)
$$

<figure class="fl-figure fl-wide" data-scene="lagrangian">
  <canvas class="fl-canvas fl-canvas-strip" aria-label="Animation of five fluid particles drifting to the right. One particle is highlighted with a circle for its initial position X = phi(X, 0). A line traces its path so far, and its current position is labeled x = phi(X, t)." role="img"></canvas>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
  </div>
</figure>

In this material view, quantities like temperature are attached to a particle $\bm X$ and we denote them with a hat: $\hat T(\bm X, t)$. But this can quickly become impractical if you think of just how many particles swirl around to make up a fluid. We don't want to track each of those individually. Instead, in the **Eulerian** (spatial) view, we stand still as observer: a position $\bm x$ in space is fixed. Now we watch what particles happen to pass by and measure the change of temperature at that fixed point: $T(\bm x, t)$.

<figure class="fl-figure fl-wide" data-scene="eulerian">
  <canvas class="fl-canvas fl-canvas-strip" aria-label="A flow watched at a point x fixed in space, marked with a blue target. Particles drift past it, and every now and then one passes right through it." role="img"></canvas>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
  </div>
</figure>

Both views describe the same physics, it's just another perspective:

$$
T \bigl(\phi(\bm X, t), t\bigr)
= T(\bm x, t)
= \hat T(\bm X, t)
= \hat T \bigl(\phi^{-1}(\bm x, t), t\bigr)
$$

But their time derivatives differ. The partial derivative $\partial T / \partial t$ is the change at a fixed position, e.g. what a thermometer fixed in some place would measure. But what about a thermometer that moves along, say with velocity $\bm u$? At time $t$, it is at $\bm x$, a short moment $\delta t$ later at $\bm x + \bm u \, \delta t$. Taylor-expanding $T$ in both arguments to first order gives:

$$
T(\bm x + \bm u \, \delta t, \, t + \delta t)
= T(\bm x, t) + \pdv{T}{t} \, \delta t + \bm u \cdot \nabla T \, \delta t + \mathcal{O}(\delta t^2)
$$

So the rate of change the moving thermometer measures is

$$
\lim_{\delta t \to 0} \frac{T(\bm x + \bm u \, \delta t, \, t + \delta t) - T(\bm x, t)}{\delta t}
= \pdv{T}{t} + \bm u \cdot \nabla T
$$

The temperature field itself may change in time, which is the $\partial T / \partial t$ term. But even if the field is frozen in time, the thermometer may still measure a change, simply because it moves on its own to places with a different temperature. This is what the convective term $\bm u \cdot \nabla T$ captures.

Next, let's attach this thermometer to a fluid particle $\bm X$ and let it move with it through the fluid (Lagrangian view). The particle is at position $\bm x = \phi(\bm X, t)$ at time $t$, and its velocity is $\bm v(\bm x, t) = \pdv{\phi}{t}(\bm X, t)$. The rate of change the thermometer measures is then called the _material time derivative_:

$$
\dv{}{t} T \bigl(\phi(\bm X, t), t\bigr) = \pdv{T}{t} + \underbrace{\bm v \cdot \nabla T}_{\text{convective part}}
$$ <eq:material-derivative>

Note how it makes sense to denote this by a total time derivative $\mathrm{d}T / \mathrm{d}t$, because what we did with the Taylor-expansion above is just the multivariable chain rule for the limit $\delta t \to 0$. But now we know that the total derivative $\mathrm{d}T / \mathrm{d}t$ corresponds to the picture of riding along with a fluid particle, whereas the partial derivative $\partial T / \partial t$ corresponds to standing still at a fixed point in space. This will become important later.

### Material volume

Before moving on, let us also introduce the _material volume_ $V(t)$: we take a region $\hat V$ at $t = 0$ and let it move with the fluid, $V(t) = \phi(\hat V, t)$. We slightly abuse the notation here and pass in a set of points $\hat V$ to the map $\phi$, which is defined for single points. But this is just a shorthand for applying $\phi$ to every point in $\hat V$.

Given our assumptions[^phi] on $\phi$, the material volume $V(t)$ is "well-behaved" in the sense that $V(t)$ may stretch, twist and deform, but it stays in one piece and it always consists of the same particles it started with[^well-behaved]. You can see this in the following animation.

<figure class="fl-figure fl-wide" data-scene="material-volume">
  <canvas class="fl-canvas fl-canvas-wide" aria-label="Animation of a vortex. Fluid particles circle around the center, inner ones faster than outer ones. A brown material volume V(t) starts as a disk, the initial region V-hat, whose dashed outline stays in place. V(t) is wound up into a long spiral filament but always contains the same particles and is never torn apart." role="img"></canvas>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
  </div>
</figure>


## Balance equation

Since over time, the material volume always contains the same fluid particles, its mass cannot change. Let $\rho$ denote the mass density, i.e. integrating over it gives the total mass inside $V(t)$. Then the conservation of mass reads:

$$
\dv{m}{t} = \dv{}{t} \int_{V(t)} \rho \,\mathrm{d}\bm x \overset{!}{=} 0
$$ <eq:mass-conservation>

Next, we use the Reynolds transport theorem (without proof):

<div class="fl-panel" markdown="1">
<p class="fl-key-title">Reynolds transport theorem</p>

Let $V(t)$ be a material volume moving with the velocity field $\bm v$, and let $f(\bm x, t)$ be a (smooth) density. Then

$$
\dv{}{t} \int_{V(t)} f \,\mathrm{d}\bm x = \int_{V(t)} \left( \pdv{f}{t} + \nabla \cdot (f \bm v) \right) \mathrm{d}\bm x
$$ <eq:reynolds>
</div>

As you might have guessed, we now set $f := \rho$ to turn the conservation of mass into

$$
\int_{V(t)} \left( \pdv{\rho}{t} + \nabla \cdot (\rho \bm v) \right) \mathrm{d}\bm x \overset{!}{=} 0
$$

This holds for arbitrary material volumes $V(t)$, so the integrand has to vanish everywhere, which gives the continuity equation:

<div class="fl-key fl-key-inline">
<p class="fl-key-title">Continuity equation</p>
$$
\pdv{\rho}{t} + \nabla \cdot (\rho \bm v) = 0
$$ <eq:continuity>
</div>

One can also turn this into a balance equation for a _fixed_ region $V$ in space. Simply apply Gauß' theorem to the second term of @eq:reynolds with $f = \rho$. The divergence term turns into a surface integral:

$$
0 \overset{@eq:mass-conservation}{=} \dv{}{t} \int_{V(t)} \rho \,\mathrm{d}\bm x
\overset{\text{Gauß on } @eq:reynolds}{=}
\int_{V(t)} \pdv{\rho}{t} \,\mathrm{d}\bm x + \int_{\partial V(t)} \mathrm{d}\bm A \cdot \rho \bm v
$$

Now let's define the current $\bm j := \rho \bm v$. We want to analyze a _fixed_ region $V$, which corresponds to a material volume $V(t)$ at some instant $t$. Since $V$ itself doesn't move, we can pull the partial time derivative out of the integral over $V$, and we get the balance equation for the mass $m_V(t)$ inside $V$:

$$
-\int_{\partial V} \mathrm{d}\bm A \cdot \bm j
= \pdv{}{t} \int_V \rho \,\mathrm{d}\bm x
= \dv{m_V}{t}
$$ <eq:balance>

It tells us: the mass inside a _fixed_ region $V$ can only change by what flows through its boundary $\partial V$. And the minus sign shows that if more mass flows out than in, the mass inside $V$ decreases. See the following animation, where a dense cluster of particles flows through a fixed volume $V$, increasing the mass inside $V$ while it flows in, then decreasing the mass again while the particles flow out.

<figure class="fl-figure fl-wide" data-scene="balance">
  <div class="fl-stage">
    <canvas class="fl-canvas fl-canvas-wide" aria-label="Animation of a channel flow that is fastest in the middle. A dense puff of particles drifts through a fixed volume V. Particles entering V light up blue, particles leaving it red. A plot traces the mass inside V over time, which rises while the puff flows in and falls again while it flows out." role="img"></canvas>
  </div>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
  </div>
</figure>


## Connection to phase space

In phase space, each point represents a possible state of our system. The axes of this multidimensional space are the generalized coordinates of the system and their conjugate momenta. For our purposes, we consider $N$ particles in three dimensions, so we have $3N$ position coordinates $\bm q = (q_1, \dots, q_{3N})$ and $3N$ momentum coordinates $\bm p = (p_1, \dots, p_{3N})$. The phase space is then $6N$-dimensional and we denote a point in it by $(\bm q, \bm p)$.

The funny thing is that this abstract point in phase space, representing a state of a particle system, can itself be considered as a particle in a fluid. The "fluid" is the ensemble of copies of our system, each with a different initial condition. The time evolution of the system is then a trajectory through phase space, determined by Hamilton's equations.

Let's see this with the famous harmonic oscillator: a mass $m$ on a spring with stiffness $k$ that moves back and forth on a line. We just consider $N=1$ particle in one dimension, so the state of the system is described by the position $q$ and momentum $p$ alone. The phase space is then 2-dimensional. The Hamiltonian is the total energy:

$$
\Ham(q, p) = \frac{p^2}{2m} + \frac{k}{2} q^2
$$

With Hamilton's equations, we find:

$$
\dot q = \pdv{\Ham}{p} = \frac{p}{m}, \qquad \dot p = -\pdv{\Ham}{q} = -k q
$$

To keep things simple, we choose units such that $m = k = 1$. Starting from $(q_0, p_0)$, the solution to this ordinary differential equation is

$$
q(t) = q_0 \cos t + p_0 \sin t, \qquad p(t) = p_0 \cos t - q_0 \sin t
$$

So every state moves clockwise on a circle around the origin. The radius of one trajectory stays constant, $r^2 = q^2 + p^2 = q_0^2 + p_0^2$, since the energy $\Ham = (q^2 + p^2)/2$ is conserved.

<figure class="fl-figure fl-wide" data-scene="oscillator">
  <div class="fl-lab">
    <canvas class="fl-canvas fl-canvas-springs" aria-label="Four masses on springs attached to a wall, each in its own color, swinging back and forth with different amplitudes. An arrow above every mass shows its momentum." data-canvas="springs" role="img"></canvas>
    <canvas class="fl-canvas fl-canvas-square" aria-label="Phase space of the harmonic oscillator, position q horizontally and momentum p vertically. Each of the four copies is a dot in its color that circles the origin clockwise, all with the same period. Optionally, many more copies fill a disk that turns like a rigid body." data-canvas="phase" role="img"></canvas>
  </div>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
    <div class="fl-choice" aria-label="Copies in phase space" role="group">
      <button class="fl-button" aria-pressed="true" data-copies="few" type="button">Four copies</button>
      <button class="fl-button" aria-pressed="false" data-copies="many" type="button">Many copies</button>
    </div>
  </div>
  <figcaption>
    Copies of the harmonic oscillator in real space and phase space. The arrows above the masses show their momentum $p$.
  </figcaption>
</figure>

You can click on "Many copies" to fill the phase space with many copies of the system, all with different initial conditions. The whole cloud then "streams" through phase space with the velocity field $\bm v(q, p) = (\dot q, \dot p) = (p, -q)$. In this sense, the ensemble of copies really is a fluid in phase space.

Let's recap our general setting in statistical physics: we consider a real system of $N$ particles. We represent the state of this system by a single point in $6N$-dimensional phase space. With the system evolving in time, this point will move around in phase space. We then take many copies of this system, each with different initial conditions, i.e. many points in phase space. We let the systems evolve in time, so now many points move around in phase space. And this movement is like a flow of a fluid, just very abstract. The points in phase space are the "fluid particles", and the Hamiltonian gives us a velocity field.

To describe which states of the system are more likely than others, we introduce a probability density $\rho(\bm q, \bm p, t)$ in phase space. It tells us what fraction of the copies of the system is in a small region around $(\bm q, \bm p)$ at time $t$ (per volume of that region). The total probability of finding the system somewhere in phase space is always 1 (normalization):

$$
\int_{\RR^{6N}} \rho(\bm q, \bm p, t) \,\mathrm{d}\bm q \, \mathrm{d}\bm p = 1
$$

This is analogous to the mass density of a fluid, and mass conservation now becomes the conservation of probability. The continuity equation @eq:continuity then describes how the probability density $\rho$ changes in time, and it is exactly the same as in fluid dynamics. This is so powerful because we can now use tools from fluid dynamics to study problems in statistical physics.


## Liouville's theorem

So let's do this by looking closer at the continuity equation @eq:continuity. We can expand its divergence term using the product rule:

$$
\begin{aligned}
0 &= \pdv{\rho}{t} + \nabla \cdot (\rho \bm v) \\
  &\explain{\text{product rule: } \nabla \cdot (\rho \bm v) = \bm v \cdot \nabla \rho + \rho \, (\nabla \cdot \bm v)} \\
  &= \pdv{\rho}{t} + \bm v \cdot \nabla \rho + \rho \, (\nabla \cdot \bm v)
\end{aligned}
$$ <eq:continuity-expanded>

We focus on $\nabla \cdot \bm v$ first. Remember that the velocity in phase space is $\bm v = (\dot{\bm q}, \dot{\bm p})$ and nabla is the gradient in phase space, $\nabla = (\partial / \partial \bm q, \partial / \partial \bm p)$.

$$
\begin{aligned}
\nabla \cdot \bm v &= \sum_{i=1}^{3N} \left( \pdv{\dot q_i}{q_i} + \pdv{\dot p_i}{p_i} \right) \\
  &\explain{\text{Hamilton: } \dot q_i = \pdv{\Ham}{p_i}, \quad \dot p_i = -\pdv{\Ham}{q_i}} \\
  &= \sum_{i=1}^{3N} \left( \frac{\partial^2 \Ham}{\partial q_i \, \partial p_i} - \frac{\partial^2 \Ham}{\partial p_i \, \partial q_i} \right) \\
  &\explain{\text{Schwarz: order of partial derivatives can be swapped}} \\
  &= 0
\end{aligned}
$$

This result, $\nabla \cdot \bm v = 0$, means that the probability fluid is _incompressible_. A region in phase space can deform, but never shrink or grow! To see this, we can use the Reynolds transport theorem @eq:reynolds once more, this time with $f := 1$. Then the left-hand side is simply the change of the volume of the material region $V(t)$.

$$
\dv{}{t} \int_{V(t)} \mathrm{d}\bm x = \int_{V(t)} \nabla \cdot \bm v \,\mathrm{d}\bm x = 0
$$

We have used Hamilton's equations to arrive here. A general flow, e.g. with friction, would still obey the continuity equation, but not $\nabla \cdot \bm v = 0$.

<figure class="fl-figure fl-wide" data-scene="incompressible">
  <div class="fl-lab">
    <canvas class="fl-canvas fl-canvas-pendulum" aria-label="Three pendulums in blue, red and orange hanging from a common pivot. They start at rest at increasing angles; the ones released higher swing wider and take longer, so they drift out of step. With friction, their swings die down." data-canvas="real" role="img"></canvas>
    <canvas class="fl-canvas fl-canvas-pendulum" aria-label="Phase space of the pendulum, angle q horizontally and momentum p vertically. A disk of copies is wound up into a spiral because swings with larger amplitude take longer. The three pendulums are marked as blue, red and orange dots within it. Without friction, the area of the region stays the same. With friction, the region spirals inwards and its area shrinks." data-canvas="phase" role="img"></canvas>
  </div>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
    <div class="fl-choice" aria-label="Friction" role="group">
      <button class="fl-button" aria-pressed="true" data-friction="off" type="button">Without friction</button>
      <button class="fl-button" aria-pressed="false" data-friction="on" type="button">With friction</button>
    </div>
  </div>
  <div class="fl-readouts">
    <span>Area of the region: <output aria-live="off" data-output="area">100 %</output></span>
    <span>Density of copies: <output aria-live="off" data-output="density">&times; 1.00</output></span>
  </div>
  <figcaption>
    Copies of a pendulum, $\Ham = p^2/2 - \cos q$, in real space and phase space, released from rest at different angles. Swings with a larger amplitude take longer. So with time, the disk of copies in phase space gets stretched into a spiral, but its area stays the same. With friction, the area shrinks and the copies get more crammed together.
  </figcaption>
</figure>

Next, we continue with the expanded continuity equation @eq:continuity-expanded. Since $\nabla \cdot \bm v = 0$, the last term vanishes and we are left with

$$
\pdv{\rho}{t} + \underbrace{\bm v \cdot \nabla \rho}_{\text{convective part}} = 0
$$ <eq:liouville-partial>

Déjà vu? Absolutely. This is just the material time derivative @eq:material-derivative for the density $\rho$ in phase space. We can verify this by following a single copy of the system along its trajectory $(\bm q(t), \bm p(t))$ and looking at the density it sees. The chain rule gives:

$$
\dv{}{t} \rho(\bm q(t), \bm p(t), t)
= \pdv{\rho}{t} + \sum_{i=1}^{3N} \left( \pdv{\rho}{q_i} \dot q_i + \pdv{\rho}{p_i} \dot p_i \right)
= \pdv{\rho}{t} + \bm v \cdot \nabla \rho
$$

As we've seen, $\mathrm{d} \rho / \mathrm{d} t$ is the perspective of riding along with a copy of the system, i.e. considering a trajectory in phase space. Putting everything together, we finally arrive at Liouville's theorem:

<div class="fl-key" markdown="1">
<p class="fl-key-title">Liouville's theorem</p>

Consider an ensemble of copies of a system that evolve according to Hamilton's equations. If copies are neither created nor destroyed, their probability density $\rho$ in phase space is constant along every trajectory:

$$
\dv{\rho}{t} = 0
$$ <eq:liouville>

</div>

Or equivalently, the density only depends on the initial conditions of the copy, not on time:

$$
\rho(\bm q(t), \bm p(t), t) = \rho(\bm q(0), \bm p(0), 0)
$$ <eq:liouville-integrated>

Let's see again where our assumptions were used:

- _Conservation of probability_ @eq:mass-conservation resulted in the continuity equation @eq:continuity. Copies of the system don't spawn or vanish.
- _Hamilton's equations_ gave us $\nabla \cdot \bm v = 0$, i.e. the incompressibility of the probability fluid. This is not true for general flows, e.g. with friction.

Note that the Hamiltonian may depend explicitly on time, e.g. for a gas in a cylinder with a moving piston. Liouville's theorem still holds.


## Liouville's equation

Liouville's theorem tells us what happens along a trajectory in phase space. But often, we're interested in the opposite perspective: how does $\rho$ change at a _fixed_ point in phase space? As discussed, this is just the term $\partial \rho / \partial t$, so let's solve @eq:liouville-partial for it and use Hamilton's equations once again to arrive at:

$$
\begin{aligned}
\pdv{\rho}{t} &= - \bm v \cdot \nabla \rho
  = - \sum_{i=1}^{3N} \left( \dot q_i \pdv{\rho}{q_i} + \dot p_i \pdv{\rho}{p_i} \right) \\
  &\explain{\text{Hamilton: } \dot q_i = \pdv{\Ham}{p_i}, \quad \dot p_i = -\pdv{\Ham}{q_i}} \\
  &= - \sum_{i=1}^{3N} \left( \pdv{\Ham}{p_i} \pdv{\rho}{q_i} - \pdv{\Ham}{q_i} \pdv{\rho}{p_i} \right)
\end{aligned}
$$

The sum on the right-hand side is the Poisson bracket. Note that other textbooks may define it with the opposite sign.

$$
\{A, B\} := \sum_{i=1}^{3N} \left( \pdv{A}{p_i} \pdv{B}{q_i} - \pdv{A}{q_i} \pdv{B}{p_i} \right)
$$

With this, we get:

<div class="fl-key fl-key-inline">
<p class="fl-key-title">Liouville's equation</p>
$$
\pdv{\rho}{t} = -\{\Ham, \rho\}
$$ <eq:liouville-equation>
</div>

So the change of $\rho$ at a fixed point is completely determined by $\rho$ and the Hamiltonian $\Ham$.

Note how @eq:liouville-equation gives us a condition for when $\rho$ is stationary in phase space, i.e. when the statistics of our ensemble don't change at any point anymore. This is what we call (statistical) equilibrium:

$$
\pdv{\rho}{t} = 0 \quad \Longleftrightarrow \quad \{\Ham, \rho\} = 0
$$ <eq:stationary>


## Jeans' theorem

Liouville's theorem $\mathrm{d}\rho / \mathrm{d}t = 0$ @eq:liouville is a statement from the Lagrangian perspective: if we ride along with a copy of our system, the density never changes. However, in statistical physics, we are often more interested in the Eulerian perspective. Standing still at a fixed point in phase space, does the density change? If it doesn't change at any point, the ensemble is in (statistical) equilibrium, see @eq:stationary. Then every ensemble average $\langle A \rangle = \int A \, \rho \,\mathrm{d}\bm q \,\mathrm{d}\bm p$ of an observable $A(\bm q, \bm p)$ is constant in time as well:

$$
\dv{}{t} \langle A \rangle = \int A \, \pdv{\rho}{t} \,\mathrm{d}\bm q \,\mathrm{d}\bm p = 0
$$ <eq:ensemble-average>

The copies themselves still move along their trajectories. Only the _statistics_ are frozen, not the individual systems. So given Liouville's theorem, can we conclude that the ensemble is in equilibrium? No!


To see this, let's discuss what the physical system determines and what is up to us. Hamilton's equations determine the velocity $\bm v$ at every point in phase space, so they tell us how a copy moves, wherever it might be. But they don't tell us how probability is distributed in phase space, i.e. how many copies are at each point at the beginning. The initial density $\rho(\bm q, \bm p, 0)$ is a choice we make to hopefully have a good model of the real system. Think of a river: its shape determines how the water flows. If you pour some ink into the river, it will be carried along with the flow. But where this ink ends up depends on where you poured it in. With the initial density, we determine where the ink is in phase space at the beginning.

Before we can answer the question about equilibrium, let's look at the following matrix, which shows all four combinations of the two time derivatives being zero or not. We land in different rows based on the physics: is the flow incompressible (as every Hamiltonian flow is) or not? Since $\mathrm{d}\rho / \mathrm{d}t = -\rho \, (\nabla \cdot \bm v)$ by @eq:continuity-expanded, this decides whether the density along a trajectory changes. We land in different columns based on our choice of the initial density for that flow. In the top row, both examples show the same harmonic oscillator from above, only with different initial densities. For contrast, the bottom row depicts two compressible flows (which are hence not Hamiltonian). Click on an example to see how the density $\rho$ evolves and what the two observers measure: the one standing still (Eulerian) and the one riding along (Lagrangian). The density is shown in orange, the individual copies (sampled from that density) as dots.

<figure class="fl-figure fl-wide" data-scene="derivatives">
  <div class="fl-matrix" aria-label="Examples" role="group">
    <span class="fl-matrix-corner"><span>Choice of $\rho_0$ &rarr;</span><span>Physics &darr;</span></span>
    <span class="fl-matrix-head">$\partial \rho / \partial t = 0$<small>stationary ensemble</small></span>
    <span class="fl-matrix-head">$\partial \rho / \partial t \neq 0$<small>changes at fixed points</small></span>
    <span class="fl-matrix-head fl-matrix-row">$\mathrm{d}\rho / \mathrm{d}t = 0$<small>incompressible, e.g. Hamiltonian</small></span>
    <button class="fl-cell" aria-label="Harmonic oscillator with a ring density: total and partial derivative are both zero" aria-pressed="false" data-example="ring" type="button"><strong>Harmonic oscillator</strong><small>Ring: density only depends on the energy</small></button>
    <button class="fl-cell" aria-label="Harmonic oscillator with a blob density: total derivative zero, partial derivative not zero" aria-pressed="true" data-example="blob" type="button"><strong>Harmonic oscillator</strong><small>Blob: density concentrated in one spot</small></button>
    <span class="fl-matrix-head fl-matrix-row">$\mathrm{d}\rho / \mathrm{d}t \neq 0$<small>compressible, not Hamiltonian</small></span>
    <button class="fl-cell" aria-label="Traffic flow with a jam: total derivative not zero, partial derivative zero" aria-pressed="false" data-example="traffic" type="button"><strong>Traffic flow</strong><small>Jam: density piles up where copies are slow</small></button>
    <button class="fl-cell" aria-label="Damped oscillator with a blob density: total and partial derivative are both not zero" aria-pressed="false" data-example="damped" type="button"><strong>Damped oscillator</strong><small>Blob: density concentrated in one spot</small></button>
  </div>
  <div class="fl-lab">
    <div class="fl-stage">
      <canvas class="fl-canvas fl-canvas-square" aria-label="Phase space with the density of copies of a system as an orange wash and the copies as dots. A blue ring marks an observer standing still at a fixed point, a brown ring an observer riding along with one copy." data-canvas="phase" role="img"></canvas>
    </div>
    <div class="fl-lab-column">
      <canvas class="fl-canvas fl-canvas-series" aria-label="Plot over one loop of the density measured by the observer standing still (blue) and by the observer riding along (brown)." data-canvas="series" role="img"></canvas>
      <div class="fl-controls">
        <button class="fl-button fl-play" aria-label="Play animation" type="button">
          <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
          <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
        </button>
        <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
      </div>
    </div>
  </div>
  <figcaption class="fl-explanation" aria-live="polite">
    <div data-explains="blob">
      <p><strong>Harmonic oscillator with a blob: $\mathrm{d}\rho / \mathrm{d}t = 0$, but $\partial \rho / \partial t \neq 0$.</strong> The blob in phase space turns clockwise and keeps its shape. The rider always sees the same density. The observer standing still sees nothing at first, then the blob sweeps past once per period.</p>
    </div>
    <div data-explains="ring" hidden>
      <p><strong>Harmonic oscillator with a ring: $\mathrm{d}\rho / \mathrm{d}t = 0$ and $\partial \rho / \partial t = 0$.</strong> Same flow as for the blob, but now the density only depends on the energy, $\rho = \Phi(\Ham)$. The copies still circle the origin, but each copy that leaves a point is replaced by one with the same density. This will lead us to Jeans' theorem below.</p>
    </div>
    <div data-explains="damped" hidden>
      <p><strong>Damped oscillator with a blob: $\mathrm{d}\rho / \mathrm{d}t \neq 0$ and $\partial \rho / \partial t \neq 0$.</strong> Friction makes the flow compressible, $\nabla \cdot \bm v < 0$. The blob shrinks but keeps its probability, so the density around the rider grows. The observer standing still sees the blob pass by once, then nothing (as all copies spiral into the origin).</p>
    </div>
    <div data-explains="traffic" hidden>
      <p><strong>Traffic flow with a jam: $\mathrm{d}\rho / \mathrm{d}t \neq 0$, but $\partial \rho / \partial t = 0$.</strong> A compressible flow, so it is not Hamiltonian. Like a bottleneck on a highway, the density fluctuates when you "ride along" with it: copies get squeezed together when entering the jam and spread apart again when leaving it. But when you stand still as observer at any point, you see a constant density there.</p>
    </div>
  </figcaption>
</figure>

Liouville's theorem holds for the top row since $\nabla \cdot \bm v = 0$. Yet, the blob is not in equilibrium, while the ring is. The difference is that the density of the ring only depends on the energy, while the blob has a more complicated dependence on $(\bm q, \bm p)$. This is essentially the content of Jeans' theorem. Let's analyze the situation now.

By $E(t)$, we denote the energy of a single copy of the system that is at the point $\bigl(\bm q(t), \bm p(t)\bigr)$ in phase space at time $t$ (not the energy of the whole ensemble):

$$
E(t) := \Ham\bigl(\bm q(t), \bm p(t), t\bigr)
$$

For now, we still allow the Hamiltonian to depend explicitly on time. Let's follow the copy along its trajectory and compute how its energy changes. With the chain rule:

$$
\begin{aligned}
\dv{E}{t} &= \sum_{i=1}^{3N} \left( \pdv{\Ham}{q_i} \dot q_i + \pdv{\Ham}{p_i} \dot p_i \right) + \pdv{\Ham}{t} \\
  &\explain{\text{Hamilton: } \dot q_i = \pdv{\Ham}{p_i}, \quad \dot p_i = -\pdv{\Ham}{q_i}} \\
  &= \underbrace{\sum_{i=1}^{3N} \left( \pdv{\Ham}{q_i} \pdv{\Ham}{p_i} - \pdv{\Ham}{p_i} \pdv{\Ham}{q_i} \right)}_{= \, -\{\Ham, \Ham\} = 0} + \pdv{\Ham}{t} \\
  &\explain{\text{the two terms in the sum are the same product}} \\
  &= \pdv{\Ham}{t}
\end{aligned}
$$ <eq:energy-change>

So a copy cannot change its energy by moving through phase space. Its energy only changes if the Hamiltonian itself changes with time.

_First assumption:_ the Hamiltonian has no explicit time dependence, e.g. because the system is isolated. Then the energy of every copy is conserved along its trajectory:

$$
\pdv{\Ham}{t} = 0
\quad \overset{@eq:energy-change}{\Longrightarrow} \quad
\dv{E}{t} = 0
$$ <eq:energy-conservation>

_Second assumption (the ansatz):_ at $t = 0$, we prepare the ensemble with a density that depends _only_ on the energy:

$$
\rho(\bm q, \bm p, 0) = \Phi\bigl(\Ham(\bm q, \bm p)\bigr)
$$ <eq:ansatz>

for some function $\Phi$ of one variable. In general, $\rho$ is a function of all $6N$ phase space coordinates. The ansatz says that it depends on them only through the _single_ number $\Ham(\bm q, \bm p)$. In other words: two points in phase space with the same energy must have the same density. For the harmonic oscillator with $\Ham = (q^2 + p^2)/2$, the curves of constant energy are circles around the origin. So the ansatz says that $\rho$ may depend on the radius, but not on the angle. Above, this is fulfilled for the ring, but not for the blob.

Now let's see what happens at later times. We follow a copy along its trajectory and use Liouville's theorem in the form @eq:liouville-integrated:

$$
\begin{aligned}
\rho\bigl(\bm q(t), \bm p(t), t\bigr) &\overset{@eq:liouville-integrated}{=} \rho\bigl(\bm q(0), \bm p(0), 0\bigr) \\
  &\explain{\text{ansatz } @eq:ansatz} \\
  &= \Phi\bigl(E(0)\bigr) \\
  &\explain{\text{energy conservation } @eq:energy-conservation \text{: } E(0) = E(t)} \\
  &= \Phi\bigl(E(t)\bigr) = \Phi\bigl(\Ham(\bm q(t), \bm p(t))\bigr)
\end{aligned}
$$

So far, this is a statement along a single trajectory, i.e. from the Lagrangian perspective. To switch to the Eulerian one, we need that every point $(\bm q, \bm p)$ in phase space is occupied at time $t$ by exactly one copy. For a fluid, this is the bijectivity we simply assumed for the map $\phi$[^phi]. For Hamilton's equations, we don't have to assume it. It follows from two properties of their solutions:

- _At most one copy:_ Suppose two copies were at the same point at time $t$. So they are in exactly the same state and both solve Hamilton's equations. Given that $\Ham$ is twice continuously differentiable (which we already needed for Schwarz' theorem above), the right-hand sides $\partial \Ham / \partial p_i$ and $-\partial \Ham / \partial q_i$ are continuously differentiable. Then by the Picard–Lindelöf theorem, there is only one solution to Hamilton's equations that passes through this state (forwards and backwards in time). So the two copies agree at all times, in particular at $t = 0$. They were the same copy of the system (i.e. the same particle in phase space) all along. So we have shown that trajectories in phase space never cross.

- _At least one copy:_ Start at $(\bm q, \bm p)$ and run Hamilton's equations backwards in time until $t = 0$. This gives the initial state of a copy that arrives at $(\bm q, \bm p)$ at time $t$. For this, the solution has to exist on the whole time interval $[0, t]$, i.e. no copy should escape to infinity in finite time. This is true for many systems, e.g. for the harmonic oscillator, since the surfaces of constant energy are bounded. In general, we have to assume that the Hamiltonian is "well-behaved" in the sense that it doesn't allow for any singularities or solutions that blow up in finite time.

Now back to where we left off. For any time $t$ and any point $(\bm q, \bm p)$, we pick the unique copy with $(\bm q(t), \bm p(t)) = (\bm q, \bm p)$ and get:

$$
\rho(\bm q, \bm p, t) = \Phi\bigl(\Ham(\bm q, \bm p)\bigr) \quad \text{for all } t
$$

The right-hand side doesn't depend on $t$, so the density at every fixed point stays the same, $\partial \rho / \partial t = 0$. This is Jeans' theorem, here for the special case of the energy[^jeans]:

<div class="fl-key" markdown="1">
<p class="fl-key-title">Jeans' theorem</p>

Consider an ensemble of copies of a system with a time-independent Hamiltonian, $\partial \Ham / \partial t = 0$. If the initial density only depends on the energy, $\rho(\bm q, \bm p, 0) = \Phi(\Ham(\bm q, \bm p))$, it stays like this for all times. In particular, the ensemble is in equilibrium:

$$
\pdv{\rho}{t} = 0
$$ <eq:jeans>

</div>

Let's see again where our assumptions were used:

- _Liouville's theorem_ @eq:liouville-integrated: the density is constant along every trajectory. This in turn relied on the conservation of probability and on Hamilton's equations.
- _Time-independent Hamiltonian:_ the energy of every copy is conserved @eq:energy-conservation.
- _Ansatz_ @eq:ansatz: the initial density only depends on the energy. This model choice is up to us, but it is physically motivated: we expect that the equilibrium state of a system only depends on its energy, not on the details of how it got there. And we showed that such densities indeed stay stationary. (The converse doesn't hold in general: other conserved quantities, like angular momentum, can also give stationary densities.)

You may wonder how the density at a fixed point can stay the same, given that the copies keep moving and carry their values of $\rho$ with them. Couldn't these values get shuffled around? No, because a copy is only ever replaced by a copy with the _same_ density. Every copy stays on its energy surface, and by the ansatz, $\rho$ has the same value $\Phi(E)$ everywhere on that surface. So whatever copy arrives at a fixed point comes from the same energy surface as the copy that just left. In terms of the balance equation @eq:balance: as much probability flows into any fixed region as flows out of it.

The ring in the above matrix is an example of Jeans' theorem. Every copy rotates around the origin on the circle of its own energy. All copies on one circle rotate together, but since $\rho$ is the same everywhere on that circle, the picture looks the same at every instant[^sampling]. In contrast, for the blob, if you consider one circle of constant energy, the copies of the system along that circle have different densities. So the observer standing still observes a change in density as the blob passes by.

Note that how exactly $\rho$ depends on the energy, i.e. the function $\Phi$ in the ansatz @eq:ansatz, is a model choice. E.g. for an isolated system with known energy $E_0$, we pick the microcanonical ensemble $\rho \propto \delta(\Ham - E_0)$. This density only depends on the energy, so by Jeans' theorem @eq:jeans, it describes a system in equilibrium, that is, one where the statistics don't change with time, see @eq:ensemble-average.

---

To summarize: Hamilton's equations tell us how a copy of the system moves through phase space. They give us an incompressible probability fluid in phase space. Which fluid we pour in is up to us (choice of initial density). Liouville's theorem tells us that the density along every trajectory stays the same, no matter what we pour in. Jeans' theorem tells us that if we pour it in such that its density only depends on the energy, the ensemble is in equilibrium and stays like this forever.

I hope this was somewhat helpful to you. I find it fascinating that the same mathematical structure appears in fluid dynamics and in statistical physics and that we can actually use tools from fluid dynamics to better understand statistical physics.

[^phi]: Assumptions for $\phi$: First, for each $t$, $\phi(\cdot, t)$ is a $C^1$-diffeomorphism (bijective, $C^1$ and with $C^1$ inverse $\phi^{-1}(\cdot, t)$). Second, $\phi(\bm X, \cdot)\in C^1$ for each $\bm X$. And last but not least, $\phi(\cdot, 0) = \mathrm{id}$.

[^well-behaved]: Here's a proof overview. Particles that started in $\hat V$ are in $V(t)$ by definition, so they don't leave. Could a particle $\bm X$ from outside sneak in? No, since it would have to sit at the same place as some particle $\bm Y \in \hat V$, i.e. $\phi(\bm X, t) = \phi(\bm Y, t)$. But as $\phi(\cdot, t)$ is injective, this means $\bm X = \bm Y$, so $\bm X$ was in $\hat V$ all along. Hence $V(t)$ always contains exactly the particles that started in $\hat V$: nothing ever enters or leaves. Moreover, since $\phi(\cdot, t)$ and its inverse are continuous, $V(t)$ cannot tear apart or get holes in it.

[^jeans]: In stellar dynamics, Jeans' theorem is usually stated for any integrals of motion, not just the energy: a density that depends on $(\bm q, \bm p)$ only through conserved quantities (e.g. energy and angular momentum) is stationary. The proof is the same as for the energy.

[^sampling]: In the above animation, you can still see the dots rotating. But only because you look at individual points sampled from the density. Imagine you sampled infinitely many points from the density: then the picture would be the same ring at all times.
