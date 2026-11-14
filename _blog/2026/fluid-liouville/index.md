---
layout: page
date: 2026-11-14
title: "A Fluid Dynamic's view on Liouville's Theorem"
katex:
  enabled: true
  macros:
    \dv: '\frac{\mathrm{d}#1}{\mathrm{d}#2}'
    \pdv: '\frac{\partial #1}{\partial #2}'
    \Ham: '\mathcal{H}'
custom_css: /blog/2026/fluid-liouville/fluid-liouville.css
vite_entrypoint: main.ts
excerpt: >
  TODO
---

Lately in my statistical physics course at university, I was quite surprised to run across many ideas and formulas I have already encountered in fluid dynamics. It's beautiful to see two fields that at first sight have nothing to do with each other come together. In this post, I want to share this beauty with you. We will derive Liouville's Theorem and start with mass conservation, then use Reynold's Transport Theorem and finally Hamilton's equations.


## Lagrangian & Eularian

There are two different views to describe the motion of a fluid:

In the **Lagrangian** (material) description, we follow each fluid particle individually. A particle is labeled by its position $\bm X$ at the initial time $t = 0$. Its motion is described by a map[^phi] $\phi$that tells us where this particle is at time $t$:

$$
\phi(\bm X, 0) = \bm X, \qquad \bm x = \phi(\bm X, t)
$$

<figure class="fl-figure fl-wide" data-scene="pathline">
  <canvas class="fl-canvas fl-canvas-strip" aria-label="Animation of five fluid particles drifting to the right. One particle is highlighted with a circle for its initial position X = phi(X, 0). A line traces its path so far, and its current position is labeled x = phi(X, t)." role="img"></canvas>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <input class="fl-slider" aria-label="Time t" max="1" min="0" step="any" type="range" value="0">
  </div>
</figure>

In this material view, quantities like the temperature are attached to a particle $\bm X$:

$$
\hat T(\bm X, t)
$$

But this can quickly become impractical if you think of just how many particles swirl around to make up a fluid. We don't want to track each of those individually. Instead, in the **Eularian** (spatial) view, we stand still as observer: a position $\bm x$ in space is fixed. Now we watch what particles happen to pass by and measure the change of temperature at that point, no matter which particles came and went through that point:

$$
T(\bm x, t)
$$

Both views describe the same physics, it's just another perspective.

$$
T \bigl((\phi(\bm X, t), t)\bigr)
= T(\bm x, t)
= \hat T(\bm X, t)
= \hat T \bigl((\phi^{-1}(\bm x, t), t)\bigr)
$$

But their time derivatives differ. The partial derivative $\partial T / \partial t$ is the change at a fixed position, i.e. what a thermometer nailed in place would measure. A thermometer drifting with the fluid instead measures the _material time derivative_, which we get from the chain rule with the velocity $\bm v = \partial \phi / \partial t$:

$$
\dv{}{t} T(\phi(\bm X, t), t) = \pdv{T}{t} + \underbrace{\bm v \cdot \nabla T}_{\text{convective part}}
$$

The convective part is the change the drifting thermometer sees just because it is carried to places with a different temperature, even if the temperature field itself is frozen in time.

The last ingredient is the _material volume_ $V(t)$: we take a region $\hat V$ at $t = 0$ and let it move with the fluid, $V(t) = \phi(\hat V, t)$. It can deform as much as it likes, but it always contains the same fluid particles. Nothing ever enters or leaves through its boundary.

<figure class="fl-figure fl-wide" data-scene="two-views">
  <div class="fl-stage">
    <canvas class="fl-canvas" aria-label="Animation of a vortex. Fluid particles circle around the center, inner ones faster than outer ones. A brown material volume is stretched into a long spiral filament but always contains the same particles. A blue square window stays fixed in space while particles stream through it." role="img"></canvas>
    <button class="fl-handle" aria-label="Fixed window: drag it, or use the arrow keys to move it" type="button"></button>
  </div>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
    <div class="fl-choice" aria-label="Camera" role="group">
      <button class="fl-button" aria-pressed="true" data-camera="still" type="button">Stand still</button>
      <button class="fl-button" aria-pressed="false" data-camera="ride" type="button">Ride along</button>
    </div>
  </div>
  <div class="fl-readouts">
    <span>Particles in $V(t)$: <output aria-live="off" data-output="material">0</output></span>
    <span>Of these, inside the fixed window: <output aria-live="off" data-output="window">0</output></span>
  </div>
  <figcaption>
    <span class="fl-swatch fl-swatch-accent"></span>Material volume $V(t)$ and its particles &middot;
    <span class="fl-swatch fl-swatch-fixed"></span>Window fixed in space &middot;
    <span class="fl-swatch fl-swatch-ink"></span>Particle we ride along with.
    In a vortex, the inner layers turn faster than the outer ones, so $V(t)$ is wound up into a long filament, but it never loses or gains a particle. The fixed window (drag it around) sees particles of $V(t)$ come and go. Switch the camera to ride along with the black particle in the middle of $V(t)$: now $V(t)$ stays around you (it only deforms), while the fixed window drifts by instead.
  </figcaption>
