---
layout: page
title: "I wrote my Physics Bachelor Thesis in Typst"
title_on_page: "I wrote my Physics Bachelor Thesis in Typst"
excerpt: >
  Here you can read my Thesis, and find out how I solved some challenges along the way.
---

This is my first bigger document I've ever written in [Typst](https://github.com/typst/typst), a markup-based typesetting system as modern alternative to LaTeX. After several months of work, I handed in my Bachelor Thesis in Physics at Heidelberg University on the 1st of April (no April Fool's joke ^^).

<object
  data="/assets/blog/2026-bachelor-thesis-typst/prime-refine.pdf#view=FitV"
  type="application/pdf"
  width="100%" height="1000px">
    <p>
      Unable to display the PDF file (most likely since you're on a mobile device). <a href="/assets/blog/2026-bachelor-thesis-typst/prime-refine.pdf">Download the Thesis PDF</a> instead.
    </p>
</object>

I didn't like the LaTeX template offered by our university too much, so I redesigned my very own in Typst. For sure, there were some challenges to overcome, but overall it felt so much easier and more intuitive to do than in LaTeX. I've been using LaTeX intensively for more than 3 years. Its typesetting looks gorgeous and I think TeX revolutionized the scientific world, just as Gutenberg did with his letterpress printing. But now it's time for a new revolution, and Typst is finally a competitor that can stand up against LaTeX.

## Packages

Here is an overview over all packages from the [Typst Universe](https://typst.app/universe/) I've been using in this Thesis:

- [Physica](https://typst.app/universe/package/physica) for easy math- and physics-related typesetting.

- [Unify](https://typst.app/universe/package/unify) to format numbers and SI units.

- [embiggen](https://typst.app/universe/package/embiggen) to use LaTeX-like delimiter sizing, e.g. `#big()` similar to `\big` in LaTeX.

- [dashy-todo](https://typst.app/universe/package/dashy-todo) to put TODO notes in the document. They look quite annoying, so it's very rewarding when you can remove them ;)

- [cetz](https://typst.app/universe/package/cetz) as drawing library similar to TikZ. Used for only one graphic (Figure 4.3). See more on drawing plots later.

- [ctheorems](https://typst.app/universe/package/ctheorems) for theorem and definition boxes. I modified its source code to have a global theorem counter.

- [booktabs](https://typst.app/universe/package/booktabs) to get the look and feel of tables typeset with LaTeX's Booktabs package.

- [subpar](https://typst.app/universe/package/subpar) to create sub figures with (a) and (b) and correct caption references.

- [nth](https://typst.app/universe/package/nth) to generate English ordinal numbers, e.g. 1st.

- [chemformula](https://typst.app/universe/package/chemformula) for chemical formula formatting.

## Literature with Hayagriva

https://github.com/typst/hayagriva

https://jonasloos.github.io/bibtex-to-hayagriva-webapp/

## Presentation (Thesis Defense)

- PowerPoint using [PPTypst](https://github.com/splines/pptypst)
