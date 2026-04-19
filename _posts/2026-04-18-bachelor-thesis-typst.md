---
layout: page
title: "I wrote my Physics Bachelor Thesis in Typst"
title_on_page: "I wrote my Physics Bachelor Thesis in Typst"
code: true
excerpt: >
  Here you can read my Thesis, and find out how I solved some challenges along the way.
---

This is my first bigger document I've ever written in [Typst](https://github.com/typst/typst), a markup-based typesetting system as modern alternative to LaTeX. After several months of work, I handed in my Bachelor Thesis in Physics at Heidelberg University on the 1st of April (no April Fool's joke ^^). If you want to give Typst a first try in the Browser, there is a [Typst Playground](https://typst.app/play).

<object
  data="/assets/blog/2026-bachelor-thesis-typst/prime-refine.pdf#view=FitV"
  type="application/pdf"
  width="100%" height="1000px">
    <p>
      Unable to display the PDF file (most likely since you're on a mobile device). <a href="/assets/blog/2026-bachelor-thesis-typst/prime-refine.pdf">Download the Thesis PDF</a> instead.
    </p>
</object>

I didn't like the LaTeX template offered by our university too much, so I redesigned my very own in Typst. For sure, there were some challenges to overcome, but overall it felt so much easier and more intuitive to do than in LaTeX. I've been using LaTeX intensively for more than 3 years. Its typesetting looks gorgeous and I think TeX revolutionized the scientific world, just like Gutenberg did with his letterpress printing. But now it's time for a new step, and Typst is finally a competitor that can stand up against LaTeX in my opinion.

## Packages

Here is an overview over all packages from the [Typst Universe](https://typst.app/universe/) I've been using in my thesis:

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

## Project structure

This is the gist of my project outline:

```txt
// +++FILENAME+++ Project Structure
assets/
content/
├─ abstract.typ
├─ intro.typ
├─ (many more files)
template/
├─ assets/
│  ├─ logo.svg
├─ template.typ
├─ util.typ
imports.typ
literature.yml
thesis.typ
```

To keep my main `thesis.typ` file slim, I outsourced the template to its own folder `template/`. See also [Making a Template](https://typst.app/docs/tutorial/making-a-template/) in the Typst docs. This way, I can essentially use a regular `#show` rule, just like you would when using a template from the Typst Universe.

```txt
// +++FILENAME+++ thesis.typ
#import "template/template.typ": *
#import "imports.typ": *

#show: thesis.with(
  title: "Prime & Refine: And rest of title",
  date: datetime(year: 2026, month: 04, day: 01),
  university: "Heidelberg University",
  abstract-en: include "content/abstract.typ",
  abstract-de: include "content/abstract-de.typ",
  // and more fields defined in template.typ
)

#include "content/intro.typ"
// and more content Typst files
#include "content/conclusion.typ"
#bibliography("literature.yml")
```

Unfortunately, Typst doesn't offer global imports (upvote for [this issue](https://github.com/typst/typst/issues/595)). I work around this by putting my "global" imports into a file `imports.typ`, e.g. the physica package I basically want to use everywhere. Then, in every Typst file, you just put this at the top:

```txt
#import "../imports.typ": *
```



## Plots: Matplotlib and Typst

## Literature with Hayagriva

https://github.com/typst/hayagriva

https://jonasloos.github.io/bibtex-to-hayagriva-webapp/

## Presentation (Thesis Defense)

- PowerPoint using [PPTypst](https://github.com/splines/pptypst)