</figure>


## Balance equation

In the lecture script, the derivation starts with a balance equation for a _fixed_ region. Let's instead start where fluid dynamics starts: with a material volume $V(t)$. It always contains the same fluid particles, so its mass cannot change. Let $\rho$ denote the mass density, i.e. integrating over it gives the total mass inside $V(t)$. Then the conservation of mass reads:

$$
\dv{m}{t} = \dv{}{t} \int_{V(t)} \rho \,\mathrm{d}\bm x \overset{!}{=} 0
$$ <eq:mass-conservation>

Next, we can turn this into the continuity equation from the script by using:

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

This holds for arbitrary material volumes $V(t)$, so the integrand has to vanish everywhere, which gives the continuity equation we also have in the script:

<div class="fl-key fl-key-inline">
<p class="fl-key-title">Continuity equation</p>
$$
\pdv{\rho}{t} + \nabla \cdot (\rho \bm v) = 0
$$ <eq:continuity>
</div>

If you're wondering how the derivation of the script relates to this: it's basically the same. To see this, let's apply Gauß' theorem to the second term of @eq:reynolds with $f = \rho$. The divergence term turns into a surface integral:

$$
0 \overset{@eq:mass-conservation}{=} \dv{}{t} \int_{V(t)} \rho \,\mathrm{d}\bm x
\overset{\text{Gauß on } @eq:reynolds}{=}
\int_{V(t)} \pdv{\rho}{t} \,\mathrm{d}\bm x + \int_{\partial V(t)} \mathrm{d}\bm A \cdot \rho \bm v
$$

Now let's define the current $\bm j := \rho \bm v$ and freeze time at some instant $t$. There, $V(t)$ coincides with a _fixed_ region $V$, and for a fixed region, we can pull the partial time derivative out of the integral. This gives exactly the balance equation from the script:

$$
\int_{\partial V} \mathrm{d}\bm A \cdot \bm j = - \pdv{}{t} \int_V \rho \,\mathrm{d}\bm x
$$ <eq:balance>

It tells us: the mass inside a _fixed_ region $V$ can only change by what flows through its boundary $\partial V$. I just find it a lot more intuitive to start with the conservation of mass in a material volume @eq:mass-conservation to arrive at this result.

<figure class="fl-figure fl-wide" data-scene="balance">
  <div class="fl-stage">
    <canvas class="fl-canvas fl-canvas-channel" aria-label="Animation of a channel flow that is fastest in the middle. A dense puff of particles drifts through a fixed circular region V. Particles crossing the boundary of V light up. A material volume V(t) approaches, coincides with V for an instant, and moves on, deforming but keeping its particles." role="img"></canvas>
  </div>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
  </div>
  <div class="fl-readouts">
    <span>Particles in the fixed $V$: <output aria-live="off" data-output="now">0</output> = <output aria-live="off" data-output="start">0</output> at the start + <output aria-live="off" data-output="inflow">0</output> in &minus; <output aria-live="off" data-output="outflow">0</output> out</span>
    <span>Particles in $V(t)$: <output aria-live="off" data-output="material">0</output>, always the same</span>
  </div>
  <figcaption>
    <span class="fl-swatch fl-swatch-fixed"></span>Fixed region $V$ &middot;
    <span class="fl-swatch fl-swatch-accent"></span>Material volume $V(t)$ and its particles &middot;
    <span class="fl-swatch fl-swatch-inflow"></span>Entering $V$ &middot;
    <span class="fl-swatch fl-swatch-outflow"></span>Leaving $V$.
    The number of particles in the fixed region only changes by what crosses its boundary: that's the balance equation @eq:balance. Halfway through, the material volume $V(t)$ coincides with $V$, which is the moment where we &ldquo;froze time&rdquo; above.
  </figcaption>
</figure>

