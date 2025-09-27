---
layout: page
title: "Jacobi and the total time derivative"
draft: true
permalink: /blog/drafts/1b3665151907
katex:
  enabled: true
  macros:
    \dv: \frac{\text{d}}{\text{d}#1}
    \dvv: \frac{\text{d}#1}{\text{d}#2}
    \pdv: \frac{\partial}{\partial#1}
    \pdvv: \frac{\partial#1}{\partial#2}
    \Matrix: \operatorname{M}
    \subopenin: \underset{\text{open}}{\subseteq}
    \solution: \underline{\underline{#1}}
excerpt: >
  The total derivative with respect to time t is fundamental to physics, yet still, its multivariable form might come out of nowhere when first introduced. In this article, we will revisit the Jacobian matrix and multivariable chain rule in order to highlight their relationship to the total time derivative. Many examples are provided along the way.
---

## Motivation

A fairly common task, that quickly becomes second nature to physics students, is to compute the total derivative of a multi-dimensional time-dependent function. Here, we will only deal with "innocent" functions, that is, continuous functions that are totally differentiable everywhere in their domain.

Suppose we have the function $f: \R^4 \rightarrow \R$ given by

$$
\begin{align*}
  f(\bm{x}(t), t) &= 2 \bigl(x_1(t)\bigr)^2 + \bigl(\ln(x_2(t))\bigr)^3 + 4 x_3(t) + \pi t,\\
  &\quad x_1(t) = \sin(t), \quad x_2(t) = \cos(2t),
  \quad x_3(t) = \frac{1}{t},
\end{align*}
$$

which indirectly depends on $t$ via $x_1(t)$, $x_2(t)$ and $x_3(t)$, but also has a direct dependency on $t$ via the term $\pi t$. The total derivative is calculated by

$$
\begin{align*}
  \dv{t} f\bigl(\bm{x}(t), t\bigr)
  &= \pdv{\bm{x}} f\bigl(\bm{x}(t), t\bigr) \cdot \dv{t} \bm{x}(t) + \pdv{t} f\bigl(\bm{x}(t), t\bigr)\\
  &= \underbrace{\pdv{x_1} f\bigl(\bm{x}(t), t\bigr) \cdot \dv{t} x_1(t)}_{4 x_1(t) \cdot \dot{x}_1(t)} + \underbrace{\pdv{x_2} f\bigl(\bm{x}(t), t\bigr) \cdot \dv{t} x_2(t)}_{3 \bigl(\ln(x_2(t))\bigr)^2 \frac{1}{x_2(t)} \cdot \dot{x}_2(t)}\\
  &\quad + \underbrace{\pdv{x_3} f\bigl(\bm{x}(t), t\bigr) \cdot \dv{t} x_3(t)}_{4 \dot{x}_3(t)} + \underbrace{\pdv{t} f\bigl(\bm{x}(t), t\bigr)}_{\pi}\\
  &= 4 \sin(t) \cos(t) - 6\bigl(\ln(\cos(2t))\bigr)^2 \tan(2t) - \frac{4}{t^2} + \pi
\end{align*}
$$

One way to remember the formula is to form the total derivative with respect to all variables $x_1(t), x_2(t), x_3(t)$ and with respect to the independent variable $t$ itself. With $\dvv{f}{x_1} = \pdvv{f}{x_1} \cdot \dvv{x_1}{t}$ and likewise for $x_2$ and $x_3$, we then obtain the above formula.

However, where does this equation really come from? In Calculus II, the multivariable chain rule

$$
\begin{align*}
 \boxed{J_{g\circ f}(\bm{x}) = J_g(f(\bm{x})) \cdot J_f(\bm{x})}
\end{align*}
$$

is introduced, with $J_f$ being the Jacobian matrix of function $f$. We will give a recap on this matrix and the chain rule to then examine the relationship between the multivariable chain rule and the total time derivative of a function $f$.


## Jacobian matrix

### Definition

Recall that for a function $f: U \subopenin \R^n \rightarrow \R^m$ with $f$ being totally differentiable, we define the **Jacobian matrix** of $f$ at point $\bm{x}\in U$ as

$$
\begin{align*}
 J_f(\bm{x})
 &\coloneqq \Bigl((\partial_j f_i)(\bm{x})\Bigr)
 _{\substack{i=1,\dots, m\\j=1, \dots, n}}\\
 &= \begin{pmatrix}
  (\partial_1 f_1)(\bm{x}) & (\partial_2 f_1)(\bm{x}) & \dots & (\partial_n f_1)(\bm{x})\\
  \vdots & \vdots & \ddots & \vdots\\
  (\partial_1 f_m)(\bm{x}) & (\partial_2 f_m)(\bm{x}) & \dots & (\partial_n f_m)(\bm{x})
 \end{pmatrix}
 \in \Matrix_{m\times n}(\R),
\end{align*}
$$

where $\partial_j f_i$ is a shorthand for $\pdvv{f_i}{x_j}$. Common notations for the Jacobian matrix include [^1]

$$
\begin{align*}
 J_f(\bm{x}) = (Df)(\bm{x}) = \pdvv{(f_1, \dots, f_m)}{(x_1, \dots, x_n)}\,(\bm{x}).
\end{align*}
$$

[^1]: Note however that $(Df)(\bm{x})$ is actually the differential of $f$ at $\bm{x}$, \ie the linear map $(Df)(\bm{x}): \R^n \rightarrow \R^m$, $\bm{y} \mapsto J_f(\bm{x}) \cdot \bm{y}$, where $\bm{y}\in \R^n$ is a column vector. Hence, the equality $J_f(\bm{x}) = (Df)(\bm{x})$ should be understood in the sense that the Jacobian matrix at $\bm{x}$ is the transformation matrix of the linear map $(Df)(\bm{x})$.

### Example

As an example, take the function $f: \R^3 \rightarrow \R^2$ given by
$$
\begin{align*}
 f(x_1, x_2, x_3) \coloneqq \bigl(x_1 + 42 x_2,\quad (x_1 + e^{x_3})^2 \bigr).
\end{align*}
$$

Its Jacobian matrix at $\bm{x} = (x_1, x_2, x_3)\in \R^3$ is

$$
\begin{align*}
 J_f(\bm{x}) &= \begin{pmatrix}
  (\partial_1 f_1)(\bm{x}) & (\partial_2 f_1)(\bm{x}) & (\partial_3 f_1)(\bm{x})\\
  (\partial_1 f_2)(\bm{x}) & (\partial_2 f_2)(\bm{x}) & (\partial_3 f_2)(\bm{x})
 \end{pmatrix}\\
 &= \begin{pmatrix}
  1 & 42 & 0\\
  2 (x_1 + e^{x_3}) & 0 & 2 e^{x_3} (x_1 + e^{x_3})
 \end{pmatrix}
 \in \Matrix_{2\times 3}(\R).
\end{align*}
$$


## Multivariable chain rule

### One variable

The well-known chain rule derived in Calculus I reads:

For functions $f: U\rightarrow V$ and $g: V \rightarrow W$, where $U,V,W\subseteq \R$, with $f$ being differentiable in $x\in U$ and $g$ being differentiable in $f(x)\in V$, the composite function $g(f(x))$ is differentiable and $\dv{x} \Bigl(g(f(x))\Bigr)$ is given by

$$
\begin{align*}
 \dv{x} \Bigl(g(f(x))\Bigr) = g'(f(x)) \cdot f'(x).
\end{align*}
$$

### Multiple variables

In multivariable calculus, the chain rule for one variable can be generalized to the following theorem (which we won't prove here).

For $U\subopenin \R^n, V\subopenin \R^m$, let $f:U\rightarrow V$ be differentiable at point $\bm{x} \in U$. Let $g: V\rightarrow \R^k$ be differentiable at point $\bm{y} \coloneqq f(\bm{x}) \in V$. Visually, we are in the following situation:

<figure class="image">
  <img src="{{ '/assets/blog/2025-jacobi-total-time-derivative/chain-rule-commutative-diagram.svg' | relative_url }}"
       alt="Chain rule diagram (since they are really hard to explain without seeing them, we will omit the alt attribute for the following images)"
       style="max-width: 140px; padding: 1.5em;">
</figure>

The chain rule now states: $g\circ f: U\rightarrow \R^k$ is differentiable at $\bm{x}$ and

$$
\boxed{J_{g\circ f}(\bm{x}) = J_g(f(\bm{x})) \cdot J_f(\bm{x})
 \quad \in \Matrix_{k\times n}(\R).}
$$

This is very similar to the case with one variable $x\in U\subseteq \R$ above, except now ($\bm{x}\in U\subseteq \R^n$) we make use of the Jacobian matrix and multiply matrices to account for the many variables $x_1, \dots, x_n$ that $\bm{x}$ consists of (thus _multivariable_ chain rule).

### Example

As an example, take the function $f: \R^3 \to \R^2$ from above:
$$
\begin{align*}
 f(x_1, x_2, x_3) \coloneqq \bigl(x_1 + 42 x_2,\quad (x_1 + e^{x_3})^2 \bigr).
\end{align*}
$$
and define $g: \R^2 \rightarrow \R,\, g(\bm{y}) \coloneqq y_1 \cdot y_2$, which puts us in this situation:

<figure class="image">
  <img src="{{ '/assets/blog/2025-jacobi-total-time-derivative/chain-rule-example-commutative-diagram.svg' | relative_url }}"
       style="max-width: 620px; padding: 1.5em;">
</figure>

The Jacobian matrix for $g$ at $\bm{y} = (y_1, y_2) \in \R^2$ is:
$$
\begin{align*}
 J_g(\bm{y}) &= \begin{pmatrix}
  (\partial_1 g_1)(\bm{y}) & (\partial_2 g_1)(\bm{y})
 \end{pmatrix}
 = \begin{pmatrix}
  y_2 & y_1
 \end{pmatrix}
 \in \Matrix_{1\times 2}(\R)
\end{align*}
$$

and thus: $J_g(f(\bm{x})) = \begin{pmatrix}
 (x_1 + e^{x_3})^2 & x_1 + 42 x_2
\end{pmatrix}$.

With the chain rule, we obtain:

$$
\begin{align*}
 &\underbrace{J_{g\circ f}(\bm{x})}_{\in \Matrix_{1\times 3}(\R)}
 = \underbrace{J_g(f(\bm{x}))}_{\in \Matrix_{1\times 2}(\R)}
 \cdot \underbrace{J_f(\bm{x})}_{\in \Matrix_{2\times 3}(\R)}\\
 &= \begin{pmatrix}
  (x_1 + e^{x_3})^2 & x_1 + 42 x_2
 \end{pmatrix}
 \cdot \begin{pmatrix}
  1 & 42 & 0 \quad\\
  2 (x_1 + e^{x_3}) & 0 & 2 e^{x_3} (x_1 + e^{x_3})
 \end{pmatrix}\\
 &= \begin{pmatrix}
  (x_1 + e^{x_3})^2 + (x_1 + 42 x_2) \cdot 2(x_1 + e^{x_3})\phantom{-.}\\
  42 (x_1 + e^{x_3})^2\\
  (x_1 + 42 x_2) \cdot 2 e^{x_3} (x_1 + e^{x_3})\\
 \end{pmatrix}^T
\end{align*}
$$


## Total derivative in physics

### Putting everything together

Having recalled the Jacobian matrix as well as the multivariable chain rule, we can finally go back to our original function $f: \R^4 \rightarrow \R$ given by
$$
\begin{align*}
  f(\bm{x}(t), t) &= 2 \bigl(x_1(t)\bigr)^2 + \bigl(\ln(x_2(t))\bigr)^3 + 4 x_3(t) + \pi t,\\
  &\quad x_1(t) = \sin(t), \quad x_2(t) = \cos(2t),
  \quad x_3(t) = \frac{1}{t},
\end{align*}
$$
**The tricky part is to realize we can prefix $f$ by another function $\gamma$ which translates from the independent time variable $t$ to the $(n+1)$-dimensional input vector $\bigl(x_1(t), \dots, x_n(t), t\bigr)$** passed into $f$. Note that for $f$ in the introduction, we have $n=3$, yet we will leave $n$ generic here. The situation presents itself as follows in terms of a commutative diagram:

<figure class="image">
  <img src="{{ '/assets/blog/2025-jacobi-total-time-derivative/intro-example-commutative-diagram.svg' | relative_url }}"
       style="max-width: 140px; padding: 1.5em;">
</figure>

We define the function
$$
\begin{align*}
\gamma:\, &I\rightarrow \R^{n+1},\\
&t\mapsto \gamma(t) \coloneqq
  \begin{pmatrix}
    x_1(t) & \cdots & x_n(t) & t
  \end{pmatrix}
\end{align*}
$$,
where $I\subseteq \R$ is the interval of permitted time values. We often set $t \coloneqq 0$ for the start of a real measurement or thought experiment in physics and could therefore arbitrarily set $I \coloneqq [0, \infty)$. Furthermore, we demand every component of $\gamma$ to be continuous, i.e. $\gamma_i: I \xrightarrow{\text{continuous}} \R \quad \forall i=1,\dots, n+1$. With these properties, $\gamma$ is a **curve** and describes a trajectory. It just happens that as the last component of our $(n+1)$-dimensional space, $\gamma$ carries the time component itself, as we need to pass it into $f$ as well (as seen before, $f$ can directly depend on $t$, not just indirectly via $x_1(t)$ etc.).

After all, the multivariable chain rule is now applicable to the composite function $f\circ \gamma$ (assuming differentiability of $f$ at the given point $\bm{x}(t)$ and differentiability of $\gamma$ at $t$). We obtain:
$$
\begin{align*}
 &\underbrace{J_{f\circ \gamma}(t)}_{\Matrix_{1\times 1}(\R) \cong \R} = \underbrace{J_f(\gamma(t))}_{\Matrix_{1\times (n+1)}(\R)} \cdot \underbrace{J_\gamma(t)}_{\Matrix_{(n+1) \times 1}(\R)}\\
 &= \begin{pmatrix}
  \pdv{x_1} f(\gamma(t)) & \dots & \pdv{x_n} f(\gamma(t)) & \pdv{t} f (\gamma(t))
 \end{pmatrix} \cdot \begin{pmatrix}
  \dv{t} x_1(t)\\
  \vdots\\
  \dv{t} x_n(t)\\
  1
 \end{pmatrix}\\
 &= \pdv{x_1} f(\gamma(t)) \cdot \dv{t} x_1(t) + \dots +  \pdv{x_n} f(\gamma(t)) \cdot \dv{t} x_n(t) + \pdv{t} f(\gamma(t)) \cdot 1\\
 &= \pdv{x_1} f(\underbrace{x_1(t), \dots, x_n(t)}_{\bm{x}(t)}, t) \cdot \dv{t} x_1(t) + \dots +  \pdv{x_n} f(\bm{x}(t), t) \cdot \dv{t} x_n(t)\\
 &\quad + \pdv{t} f(\bm{x}(t), t) \cdot 1\\
 &= \pdv{\bm{x}} f(\bm{x}, t) \cdot \dv{t} \bm{x}(t) \:+\: \pdv{t} f(\bm{x}(t), t) \cdot 1\\
 &\eqqcolon \dv{t} f(\bm{x}, t)
\end{align*}
$$

This shows how the Jacobian matrix, multivariable chain rule and the total derivative are connected. We started with a function $f$ that had an _explicit_ time dependency (in our case the term $\pi t$) and _implicit_ time dependencies (since $x_1(t), \dots, x_n(t)$ are time-dependent). **We then wanted to compute the total derivative of $f$ with respect to $t$, which is just asking for the time derivative of the composite function $f\circ \gamma$, where $\gamma$ is a curve passing in all the parameters to $f$, including time $t$ itself**. This is in fact the definition of the total derivative of $f$ with respect to time $t$.

Note how the same formalism is applicable even when $f$ is not directly dependent on $t$. In this case, we still pass in $t$ as parameter to our function $f$, which is simply not using the variable at all. The term $\pdv{t} f(\bm{x}, t)$ will then evaluate to $0$ and we would get the same result as if we had just left out $t$ as last entry of $\gamma$ altogether. Therefore, our definition of $\gamma$ stays consistent.

### More examples

Let's take a look at some more examples. As is common in physics, we omit the parentheses when a function is only dependent on $t$, e.g. $x_1 = x_1(t)$ to not clutter the visual appearance. In addition, we also set $I \coloneqq \R$.

#### Example 1
One task might be to calculate the total time derivative of
$$
\begin{align*}
 &f\bigl(x_1, x_2, x_3, t\bigr)
 = 4 x_1^2 + 3 x_2^2 + \pi x_3 + 2t,\\
 &x_1 = x_1(t) = \sin(t),
 \; x_2 = x_2(t) = \cos(t),
 \; x_3 = x_3(t) = \cosh(t)
\end{align*}
$$

<figure class="image">
  <img src="{{ '/assets/blog/2025-jacobi-total-time-derivative/final-examples-x1-x2-x3-commutative-diagram.svg' | relative_url }}"
       style="max-width: 520px; padding: 1.5em;">
</figure>

With the chain rule and the common notation $\dv{t} x_1(t) = \dot{x}_1(t)$, we get:
$$
\begin{align*}
 &\dv{t} f\bigl(x_1, x_2, x_3, t\bigr)\\
 &= \begin{pmatrix}
  \pdv{x_1} f(\gamma(t))
  & \pdv{x_2} f(\gamma(t))
  & \pdv{x_3} f(\gamma(t))
  & \pdv{t} f(\gamma(t))
 \end{pmatrix} \cdot \begin{pmatrix}
  \dot{x}_1\\
  \dot{x}_2\\
  \dot{x}_3\\
  1
 \end{pmatrix}\\
 &= \pdv{x_1} f(\gamma(t)) \cdot \dot{x}_1 + \pdv{x_2} f(\gamma(t)) \cdot \dot{x}_2 + \pdv{x_3} f(\gamma(t)) \cdot \dot{x}_3\\
 &\quad + \pdv{t} f(\gamma(t)) \cdot 1\\
 &= 8 x_1 \dot{x}_1 + 6x_2 \dot{x}_2 + \pi \dot{x}_3 + 2\\
 &= 8 \sin(t) \cos(t) - 6 \cos(t) \sin(t) + \pi \sinh(t) + 2\\
 &= \solution{2 \sin(t) \cos(t) + \pi \sinh(t) + 2}.
\end{align*}
$$

#### Example 2

For another physics problem, we might encounter the following function we want to calculate the total time derivative for:
$$
\begin{align*}
 f\bigl(x_1, \dot{x}_1, t\bigr)
 &= a \dot{x}_1^2 - b x_1 \dot{x}_1,
 \quad a,b\in \R,
 \, x_1=x_1(t), \, \dot{x}_1 = \dot{x}_1(t)
\end{align*}
$$

<figure class="image">
  <img src="{{ '/assets/blog/2025-jacobi-total-time-derivative/final-examples-with-dot-commutative-diagram.svg' | relative_url }}"
       style="max-width: 520px; padding: 1.5em;">
</figure>

Again, employing the chain rule we obtain:
$$
\begin{align*}
 &\dv{t} f\bigl(x_1, \dot{x}_1, t\bigr)
 = \begin{pmatrix}
  \pdv{x_1} f(\gamma(t)) & \pdv{\dot{x}_1} f(\gamma(t))
  & \pdv{t} f(\gamma(t))
 \end{pmatrix} \cdot \begin{pmatrix}
  \dot{x}_1\\
  \ddot{x}_1\\
  1
 \end{pmatrix}\\
 &= \pdv{x_1} f\bigl(x_1, \dot{x}_1, t\bigr) \cdot \dot{x}_1 + \pdv{\dot{x}_1} f\bigl(x_1, \dot{x}_1, t\bigr) \cdot \ddot{x}_1 + \pdv{t} f\bigl(x_1, \dot{x}_1, t\bigr) \cdot 1\\
 &= -b \dot{x}_1 \dot{x}_1 + \bigl(2a\dot{x}_1 - b x_1\bigr) \ddot{x}_1 + 0\\
 &= \solution{-b \dot{x}_1^2 + \bigl(2a\dot{x}_1 - b x_1\bigr) \ddot{x}_1}.
\end{align*}
$$

#### Example 3

In another task, students were presented this function
$$
\begin{align*}
 f\bigl(x_1, \dot{x}_1, t\bigr)
 &= -a \cdot u(x_1) \cdot e^{-kt},
 \quad a,k \in \R,
 \, x_1 = x_1(t),\, \dot{x}_1 = \dot{x}_1(t)
\end{align*}
$$

<figure class="image">
  <img src="{{ '/assets/blog/2025-jacobi-total-time-derivative/final-examples-unknown-u-commutative-diagram.svg' | relative_url }}"
       style="max-width: 520px; padding: 1.5em;">
</figure>

and were asked to calculate the total time derivative. However, $u(x_1(t))$ was never defined. As $f$ was not dependent on $u$ at all (see argument list of $f$), one had to assume $u$ would be replaced by some term containing $x_1$, e.g. $3 x_1 + 5$. Then, we can proceed as usual:
$$
\begin{align*}
 &\dv{t} f\bigl(x_1, \dot{x}_1, t\bigr)\\
 &= \pdv{x_1} f\bigl(x_1, \dot{x}_1, t\bigr) \cdot \dot{x}_1 + \pdv{\dot{x}_1} f\bigl(x_1, \dot{x}_1, t\bigr) \cdot \ddot{x}_1 + \pdv{t} f\bigl(x_1, \dot{x}_1, t\bigr) \cdot 1\\
 &= \solution{-a \cdot \dv{x}\Bigr\rvert_{x=x_1} u(x) \cdot e^{-kt} \cdot \dot{x}_1 + 0 + a k u(x_1) e^{-kt} \cdot 1},
\end{align*}
$$
where $\dv{x}\bigr\rvert_{x=x_1} u(x) = 3$ if $u(x) \coloneqq 3x + 5$ (as an example).

<small>_Thanks to Paul Obernolte for having reviewed this post._</small>
