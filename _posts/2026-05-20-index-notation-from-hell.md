---
layout: page
title: "Index notation from hell — and how to make it more fun"
katex:
  enabled: true
excerpt: >
  TODO Excerpt
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

We use greek letters to indicate the four dimensions ($0$,$1$,$2$,$3$) we sum over, in contrast to latin symbols, where one would just some over the spatial dimensions ($1$,$2$,$3$). The beauty of **Einstein's summation notation** is that we can leave out the summation symbols $\sum$; whenever we have a repeated index in one summand, we implicitly know that we have to sum over it. In the example above, such summation indices are $\rho$, $\gamma$ and $\sigma$.


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
\:\: \square
\:\: \blacksquare
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

Let's see the new notation in action to derive the expression of the covariant derivative. On the left side with only greek letters, on the right side with the new symbols:

The new way:

$$
\begin{align*}
\bigl(V = V^\circ \partial_\circ\bigr)
&\Rightarrow
\nabla_\bullet V
= \nabla_\bullet(V^\circ \partial_\circ)
= (\partial_\bullet V^\circ) \partial_\circ + V^\circ \partial_\bullet \partial_\circ\\
\bigl(\partial_\bullet \partial_\circ = \Gamma^\sim_{\bullet \circ} \partial_\sim\bigr)
&\Rightarrow
\nabla_\bullet V = (\partial_\bullet V^\circ) \partial_\circ + V^\circ \Gamma^\sim_{\bullet \circ} \partial_\sim
= (\partial_\bullet V^: + \Gamma^:_{\bullet \circ} V^\circ) \partial_:
\end{align*}
$$

Therefore, in component form, we find (while renaming the index $:$ to $\circ$ to make this "input"-index more prominent in terms of size):
$$
\begin{align*}
(\nabla_\bullet V)^: = \nabla_\bullet V^:
&= \partial_\bullet V^: + \Gamma^:_{\bullet \circ} V^\circ\\
\Rightarrow \nabla_\bullet V^\circ
&= \partial_\bullet V^\circ + \Gamma^\circ_{\bullet \sim} V^\sim
\end{align*}
$$

The "old" way using only greek letters:

$$
\begin{align*}
\bigl(V = V^\nu \partial_\nu\bigr)
&\Rightarrow
\nabla_\mu V
= \nabla_\mu(V^\nu \partial_\nu)
= (\partial_\mu V^\nu) \partial_\nu + V^\nu \partial_\mu \partial_\nu\\
\bigl(\partial_\mu \partial_\nu = \Gamma^\alpha_{\mu \nu} \partial_\alpha\bigr)
&\Rightarrow
\nabla_\mu V = (\partial_\mu V^\nu) \partial_\nu + V^\nu \Gamma^\alpha_{\mu \nu} \partial_\alpha
= (\partial_\mu V^\beta + \Gamma^\beta_{\mu \nu} V^\nu) \partial_\beta
\end{align*}
$$

Therefore, in component form, we find (while renaming the index $\beta$ to $\nu$):
$$
\begin{align*}
(\nabla_\mu V)^\beta = \nabla_\mu V^\beta
&= \partial_\mu V^\beta + \Gamma^\beta_{\mu \nu} V^\nu\\
\Rightarrow \nabla_\mu V^\nu
&= \partial_\mu V^\nu + \Gamma^\nu_{\mu \alpha} V^\alpha
\end{align*}
$$

