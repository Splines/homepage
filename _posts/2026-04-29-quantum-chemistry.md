---
layout: page
title: "Quantum Chemistry Test"
code: true
katex:
  enabled: true
excerpt: >
  TODO excerpt
---

{% vite_typescript_tag ~/quantum %}

The Hamiltonian is
$$
  H_\lambda =
    - \frac{1}{2} \partial^2 r_1
    - \frac{1}{2} \partial^2 r_2
    + v_\text{box}(r_1) + v_\text{box}(r_2)
    + \lambda \frac{1}{|r_1 - r_2|}
$$

Ground state spatial wavefunction $\psi(r_1, r_2)$ for different values of $\lambda$ (adjust it by means of a slider).
