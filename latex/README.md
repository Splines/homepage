## How to create new svg graphics for tikz diagrams

Use a minimal document like this

```latex
% svg.tex
\documentclass{standalone}

\input{preamble}
\input{defs}

\begin{document}
\input{assets/diagram.tex}
\end{document}
```

```latex
% assets/diagram.tex
$$
\begin{tikzcd}
 U \ar[r, "f"] \drar[dashrightarrow, "g\circ f" {left, below=0ex, xshift=-0.75em}]
 & V \ar[d, "g"]\\
 & \R^k
\end{tikzcd}
$$
```

And compile to an svg via this (also see [here](https://tex.stackexchange.com/a/377790/)):

```
latex svg.tex
dvisvgm svg.dvi --font-format=woff
```