Last but not least, let's translate back to our setting. Instead of fluid particles, we consider copies of our system with different initial conditions in our phase space. These abstract particles basically move like a fluid through phase space. As the script puts it: "the system evolves like a hydrodynamic system, with a probability fluid streaming through state space". The mass density $\rho$ becomes the probability density, and the mass conservation becomes the conservation of probability. The continuity equation is then exactly the same as in fluid dynamics, namely @eq:continuity.


## Liouville's theorem

We are now in phase space with the coordinates $(\bm q, \bm p) := (\bm q_1, \dots, \bm q_N, \bm p_1, \dots, \bm p_N)$, where we write $q_i, p_i$ ($i = 1, \dots, 3N$) for the individual components. The velocity is now the phase space velocity $\bm v := (\dot{\bm q}, \dot{\bm p})$. Accordingly, our nabla operator is defined as $\nabla := (\partial / \partial \bm q, \partial / \partial \bm p)$. With this, we start from the continuity equation @eq:continuity and expand its divergence term:

$$
\begin{aligned}
0 &= \pdv{\rho}{t} + \nabla \cdot (\rho \bm v) \\
  &\explain{\text{product rule: } \nabla \cdot (\rho \bm v) = \bm v \cdot \nabla \rho + \rho \, (\nabla \cdot \bm v)} \\
  &= \pdv{\rho}{t} + \bm v \cdot \nabla \rho + \rho \, (\nabla \cdot \bm v)
\end{aligned}
$$ <eq:continuity-expanded>

Let's tackle the term $\nabla \cdot \bm v$ first:

$$
\begin{aligned}
\nabla \cdot \bm v &= \sum_{i=1}^{3N} \left( \pdv{\dot q_i}{q_i} + \pdv{\dot p_i}{p_i} \right) \\
  &\explain{\text{Hamilton: } \dot q_i = \pdv{\Ham}{p_i}, \quad \dot p_i = -\pdv{\Ham}{q_i}} \\
  &= \sum_{i=1}^{3N} \left( \frac{\partial^2 \Ham}{\partial q_i \, \partial p_i} - \frac{\partial^2 \Ham}{\partial p_i \, \partial q_i} \right) \\
  &\explain{\text{Schwarz: order of partial derivatives can be swapped}} \\
  &= 0
\end{aligned}
$$

This result, $\nabla \cdot \bm v = 0$, means that the probability fluid is _incompressible_. A region in phase space can deform, but never shrink or grow. To see this, we can use the Reynolds transport theorem @eq:reynolds once more, this time with $f := 1$. Then the integral is simply the volume of a material volume $V(t)$ in phase space, and

$$
\dv{}{t} \int_{V(t)} \mathrm{d}\bm x = \int_{V(t)} \nabla \cdot \bm v \,\mathrm{d}\bm x = 0
$$

<figure class="fl-figure fl-wide" data-scene="incompressible">
  <div class="fl-stage">
    <canvas class="fl-canvas fl-canvas-pendulum" aria-label="Animation of a pendulum in phase space, angle q horizontally and momentum p vertically. A disk of copies is wound up into a spiral because swings with larger amplitude take longer. Without friction, its area stays the same. With friction, the region spirals inwards and its area shrinks." role="img"></canvas>
  </div>
  <div class="fl-controls">
    <button class="fl-button fl-play" aria-label="Play animation" type="button">
      <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
      <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
    </button>
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
    Copies of a pendulum, $\Ham = p^2/2 - \cos q$, starting in a disk. Swings with a larger amplitude take longer, so the disk gets wound up into a thin spiral, but its area stays exactly the same. With friction, $\dot p = -\sin q - \gamma p$, the flow is no longer Hamiltonian: we have $\nabla \cdot \bm v = -\gamma$, the area shrinks like $e^{-\gamma t}$ and the copies get crowded.
  </figcaption>
</figure>

We have used Hamilton's equations to arrive here. A general flow, e.g. with friction, would still obey the continuity equation, but not $\nabla \cdot \bm v = 0$.

With this, the expanded continuity equation @eq:continuity-expanded simplifies to

$$
\pdv{\rho}{t} + \underbrace{\bm v \cdot \nabla \rho}_{\text{convective part}} = 0
$$ <eq:liouville-partial>

We can write the left-hand side as a total derivative along the trajectory of a copy of the system in phase space. To see this, we follow a single copy along its trajectory $(\bm q(t), \bm p(t))$ and look at the density it sees, i.e. $\rho(\bm q(t), \bm p(t), t)$. The chain rule gives:

