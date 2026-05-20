---
layout: page
title: "Index notation from hell — and how to make it more fun"
katex:
  enabled: true
  macros:
    \squaree: "{\\scriptstyle \\square}"
    \blacksquaree: "{\\scriptstyle \\blacksquare}"
custom_css: /assets/blog/2026-index-notation-from-hell/notation-comparison.css
excerpt: >
  Annoyed by 1000 indices in your calculation? Let's introduce a more playful notation.
---

I'm currently taking a course in General Relativity. One major, quite technical part of it is index notation, which can quickly get out of hand. In this harmless example, let's consider how the connection coefficients $\Gamma^\nu_{\mu\lambda}$ transform under a smooth change of coordinates $x^\mu \rightarrow x'^\mu(x)$:

$$
  \Gamma'^\nu_{\mu\lambda}
  =
  \frac{\partial x^\rho}{\partial x'^\mu}
  \frac{\partial x^\gamma}{\partial x'^\lambda}
  \frac{\partial x'^\nu}{\partial x^\sigma}
  \Gamma^\sigma_{\rho\gamma}
  -
  \frac{\partial x^\rho}{\partial x'^\mu}
  \frac{\partial x^\gamma}{\partial x'^\lambda}
  \frac{\partial^2 x'^\nu}{\partial x^\rho \partial x^\gamma}
$$

We use greek letters to indicate the four dimensions ($0$,$1$,$2$,$3$) we sum over, in contrast to latin symbols, where one would just some over the spatial dimensions ($1$,$2$,$3$). The beauty of *Einstein's summation notation* is that we can leave out the summation symbols $\sum$; whenever we have a repeated index in one summand, we implicitly know that we have to sum over it. In the example above, such summation indices are $\rho$, $\gamma$ and $\sigma$.

## Fresh indices

However, with all these greek letters and their scrollwork, I personally find it hard to keep track of the overall structure of the formula and to identify where exactly one variable occurs again in another part. That's why I propose a new notation. I was motivated by Bret Victor's thought-provoking talk ["The Humane Representation of Thought"](https://dynamicland.org/2014/CDG_research_agendas/) where he states:

> Leibniz was the UI designer of the 17th century. He was obsessed with notation, always trying out different notations, always talking with his friends about notation. Because he realized that a lot of the power in an idea lies in the form in which it's expressed, because that's what allows people to think it. ~ Bret Victor

I propose the following "new" notation. As an example, we will turn the expression for the covariant derivative
$$
  \nabla_\mu V^\nu
  =
  \partial_\mu V^\nu + \Gamma^\nu_{\mu\alpha} V^\alpha
$$
into this notation:
$$
  \nabla_\bullet V^\circ = \partial_\bullet V^\circ + \Gamma^\circ_{\bullet \sim} V^\sim
$$

The *constraints* for the new notation are as follows:

- Should feature spatially easily recognizable shapes.
- Should be quick to write (not take more time to write than greek symbols).
- Should be robust, i.e. symbols should not be easy to confuse with each other.
- Should not clash with existing notation.

To not clash with existing notation, we should avoid using symbols like $\nabla$, $\Delta$, the prime $'$, parentheses of any kind, $*$, $\dag$, $\wedge$, $\otimes$, $\partial$ (and a lot more). We could theoretically use Emojis like 🎈, but these are hard to draw by hand and would probably be too colorful. I want to be able to quickly draw the symbols by hand, so they shouldn't be too detailed. This is a proposal for indices that hopefully satisfy my constraints:

$$
\circ
\:\: \bullet
\:\: \squaree
\:\: \blacksquaree
\:\: \sim
\:\: \alpha
\:\: :
\:\: \llcorner
\:\: \ulcorner
\:\: \urcorner
\:\: \lrcorner
\:\: \cap
\:\: \cup
\:\: \sqcap
\:\: \sqcup
\:\: \vee
\:\: \wedge
$$

The $\alpha$ should be understood as a placeholder for any greek latter. I don't want to ban them, just enrich the palette we can use. In the new notation used above, I find a lot easier to identify where the given indices $\bullet$ and $\circ$ occur on the right side and where we just have a sum with $\sim$. And it's just more fun to draw those basic shapes as indices.

### Example: Covariant Derivative

Let's see both notations in action to derive the expression of the covariant derivative. On wider screens, the usual notation sits on the left and the new symbols on the right:

<div class="notation-comparison" markdown="1">
<div class="notation-comparison__head">Only greek letters</div>
<div class="notation-comparison__head">With new symbols</div>

<div class="notation-comparison__cell" data-label="Only greek letters">
$$
\begin{align*}
\bigl(V = V^\nu \partial_\nu\bigr)
\Rightarrow \nabla_\mu V
&= \nabla_\mu(V^\nu \partial_\nu)\\
&= (\partial_\mu V^\nu) \partial_\nu + V^\nu \partial_\mu \partial_\nu\\
\bigl(\partial_\mu \partial_\nu = \Gamma^\alpha_{\mu \nu} \partial_\alpha\bigr)
\Rightarrow \nabla_\mu V
&= (\partial_\mu V^\nu) \partial_\nu + V^\nu \Gamma^\alpha_{\mu \nu} \partial_\alpha\\
&= (\partial_\mu V^\beta + \Gamma^\beta_{\mu \nu} V^\nu) \partial_\beta
\end{align*}
$$
</div>
<div class="notation-comparison__cell" data-label="With new symbols">
$$
\begin{align*}
\bigl(V = V^\circ \partial_\circ\bigr)
\Rightarrow \nabla_\bullet V
&= \nabla_\bullet(V^\circ \partial_\circ)\\
&= (\partial_\bullet V^\circ) \partial_\circ + V^\circ \partial_\bullet \partial_\circ\\
\bigl(\partial_\bullet \partial_\circ = \Gamma^\sim_{\bullet \circ} \partial_\sim\bigr)
\Rightarrow \nabla_\bullet V
&= (\partial_\bullet V^\circ) \partial_\circ + V^\circ \Gamma^\sim_{\bullet \circ} \partial_\sim\\
&= (\partial_\bullet V^: + \Gamma^:_{\bullet \circ} V^\circ) \partial_:
\end{align*}
$$
</div>

<div class="notation-comparison__bridge">
In component form, we read off the same formula after a dummy index rename.
</div>

<div class="notation-comparison__cell" data-label="Only greek letters">
$$
\begin{align*}
(\nabla_\mu V)^\beta = \nabla_\mu V^\beta
&= \partial_\mu V^\beta + \Gamma^\beta_{\mu \nu} V^\nu\\
\Rightarrow \nabla_\mu V^\nu
&= \partial_\mu V^\nu + \Gamma^\nu_{\mu \alpha} V^\alpha
\end{align*}
$$
</div>

<div class="notation-comparison__cell" data-label="With new symbols">
$$
\begin{align*}
(\nabla_\bullet V)^: = \nabla_\bullet V^:
&= \partial_\bullet V^: + \Gamma^:_{\bullet \circ} V^\circ\\
\Rightarrow \nabla_\bullet V^\circ
&= \partial_\bullet V^\circ + \Gamma^\circ_{\bullet \sim} V^\sim
\end{align*}
$$
</div>
</div>

## Derivatives

Additionally, I wanted to reduce the effort of writing many derivatives with index notation, while also improving readability and clarity. Here is my suggestion:
$$
\frac{\partial x'^\bullet}{\partial x^\circ} =: \frac{\bullet^\prime}{\circ},
\qquad
\frac{\partial^2 x'^\bullet}{\partial x^\circ\partial x^\square} =: \frac{\bullet^\prime}{\circ \square}
$$

In particular,
$$
\frac{\circ^\prime}{\sim :}
=
\frac{\partial^2 x'^\circ}{\partial x^\sim\partial x^:}
$$

Can one confuse this with a regular fraction? I don't think so as we use indices in the nominator and denominator. Out of the context, it is clear what we mean.

Now let's derive the transformation law from the fact that $\nabla_\mu V^\nu$ is a $(1,1)$-tensor.

<div class="notation-comparison" markdown="1">
<div class="notation-comparison__head">Only greek letters</div>
<div class="notation-comparison__head">With new symbols and derivative shorthand</div>

<div class="notation-comparison__cell" data-label="Only greek letters">
$$
\begin{align*}
\nabla'_\mu V'^\nu
&= \partial'_\mu V'^\nu + \Gamma'^\nu_{\mu\lambda}V'^\lambda\\
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \partial_\rho\!\left(\frac{\partial x'^\nu}{\partial x^\alpha}V^\alpha\right)
 + \Gamma'^\nu_{\mu\lambda}\frac{\partial x'^\lambda}{\partial x^\alpha}V^\alpha\\
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial^2 x'^\nu}{\partial x^\rho\partial x^\alpha}V^\alpha + \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x'^\nu}{\partial x^\alpha}\partial_\rho V^\alpha\\
   &\quad + \Gamma'^\nu_{\mu\lambda}\frac{\partial x'^\lambda}{\partial x^\alpha}V^\alpha
\end{align*}
$$
</div>

<div class="notation-comparison__cell" data-label="With new symbols and derivative shorthand">
$$
\begin{align*}
\nabla'_\bullet V'^\circ
&= \partial'_\bullet V'^\circ + \Gamma'^\circ_{\bullet\square}V'^\square\\
&= \frac{\sim}{\bullet^\prime}\partial_\sim\!\left(\frac{\circ^\prime}{:}V^:\right)
 + \Gamma'^\circ_{\bullet\square}\frac{\square^\prime}{:}V^:\\
&= \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{\sim :}V^: + \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{:}\partial_\sim V^:\\
&\quad +\Gamma'^\circ_{\bullet\square}\frac{\square^\prime}{:}V^:
\end{align*}
$$
</div>

<div class="notation-comparison__bridge">
Now enforce the tensor transformation law for $\nabla V$ and expand $\nabla_\sim V^:$ once more.
</div>

<div class="notation-comparison__cell" data-label="Only greek letters">
$$
\begin{align*}
\nabla'_\mu V'^\nu
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x'^\nu}{\partial x^\alpha}\nabla_\rho V^\alpha\\
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x'^\nu}{\partial x^\alpha}
   \left(\partial_\rho V^\alpha + \Gamma^\alpha_{\rho\gamma}V^\gamma\right)\\
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x'^\nu}{\partial x^\alpha}\partial_\rho V^\alpha\\
&\quad + \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x'^\nu}{\partial x^\sigma}\Gamma^\sigma_{\rho\alpha}V^\alpha
\end{align*}
$$
</div>

<div class="notation-comparison__cell" data-label="With new symbols and derivative shorthand">
$$
\begin{align*}
\nabla'_\bullet V'^\circ
&= \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{:}\nabla_\sim V^:\\
&= \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{:}
   \left(\partial_\sim V^: + \Gamma^:_{\sim\alpha}V^\alpha\right)\\
&= \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{:}\partial_\sim V^: + \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{\alpha}\Gamma^\alpha_{\sim:}V^:
\end{align*}
$$
</div>

<div class="notation-comparison__bridge">
The $\partial V$ terms are exactly the same on both sides. Cancel them, use that this holds for arbitrary $V$, then multiply by the inverse Jacobian.
</div>

<div class="notation-comparison__cell" data-label="Only greek letters">
$$
\begin{align*}
\Gamma'^\nu_{\mu\lambda}\frac{\partial x'^\lambda}{\partial x^\alpha}
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x'^\nu}{\partial x^\sigma}\Gamma^\sigma_{\rho\alpha}
 - \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial^2 x'^\nu}{\partial x^\rho\partial x^\alpha}\\
\Rightarrow\qquad
\Gamma'^\nu_{\mu\lambda}
&= \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x^\gamma}{\partial x'^\lambda}
   \frac{\partial x'^\nu}{\partial x^\sigma}\Gamma^\sigma_{\rho\gamma}\\
&\quad - \frac{\partial x^\rho}{\partial x'^\mu}
   \frac{\partial x^\gamma}{\partial x'^\lambda}
   \frac{\partial^2 x'^\nu}{\partial x^\rho\partial x^\gamma}
\end{align*}
$$
</div>

<div class="notation-comparison__cell" data-label="With new symbols and derivative shorthand">
$$
\begin{align*}
\Gamma'^\circ_{\bullet\square}\frac{\square^\prime}{:}
&= \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{\alpha}\Gamma^\alpha_{\sim:} - \frac{\sim}{\bullet^\prime}\frac{\circ^\prime}{\sim:}\\
\end{align*}
$$

$$
\begin{aligned}
\Gamma'^\circ_{\bullet\square}
&= \frac{\sim}{\bullet^\prime}\frac{:}{\square^\prime}\frac{\circ^\prime}{\alpha}\Gamma^\alpha_{\sim:} - \frac{\sim}{\bullet^\prime}\frac{:}{\square^\prime}\frac{\circ^\prime}{\sim:}
\end{aligned}
$$
</div>
</div>
