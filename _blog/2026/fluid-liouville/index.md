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
    \RR: '\mathbb{R}'
custom_css: /blog/2026/fluid-liouville/fluid-liouville.css
vite_entrypoint: main.ts
excerpt: >
  TODO
---

Lately in my statistical physics course at university, I was quite surprised to run across many ideas and formulas I have already encountered in fluid dynamics. It's beautiful to see two fields that at first sight have nothing to do with each other come together. In this post, I want to share this beauty with you. We will derive Liouville's Theorem and start with mass conservation, then use Reynold's Transport Theorem and finally Hamilton's equations.

<small>
_Tip: Hover over footnote and equation references to get a preview without scrolling._
</small>

## Lagrangian & Eulerian

There are two different views to describe the motion of a fluid:

In the **Lagrangian** (material) description, we follow each fluid particle individually. A particle is labeled by its position $\bm X$ at the initial time $t = 0$. Its motion is described by a map[^phi] $\phi$that tells us where this particle is at time $t$:

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

In this material view, quantities like the temperature are attached to a particle $\bm X$ and we denote it with a hat: $\hat T(\bm X, t)$. But this can quickly become impractical if you think of just how many particles swirl around to make up a fluid. We don't want to track each of those individually. Instead, in the **Eulerian** (spatial) view, we stand still as observer: a position $\bm x$ in space is fixed. Now we watch what particles happen to pass by and measure the change of temperature at that fixed point: $T(\bm x, t)$.

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

Next, let's attach this thermometer to a fluid particle $\bm X$ and let it move with it through the fluid (Lagrangian view). The particle is at position $\bm x = \phi(\bm X, t)$ at time $t$, and its velocity is $\bm v(\bm x, t) = \partial \phi / \partial t$. The temperature the thermometer measures is then called the _material time derivative_:

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

Next, we use Reynolds transport theorem (without proof):

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

One can also turn this into a balance equation for a _fixed_ region $V$ in space. Simply apply Gauß' theorem to the second term of @eq:reynolds with $f = \rho$. The divergence term turns into a surface integral:

$$
0 \overset{@eq:mass-conservation}{=} \dv{}{t} \int_{V(t)} \rho \,\mathrm{d}\bm x
\overset{\text{Gauß on } @eq:reynolds}{=}
\int_{V(t)} \pdv{\rho}{t} \,\mathrm{d}\bm x + \int_{\partial V(t)} \mathrm{d}\bm A \cdot \rho \bm v
$$

Now let's define the current $\bm j := \rho \bm v$ and freeze time at some instant $t$ such that $V(t)$ is a _fixed_ region $V$. This allows us to pull the partial time derivative out of the integral, and we get the balance equation:

$$
-\int_{\partial V} \mathrm{d}\bm A \cdot \bm j
= \pdv{}{t} \int_V \rho \,\mathrm{d}\bm x
= \pdv{m}{t}
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

In phase space, each point represents a possible state of our system. The axes of this multidimensional space are the degrees of freedom of the system. For our purposes, we consider $N$ particles in three dimensions, so we have $3N$ position coordinates $\bm q = (\bm q_1, \dots, \bm q_N)$ and $3N$ momentum coordinates $\bm p = (\bm p_1, \dots, \bm p_N)$. The phase space is then $6N$-dimensional and we denote a point in it by $(\bm q, \bm p)$.

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

Let's recap our setting in statistical physics: we consider a real system of $N$ particles. We represent the state of this system by a single point in $6N$-dimensional phase space. With the system evolving in time, this point will move around in phase space. We then take many copies of this system, each with different initial conditions, i.e. many points in phase space. We let the systems evolve in time, so now many points move around in phase space. And this movement is like a flow of a fluid, just very abstract. The points in phase space are the "fluid particles", and the Hamiltonian gives us a velocity field. This is so powerful because we can now use tools from fluid dynamics to study problems in statistical physics.


## Liouville's theorem

So let's do this! Note that instead of the mass density $\rho$ of fluids, we call it the probability density $\rho$ in phase space. Mass conservation becomes the conservation of probability. The continuity equation is then exactly the same as in fluid dynamics, namely @eq:continuity. Let's expand its divergence term:

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

As we've seen $\mathrm{d} \rho / \mathrm{d} t$ is the perspective of riding along with a copy of the system, i.e. considering a trajectory in phase space. Putting everything together, we finally arrive at Liouville's theorem:

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


## Back to Lagrangian and Eulerian perspectives

We have seen two time derivatives of the density $\rho(\bm q, \bm p, t)$ in phase space. Let's discuss their difference again and see some examples.

The partial time derivative $\partial \rho / \partial t$ is the change at a _fixed_ point in phase space, i.e. the Eulerian perspective in fluid dynamics, where you stand still and watch the fluid flow past you. In contrast, $\mathrm{d}\rho / \mathrm{d}t$ is the change seen by a copy _moving_ along its trajectory, i.e. the Lagrangian perspective in fluid dynamics, where you ride along with a single fluid particle.

Before we used Hamilton's equations, we arrived at the expanded continuity equation @eq:continuity-expanded:

$$
\dv{\rho}{t} = \pdv{\rho}{t} + \bm v \cdot \nabla \rho = -\rho \, (\nabla \cdot \bm v)
$$