$$
\dv{}{t} \rho(\bm q(t), \bm p(t), t)
= \pdv{\rho}{t} + \sum_{i=1}^{3N} \left( \pdv{\rho}{q_i} \dot q_i + \pdv{\rho}{p_i} \dot p_i \right)
= \pdv{\rho}{t} + \bm v \cdot \nabla \rho
$$

which is exactly the left-hand side of @eq:liouville-partial, and nothing else than the material time derivative from fluid dynamics. Finally, this results in:

<div class="fl-key" markdown="1">
<p class="fl-key-title">Liouville's theorem</p>

Consider an ensemble of copies of a system that evolve according to Hamilton's equations, with a twice continuously differentiable Hamiltonian $\Ham(\bm q, \bm p, t)$. If copies are neither created nor destroyed, their probability density $\rho$ in phase space is constant along every trajectory:

$$
\dv{\rho}{t} = 0
$$ <eq:liouville>

In other words: the probability fluid in phase space is incompressible. A region of phase space that moves with the flow may change its shape, but never its volume.
</div>

Or equivalently, the density only depends on the initial conditions of the copy, not on time:

$$
\rho(\bm q(t), \bm p(t), t) = \rho(\bm q(0), \bm p(0), 0)
$$ <eq:liouville-integrated>

It's worth pausing for a moment to see where exactly each assumption entered:

- _Conservation of probability_ gave us the continuity equation @eq:continuity. Copies of the system don't just pop into existence or vanish.
- _Hamilton's equations_ gave us $\nabla \cdot \bm v = 0$. With friction, the continuity equation still holds, but Liouville's theorem does not, see the pendulum above.
- _Smoothness_: we need $\Ham$ to be twice continuously differentiable to swap the partial derivatives (Schwarz), and $\rho$ to be differentiable to write down the continuity equation in the first place.

Note what we did _not_ need: the Hamiltonian may depend explicitly on time, e.g. for a gas in a cylinder with a moving piston. Liouville's theorem still holds.

Note also the difference between the two time derivatives: $\partial \rho / \partial t$ is the change at a _fixed_ point in phase space, i.e. the Eulerian perspective in fluid dynamics, where you stand still and watch the fluid flow past you. In contrast, $\mathrm{d}\rho / \mathrm{d}t$ is the change seen by a copy _moving_ along its trajectory, i.e. the Lagrangian perspective in fluid dynamics, where you ride along with a single fluid particle. In our case, we follow a single copy of the system along its trajectory in phase space.


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

The sum on the right-hand side is the Poisson bracket, in the convention the script (implicitly) uses[^sign]:

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


## Standing still or riding along

We now have two time derivatives of the same density $\rho(\bm q, \bm p, t)$, and I think it's worth getting a feeling for them. Imagine two observers in phase space: one of them stands still at a fixed point and measures $\partial \rho / \partial t$. The other one sits on a copy of the system, rides along with it and measures $\mathrm{d}\rho / \mathrm{d}t$.

Before we used Hamilton's equations, the expanded continuity equation @eq:continuity-expanded told us

$$
\dv{\rho}{t} = \pdv{\rho}{t} + \bm v \cdot \nabla \rho = -\rho \, (\nabla \cdot \bm v)
$$

So what the rider measures only depends on whether the flow compresses phase space. For Hamiltonian flows, it is always zero. What the observer standing still measures, $\partial \rho / \partial t = \mathrm{d}\rho / \mathrm{d}t - \bm v \cdot \nabla \rho$, also depends on how $\rho$ is arranged with respect to the flow. It vanishes only if inflow and outflow of probability balance at that point, $\nabla \cdot (\rho \bm v) = 0$. For an incompressible flow, this means that the copies arriving at the fixed point carry the same density as the ones leaving it.

All four combinations can happen. Pick one in the matrix to load it into the animation below, and switch the camera to stand still in phase space or to ride along with a copy.

