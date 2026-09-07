---
layout: page
date: 2026-05-08
slug: typst-thesis-starter
permalink: /blog/2026/typst-thesis-starter/
title: "Typst Thesis Starter"
code: true
excerpt: >
  A reusable template repository for writing your thesis in Typst. Based on the design of my Physics Bachelor Thesis. Fully customizable and ready to use.
---

See the related [**GitHub repo**](https://github.com/Splines/typst-thesis-starter).

In a previous [post]({% link _blog/2026/bachelor-thesis-typst/index.md %}), I uploaded my Physics Bachelor Thesis written in Typst. Some people addressed me with the inquiry to upload the source code. Instead of doing that (sorry), I extracted a reusable template repository out of my thesis, such that you can base your work on it and get started right away.

<figure class="image">
  <a href="https://github.com/Splines/typst-thesis-starter">
    <img src="{{'/blog/2026/typst-thesis-starter/typst-thesis-starter.jpg' | relative_url }}" />
  </a>
</figure>

[Templates](https://typst.app/universe/search/?kind=templates) on the Typst Universe are quite nice, but limit design flexibility. They also require you to organize your project on your own. Instead, I provide a complete repository scaffold that lets you begin writing immediately, while maintaining full control over styling & layout.

How does it work? Well, it's pretty simple: the main `thesis.typ` file makes use of the template defined in a `template/` folder right next to the `content/` folder. This way, we separate content and design and you can still modify everything, but based on a solid starting point.

```typ
// +++FILENAME+++ thesis.typ
#import "template/template.typ": *

#show: thesis.with(
  title: "Typst-Starter: \\nLet's get started with that Thesis",
  // and so on
)

#include "content/intro.typ"
#bibliography("literature.yml")
```

Have fun with the template repo and feel free to open [issues](https://github.com/Splines/typst-thesis-starter/issues) if you feel like something could be improved.
