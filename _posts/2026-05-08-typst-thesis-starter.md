---
layout: page
title: "Typst Thesis Starter"
code: true
excerpt: >
  Spoiler: it was an awesome experience. Here, you can read my Thesis, and find out how I solved some challenges along the way.
---

See the related [**GitHub repo**](https://github.com/Splines/typst-thesis-starter).

In a previous [post]({% link _posts/2026-04-19-bachelor-thesis-typst.md %}), I uploaded my Physics Bachelor Thesis written in Typst. Some people addressed me with the inquiry to upload the source code. Instead of doing that (sorry), I extracted a reusable template repository out of my thesis, such that you can base your work on it and get started right away.

<figure class="image">
  <a href="https://github.com/Splines/typst-thesis-starter">
    <img src="{{'/assets/blog/2026-typst-thesis-starter/typst-thesis-starter.jpg' | relative_url }}" />
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
// and more Typst files in the content/ folder
#bibliography("literature.yml")
```

Have fun with the template repo and feel free to open [issues](https://github.com/Splines/typst-thesis-starter/issues) if you feel like something could be improved.