<div class="fl-figure fl-wide" data-scene="derivatives">
  <div class="fl-matrix" aria-label="Examples" role="group">
    <span></span>
    <span class="fl-matrix-head">$\partial \rho / \partial t = 0$</span>
    <span class="fl-matrix-head">$\partial \rho / \partial t \neq 0$</span>
    <span class="fl-matrix-head fl-matrix-row">$\mathrm{d}\rho / \mathrm{d}t = 0$<small>e.g. Hamiltonian</small></span>
    <button class="fl-cell" aria-label="Ring: total and partial derivative are both zero" aria-pressed="false" data-example="ring" type="button"><strong>Ring</strong><small>Density that only depends on the energy</small></button>
    <button class="fl-cell" aria-label="Blob: total derivative zero, partial derivative not zero" aria-pressed="true" data-example="blob" type="button"><strong>Blob</strong><small>Harmonic oscillator with a Gaussian blob</small></button>
    <span class="fl-matrix-head fl-matrix-row">$\mathrm{d}\rho / \mathrm{d}t \neq 0$<small>not Hamiltonian</small></span>
    <button class="fl-cell" aria-label="Traffic jam: total derivative not zero, partial derivative zero" aria-pressed="false" data-example="traffic" type="button"><strong>Traffic jam</strong><small>Speed depends on the position</small></button>
    <button class="fl-cell" aria-label="Damped oscillator: total and partial derivative are both not zero" aria-pressed="false" data-example="damped" type="button"><strong>Damped oscillator</strong><small>Friction squeezes the ensemble</small></button>
  </div>
  <div class="fl-lab">
    <div class="fl-stage">
      <canvas class="fl-canvas fl-canvas-square" aria-label="Phase space with a density of copies of a system, an observer standing still at a fixed point (blue ring) and an observer riding along with one copy (brown ring)." data-canvas="phase" role="img"></canvas>
    </div>
    <div>
      <canvas class="fl-canvas fl-canvas-series" aria-label="Plot over one loop of the density measured by the observer standing still (blue) and by the observer riding along (brown)." data-canvas="series" role="img"></canvas>
      <div class="fl-readouts">
        <span><span class="fl-swatch fl-swatch-ring-fixed"></span>Standing still, $\rho$: <output aria-live="off" data-output="fixed">0</output></span>
        <span><span class="fl-swatch fl-swatch-ring"></span>Riding along, $\rho$: <output aria-live="off" data-output="rider">0</output></span>
      </div>
      <div class="fl-controls">
        <button class="fl-button fl-play" aria-label="Play animation" type="button">
          <svg class="fl-icon-play" aria-hidden="true" viewBox="0 0 16 16"><path d="M4 2.5v11l9-5.5z" /></svg>
          <svg class="fl-icon-pause" aria-hidden="true" viewBox="0 0 16 16"><path d="M3.5 2.5h3v11h-3zM9.5 2.5h3v11h-3z" /></svg>
        </button>
        <div class="fl-choice" aria-label="Camera" role="group">
          <button class="fl-button" aria-pressed="true" data-camera="still" type="button">Stand still</button>
          <button class="fl-button" aria-pressed="false" data-camera="ride" type="button">Ride along</button>
        </div>
      </div>
      <p class="fl-readouts">
        <span><span class="fl-swatch fl-swatch-density"></span>Density $\rho$</span>
        <span><span class="fl-swatch fl-swatch-ink"></span>Copies of the system</span>
      </p>
    </div>
  </div>
  <div class="fl-explanation" aria-live="polite">
    <div data-explains="blob">
      <p><strong>Blob: $\mathrm{d}\rho / \mathrm{d}t = 0$, but $\partial \rho / \partial t \neq 0$.</strong> For the harmonic oscillator $\Ham = (q^2 + p^2)/2$, Hamilton's equations give $\bm v = (p, -q)$: phase space turns clockwise like a rigid body, and the blob is carried around without changing its shape. The rider always sees the same density. The observer standing still sees nothing at first, then the blob sweeps past once per period. Here, $\partial \rho / \partial t = -\bm v \cdot \nabla \rho \neq 0$ since the contours of the blob are not circles around the origin, so the flow carries density across them.</p>
    </div>
    <div data-explains="ring" hidden>
      <p><strong>Ring: $\mathrm{d}\rho / \mathrm{d}t = 0$ and $\partial \rho / \partial t = 0$.</strong> Same oscillator, but now the density only depends on the energy, $\rho = \Phi(\Ham)$, here a Gaussian ring around $\Ham = 1.8$. Then $\bm v \cdot \nabla \rho = \Phi'(\Ham) \, \bm v \cdot \nabla \Ham = 0$ since the velocity runs along the energy contours, so $\partial \rho / \partial t = 0$, too. The copies are colored in alternating sectors of their initial angle: they clearly still move, but every copy leaving the fixed point is replaced by one with the same energy, and the density does not change at all. This is the equilibrium from @eq:stationary. That it works for any $\Phi(\Ham)$ is the content of Jeans' theorem, but that's a story for another time.</p>
    </div>
    <div data-explains="damped" hidden>
      <p><strong>Damped oscillator: $\mathrm{d}\rho / \mathrm{d}t \neq 0$ and $\partial \rho / \partial t \neq 0$.</strong> With friction, $\dot q = p$ and $\dot p = -q - \gamma p$ (here $\gamma = 0.3$). This flow is not Hamiltonian: $\nabla \cdot \bm v = -\gamma$, so $\mathrm{d}\rho / \mathrm{d}t = \gamma \rho$. Every patch of copies shrinks in area like $e^{-\gamma t}$ while keeping its probability, so the density around the rider grows exponentially. The observer standing still sees the blob pass by once, and then nothing, since all copies spiral into the origin.</p>
    </div>
    <div data-explains="traffic" hidden>
      <p><strong>Traffic jam: $\mathrm{d}\rho / \mathrm{d}t \neq 0$, but $\partial \rho / \partial t = 0$.</strong> A made-up, non-Hamiltonian flow on a ring $q \in [-\pi, \pi)$: $\dot q = 1 + a \sin q$ and $\dot p = 0$ (here $a = 0.7$), so $p$ is just a label. Copies are slowest at $q = -\pi/2$ and spend more time there. The density $\rho = g(p) / \bigl(Z \, (1 + a \sin q)\bigr)$, for any profile $g(p)$ and normalization $Z$, is stationary: $\partial \rho / \partial t = -\partial_q (\rho \, \dot q) = -\partial_q \bigl(g(p)/Z\bigr) = 0$. But the flow is compressible, $\nabla \cdot \bm v = a \cos q$, so $\mathrm{d}\rho / \mathrm{d}t = -a \cos q \, \rho \neq 0$. The rider gets squeezed together with its neighbors when entering the slow zone and spread apart again when leaving it. Just like cars at a construction site: the traffic jam stays where it is, but every car passes through it. For a Hamiltonian system, this combination is impossible.</p>
    </div>
  </div>
