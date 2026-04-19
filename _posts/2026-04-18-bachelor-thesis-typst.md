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

- [hydra](https://typst.app/universe/package/hydra) to easily set the page headings.

- [Physica](https://typst.app/universe/package/physica) for easy math- and physics-related typesetting.

- [Unify](https://typst.app/universe/package/unify) to format numbers and SI units.

- [equate](https://typst.app/universe/package/equate) to label a single line in a multiline math expression.

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

## Challenges & Solutions

There were many tiny challenges I had to solve along the way. Luckily, the Typst community is very active and welcoming. In addition to a regular search in your favorite search engine, I recommend to also search in the [Typst Issues](https://github.com/typst/typst/issues) on GitHub (remember to remove `state:open` in the search bar as the issue could have already been closed) and to search in the [Typst Forum](https://forum.typst.app/) as well (there's a small search icon next to your profile picture).

Here is an overview of challenges I faced & how I solved them:

`chapter-intro`

Enable heading-specific figure numbering and increase spacing.

```txt
#show figure: set block(spacing: 1.5em)
#show figure: set figure(gap: 1.0em)
#set figure(numbering: n => numbering("1.1", counter(heading).get().first(), n), gap: 1em)
```

Especially for multi-line figure captions, I want that the whole caption itself is centered on page, but the text inside is left-aligned. Solution from [here](https://forum.typst.app/t/how-to-center-caption-but-left-align-the-text-inside/2561).

```txt
#show figure.caption: it => {
  align(box(align(it, left)), center)
}
```

Show equations in a custom format. Solution from [here](https://github.com/typst/typst/discussions/1917#discussioncomment-6703472).

```txt
#show ref: it => {
  if it.element != none and it.element.func() == math.equation {
    // custom reference for equations
    link(it.target)[(#it)]
  } else {
    it
  }
}
```

Disable numbering for 3rd level headings. Solution from [here](https://stackoverflow.com/a/77488450/).

```txt
#set heading(numbering: "1.1")
#show heading.where(level: 3): it => [
  #block(it.body)
]
```

Table of contents styling.

```txt
#show outline: it => {
  show heading: pad.with(bottom: 1em)
  it
}

#show outline.entry: it => {
  show linebreak: none
  it
}

// Level 1 outline entries are bold and there is no fill
#show outline.entry.where(level: 1): set outline.entry(fill: none)
#show outline.entry.where(level: 1): set block(above: 1.35em)
#show outline.entry.where(level: 1): set text(weight: "semibold")

// Level 2 and 3 outline entries have a bigger gap and a dot fill
#show outline.entry.where(level: 2).or(outline.entry.where(level: 3)): set outline.entry(fill: repeat(
  justify: true,
  gap: 0.5em,
)[.])

#show outline.entry.where(level: 2).or(outline.entry.where(level: 3)): it => link(
  it.element.location(),
  it.indented(
    gap: 1em,
    it.prefix(),
    it.body() + box(width: 1fr, inset: (left: 5pt), it.fill) + box(width: 1.5em, align(right, it.page())),
  ),
)
```


## Last layout pass

- manual `#v()` statements.



## Plots: Matplotlib and Typst

## Literature with Hayagriva

https://github.com/typst/hayagriva

https://jonasloos.github.io/bibtex-to-hayagriva-webapp/

## Presentation (Thesis Defense)

- PowerPoint using [PPTypst](https://github.com/splines/pptypst)