This shows that Liouville's theorem $\mathrm{d}\rho / \mathrm{d}t = 0$ is fulfilled when the flow in phase space is incompressible, $\nabla \cdot \bm v = 0$, (or also in the uninteresting case $\rho = 0$). $\nabla \cdot \bm v = 0$ is true for Hamiltonian flows, but not for general flows that may involve friction. So the density along a trajectory can change in general, but it stays constant for Hamiltonian flows.

The observer standing still measures $\partial \rho / \partial t$. By the continuity equation @eq:continuity, this is $\partial \rho / \partial t = -\nabla \cdot (\rho \bm v)$, i.e. the current $\bm j = \rho \bm v$ is divergence-free. Or in other words with the balance equation @eq:balance: the partial derivative vanishes exactly when as much probability flows into a fixed region as flows out of it. Probability can still move around though. It only means that every copy that leaves is replaced by one that arrives with the same density.

Whether that happens depends on how $\rho$ is arranged with respect to the flow, not on the flow alone. For a Hamiltonian flow, $\nabla \cdot \bm v = 0$ leaves us with $\partial \rho / \partial t = -\bm v \cdot \nabla \rho$, which vanishes when the copies move along the contour lines of $\rho$, i.e. $\bm v \perp \nabla \rho$.

To better see all four combinations of the two derivatives being zero or not, we can look at the following matrix. Pick the examples to see how the density $\rho$ behaves in phase space and what the two observers measure.

<div class="fl-figure fl-wide" data-scene="derivatives">
  <div class="fl-matrix" aria-label="Examples" role="group">
    <span></span>
    <span class="fl-matrix-head">$\partial \rho / \partial t = 0$</span>
    <span class="fl-matrix-head">$\partial \rho / \partial t \neq 0$</span>
    <span class="fl-matrix-head fl-matrix-row">$\mathrm{d}\rho / \mathrm{d}t = 0$<small>e.g. Hamiltonian</small></span>
    <button class="fl-cell" aria-label="Ring: total and partial derivative are both zero" aria-pressed="false" data-example="ring" type="button"><strong>Harmonic Oscillator: Ring</strong><small>Density that only depends on the energy</small></button>
    <button class="fl-cell" aria-label="Blob: total derivative zero, partial derivative not zero" aria-pressed="true" data-example="blob" type="button"><strong>Harmonic Oscillator: Blob</strong><small>Non-zero density only in some region of phase space.</small></button>
    <span class="fl-matrix-head fl-matrix-row">$\mathrm{d}\rho / \mathrm{d}t \neq 0$<small>not Hamiltonian</small></span>
    <button class="fl-cell" aria-label="Traffic jam: total derivative not zero, partial derivative zero" aria-pressed="false" data-example="traffic" type="button"><strong>Traffic jam</strong><small>Speed depends on the position</small></button>
    <button class="fl-cell" aria-label="Damped oscillator: total and partial derivative are both not zero" aria-pressed="false" data-example="damped" type="button"><strong>Damped oscillator</strong><small>Friction squeezes the ensemble</small></button>
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
  <div class="fl-explanation" aria-live="polite">
    <div data-explains="blob">
      <p><strong>Blob: $\mathrm{d}\rho / \mathrm{d}t = 0$, but $\partial \rho / \partial t \neq 0$.</strong> The harmonic oscillator turns phase space clockwise like a rigid body (the blog doesn't change its shape). The rider always sees the same density. The observer standing still sees nothing at first, then the blob sweeps past once per period.</p>
    </div>
    <div data-explains="ring" hidden>
      <p><strong>Ring: $\mathrm{d}\rho / \mathrm{d}t = 0$ and $\partial \rho / \partial t = 0$.</strong> Harmonic oscillator, but now the density only depends on the energy, $\rho = \Phi(\Ham)$, here a Gaussian ring around some fixed $\Ham$. Then $\bm v \cdot \nabla \rho = \Phi'(\Ham) \, \bm v \cdot \nabla \Ham = 0$ since the velocity runs along the energy contours, so $\partial \rho / \partial t = 0$. See also Jeans' theorem to learn more about this.</p>
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

[^phi]: Assumptions for $\phi$: First, for each $t$, $\phi(\cdot, t)$ is a $C^1$-diffeomorphism (bijective, $C^1$ and with $C^1$ inverse $\phi^{-1}(\cdot, t)$). Second, $\phi(\bm X, \cdot)\in C^1$ for each $\bm X$. And last but not least, $\phi(\cdot, 0) = \mathrm{id}$.

[^well-behaved]: Here's a proof overview. Particles that started in $\hat V$ are in $V(t)$ by definition, so they don't leave. Could a particle $\bm X$ from outside sneak in? No, since it would have to sit at the same place as some particle $\bm Y \in \hat V$, i.e. $\phi(\bm X, t) = \phi(\bm Y, t)$. But as $\phi(\cdot, t)$ is injective, this means $\bm X = \bm Y$, so $\bm X$ was in $\hat V$ all along. Hence $V(t)$ always contains exactly the particles that started in $\hat V$: nothing ever enters or leaves. Moreover, since $\phi(\cdot, t)$ and its inverse are continuous, $V(t)$ cannot tear apart or get holes in it.

[^sign]: Many textbooks use the opposite sign for the Poisson bracket, so there Liouville's equation reads $\partial \rho / \partial t = \{\Ham, \rho\}$ (without the minus).