</div>


## Why bother?

Liouville's equation is the starting point for describing equilibrium in statistical physics: an ensemble in equilibrium is stationary, so by @eq:stationary, its density has to satisfy $\{\Ham, \rho\} = 0$. As the ring example suggests, any density that only depends on the energy does the job, and the microcanonical and canonical ensembles are exactly of this form. Making this precise leads to Jeans' theorem, which I'll leave for another time.

The conservation of phase space volume also has a striking consequence for the long-term behavior: a Hamiltonian system can never settle down. The damped oscillator squeezes all of its copies into a single point, the origin. For a Hamiltonian system, this is impossible, since a region of phase space can never shrink. Taken further, this leads to Poincaré's recurrence theorem: a Hamiltonian system that is confined to a region of phase space with finite volume returns arbitrarily close to almost any initial state, again and again (though you may have to wait for longer than the age of the universe).

It also matters for numerics: integrators that respect the structure of Hamilton's equations, the so-called symplectic integrators like the leapfrog method, preserve phase space volume exactly. They are the standard choice for long simulations of planetary orbits or molecules, since their energy error stays bounded instead of slowly drifting away. The pendulum animation above uses the leapfrog method, so the area of the region is conserved by construction, not just approximately, and with friction it shrinks exactly like $e^{-\gamma t}$.

As for the fun part: I just love it when two lectures suddenly turn out to talk about the same thing. The continuity equation, the Reynolds transport theorem and the material derivative are the bread and butter of fluid dynamics, and they directly carry over to a probability fluid in phase space. Thinking of Liouville's theorem as "the phase space fluid is incompressible", and of $\partial \rho / \partial t$ and $\mathrm{d}\rho / \mathrm{d}t$ as standing still and riding along, gives me pictures I can actually reason with, instead of just another formula to remember.

[^phi]: Note that we have certain assumptions on this map $\phi$. First, for each $t$, $\phi(\cdot, t)$ is a $C^1$-diffeomorphism (bijective, $C^1$ and with $C^1$ inverse $\phi^{-1}(\cdot, t)$). Second, $\phi(\bm X, \cdot)\in C^1$ for each $\bm X$. And last but not least, $\phi(\cdot, 0) = \mathrm{id}$.

[^sign]: Many textbooks use the opposite sign for the Poisson bracket, so there Liouville's equation reads $\partial \rho / \partial t = \{\Ham, \rho\}$ (without the minus).
