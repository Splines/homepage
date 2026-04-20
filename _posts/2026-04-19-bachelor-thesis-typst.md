---
layout: page
title: "I wrote my Physics Bachelor Thesis in Typst"
title_on_page: "I wrote my Physics Bachelor Thesis in Typst"
code: true
excerpt: >
  Spoiler: it was an awesome experience. Here, you can read my Thesis, and find out how I solved some challenges along the way.
---

<figure class="image clickable">
  <img src="{{'/assets/blog/2026-bachelor-thesis-typst/thesis-overview.jpg' | relative_url }}" />
</figure>

This is my first bigger document I've ever written in [Typst](https://github.com/typst/typst), a markup-based typesetting system as modern alternative to LaTeX. After several months of work, I handed in my Bachelor Thesis in Physics at Heidelberg University on the 1st of April (no April Fool's joke). If you want to give Typst a try in your browser, there is a [Typst Playground](https://typst.app/play).

<object
  data="/assets/blog/2026-bachelor-thesis-typst/prime-refine.pdf#view=FitV&navpanes=0"
  type="application/pdf"
  width="100%" height="1000px">
    <p>
      Unable to display the PDF file (most likely since you're on a mobile device). <a href="/assets/blog/2026-bachelor-thesis-typst/prime-refine.pdf">Download the Thesis PDF</a> instead.
    </p>
</object>

I didn't like the [LaTeX template](https://physik.uni-heidelberg.de/downloads?lang=en#infoarea-398) offered by our university too much, so I redesigned my very own in Typst. For sure, there were some challenges to overcome, but overall it felt so much easier and more intuitive to do than in LaTeX. I've been using LaTeX intensively for more than 3 years. Its typesetting looks gorgeous and I think TeX revolutionized the scientific world, just like Gutenberg did with his letterpress printing. And while TeX will remain crucial for many years to come, there's no shame in trying out new things. Typst is finally a competitor that can stand up against LaTeX and is so much easier to use.

## Typst Packages

Here I've listed all packages from the [Typst Universe](https://typst.app/universe/) I've been using in my thesis:

- [hydra](https://typst.app/universe/package/hydra) to easily set the page headings.

- [physica](https://typst.app/universe/package/physica) for easy math- and physics-related typesetting.

- [unify](https://typst.app/universe/package/unify) to format numbers and SI units.

- [equate](https://typst.app/universe/package/equate) to give labels to single lines in multiline math expressions.

- [embiggen](https://typst.app/universe/package/embiggen) to use LaTeX-like delimiter sizing, e.g. `#big()` similar to `\big` in LaTeX.

- [dashy-todo](https://typst.app/universe/package/dashy-todo) to put TODO notes in the document. They look quite annoying, so it's very rewarding when you can remove them ;)

- [cetz](https://typst.app/universe/package/cetz) as drawing library similar to TikZ. Used for only one graphic (Figure 4.3). See more on drawing plots later.

- [ctheorems](https://typst.app/universe/package/ctheorems) for theorem and definition boxes. I modified its source code to have a global theorem counter.

- [booktabs](https://typst.app/universe/package/booktabs) to get the look and feel of tables typeset with LaTeX's Booktabs package.

- [subpar](https://typst.app/universe/package/subpar) to create sub figures, e.g. "Figure 1 (a)", and get correct caption references.

- [nth](https://typst.app/universe/package/nth) to generate English ordinal numbers, e.g. 1st.

- [chemformula](https://typst.app/universe/package/chemformula) for chemical formula formatting.

## Project structure

This is the gist of my project outline.

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

To keep my main `thesis.typ` file slim, I outsourced the template to its own folder `template/`. See also [Making a Template](https://typst.app/docs/tutorial/making-a-template/) in the Typst docs. This way, I can essentially use a regular `#show` rule, just like you would when using a template from the [Typst Universe](https://typst.app/universe/search/?kind=templates). If you want to style anything, you should also read [the docs on Styling](https://typst.app/docs/reference/styling).

```typ
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

Unfortunately, Typst doesn't offer global imports (upvote for [this issue](https://github.com/typst/typst/issues/595)). I work around this by putting my "global" imports into a file `imports.typ`. For example, it contains this line

```typ
// +++FILENAME+++ imports.typ
#import "@preview/physica:0.9.5": *
// more imports
```

as I want to use physica everywhere. Then, in every Typst file, you just put this at the top:

```typ
#import "../imports.typ": *
```

## Plots: Matplotlib and Typst

Getting beautiful vector-graphic plots that are accessible is not the easiest thing to do. Luckily, there is [mpl-typst](https://github.com/daskol/mpl-typst), a Matplotlib Typst backend. With this Python library, you can just generate your Matplotlib plots as usual, and then export them to a Typst file:

```py
fig.savefig("my-plot.typ")
```

This will produce a file `my-plot.typ`, which uses primitive [Typst shapes](https://typst.app/docs/reference/visualize/) to construct the plot, e.g. lines, rectangles, circles, gradients, etc. It also uses a regular `#text()` Typst command, thus your font and the font size will perfectly match the rest of your document. Additionally, I've added this at the top of my Python file in order to turn off LaTeX processing in Matplotlib.

```py
plt.rcParams.update(
    {
        "text.usetex": False,
        "text.parse_math": False,
    }
)
```

To avoid errors, you should also use raw strings, e.g.
```py
ax.set_ylabel(r'$norm(hat(rho) - rho^*)_2$')  # using Typst syntax
```

The only problem with the mpl-typst Python package is that it doesn't seem to respect your `xlim` and `ylim` properties (at the time of writing, see [this issue](https://github.com/daskol/mpl-typst/issues/14)), resulting in lines being shown even outside your plot region when you clipped them.

For plots where this was a problem, I switched to another great project: [mpl2typ](https://github.com/janekfleper/mpl2typ). It is not stable yet and feature-incomplete, but still worth to give it a try.

Furthermore, you could also use packages like [cetz](https://typst.app/universe/package/cetz), [cetz-plot](https://typst.app/universe/package/cetz-plot) and [lilaq](https://typst.app/universe/package/lilaq) to plot directly in Typst. However, I share Janek Fleper's sentiment expressed [here](https://github.com/janekfleper/mpl2typ#why-not-a-typst-package) in that the heavy lifting for plot generation isn't something Typst should do. I see Typst's role here just as someone who places my (finished) images in a text flow. I will continue to stick to Python for data exploration and also plotting via Matplotlib, and the mentioned packages offer a nice bridge to Typst.

Additionally, to achieve a good aspect ratio for your figures, I use [this tip](https://jwalton.info/Embed-Publication-Matplotlib-Latex/), essentially calculating the golden ratio.

```py
// +++FILENAME+++ plot_size.py
def get_plot_size(width=447.87, fraction=1):
    """Gets beautiful figure dimensions with the golden ratio.
    For usage in LaTeX/Typst documents.

    Taken from https://jwalton.info/Embed-Publication-Matplotlib-Latex/

    Parameters
    ----------
    width: float
            Document textwidth or columnwidth in pts
    fraction: float, optional
            Fraction of the width which you wish the figure to occupy

    Returns
    -------
    fig_dim: tuple
            Dimensions of figure in inches
    """
    # Width of figure (in pts)
    fig_width_pt = width * fraction

    # Convert from pt to inches
    inches_per_pt = 1 / 72.27

    # Golden ratio to set aesthetic figure height
    # https://disq.us/p/2940ij3
    golden_ratio = (5**0.5 - 1) / 2

    # Figure width in inches
    fig_width_in = fig_width_pt * inches_per_pt
    # Figure height in inches
    fig_height_in = fig_width_in * golden_ratio

    fig_dim = (fig_width_in, fig_height_in)

    return fig_dim


# then use it like this in your Matplotlib plots
plt.figure(figsize=get_plot_size())
```

The hardcoded width `447.87` is according to my Typst document. To measure the width of your document, you can use this Typst snippet:

```typ
#layout(size => {
  [Width of page is #size.width.]
})
```

## Literature with Hayagriva

While Typst also supports [BibLaTeX](https://typst.app/docs/reference/model/bibliography/) `.bib` files, I've tried out the new [Hayagriva](https://github.com/typst/hayagriva) format, which is a really simple YAML file that is nice to read and edit. Luckily, there is also an Online [converter](https://jonasloos.github.io/bibtex-to-hayagriva-webapp/) from BibTeX to Hayagriva since you will probably not find journals that offer you a Hayagriva citation export. At least not yet ;)

## Presentation

For my Thesis defense (also called "colloquium"), I copied over some formulas from my Typst document to PowerPoint. For this purpose, I've developed [PPTypst](https://github.com/splines/pptypst), a PowerPoint plugin that lets you insert and edit (!) Typst equations directly in PowerPoint. Here is how some of my slides looked like.

<figure class="image clickable">
  <img src="{{'/assets/blog/2026-bachelor-thesis-typst/colloque-1.jpg' | relative_url }}" />
</figure>

<figure class="image clickable">
  <img src="{{'/assets/blog/2026-bachelor-thesis-typst/colloque-2.jpg' | relative_url }}" />
</figure>

<figure class="image clickable">
  <img src="{{'/assets/blog/2026-bachelor-thesis-typst/colloque-3.jpg' | relative_url }}" />
</figure>

## Final words

All in all, I was very happy with this new, fresh experience of writing a longer scientific document in Typst. The feedback cycle is amazing since you directly see the changes in almost real-time. I made heavy use of Myriad-Dreamin's [tinymist](https://myriad-dreamin.github.io/tinymist/), a language server for Typst (among others available as [VSCode extension](https://marketplace.visualstudio.com/items?itemName=myriad-dreamin.tinymist), where you can even pop out the preview pane and show it on `localhost` in your browser).

Just as with LaTeX, of course I have to search for some code snippets on the web for specific things, but at least I can now understand them as they are written in a language close to Rust (i.e. modern), and not a macro-driven language like TeX. As an example, look at the great LaTeX package [siunitx](https://ctan.org/pkg/siunitx) and [its source code](https://github.com/josephwright/siunitx/blob/main/siunitx-unit.dtx). To be honest, I wouldn't want to maintain this package; I even have a hard time reading it. Compare that to [physica](https://typst.app/universe/package/physica/) and [its source code](https://github.com/Leedehai/typst-physics/blob/master/physica.typ). For sure, without the context, there is no way I could explain a random line to you. But at least, I have the feeling that I can easily find out what it does. The syntax is much closer to the programming languages I use everyday.

With Typst, I do understand code I see online (e.g. in packages and other templates), and can even build upon it, without despairing in mysterious compiler error messages and a backslash hell. I'm definitely sticking with Typst and will only use LaTeX sparingly from now on. Feel free to give a Typst a try [in your browser](https://typst.app/play).

---

## Further Challenges & Solutions

Last but not least, here is a collection of challenges I faced & how I solved them. Luckily, the Typst community is very active and welcoming. In addition to a regular search in your favorite search engine, I recommend to also search in the [Typst Issues](https://github.com/typst/typst/issues) on GitHub (remember to remove `state:open` in the search bar as the issue could have already been closed) and to search in the [Typst Forum](https://forum.typst.app/) as well (there's a small search icon next to your profile picture).

Enable heading-specific figure numbering and increase spacing.

```typ
#show figure: set block(spacing: 1.5em)
#show figure: set figure(gap: 1.0em)
#set figure(numbering: n => numbering("1.1", counter(heading).get().first(), n), gap: 1em)
```

For multi-line figure captions, I want that the whole caption itself is centered on page, but the text inside is left-aligned. Solution from [here](https://forum.typst.app/t/how-to-center-caption-but-left-align-the-text-inside/2561).

```typ
#show figure.caption: it => {
  align(box(align(it, left)), center)
}
```

Show references to equations in a custom format. Solution from [here](https://github.com/typst/typst/discussions/1917#discussioncomment-6703472).

```typ
#show ref: it => {
  if it.element != none and it.element.func() == math.equation {
    // custom reference for equations
    link(it.target)[(#it)]
  } else {
    it
  }
}
```

Disable numbering for 3rd level headings (I don't use headers beyond that nesting level, so I only had to disable this for the 3rd level headings). Solution from [here](https://stackoverflow.com/a/77488450/).

```typ
#set heading(numbering: "1.1")
#show heading.where(level: 3): it => [
  #block(it.body)
]
```

Table of contents styling. I may have copied this from somewhere, let me know if you find the source.

```typ
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

In case you need roman and arabic numbering, I took the following code snippet from the [parcio-thesis template](https://typst.app/universe/package/parcio-thesis).

```typ
#let setup-numbering(doc, num: "1", reset: true, alternate: true) = {
  let footer = if alternate {
    context {
      let page-count = counter(page).get().first()
      let page-align = if calc.odd(page-count) { right } else { left }
      align(page-align, counter(page).display(num))
    }
  } else {
    auto
  }

  set page(footer: footer, numbering: num)
  if reset { counter(page).update(1) }

  doc
}

#let roman-numbering(doc, reset: true, alternate: true) = setup-numbering(
  doc,
  num: "i",
  reset: reset,
  alternate: alternate,
)
#let arabic-numbering(doc, reset: true, alternate: true) = setup-numbering(
  doc,
  reset: reset,
  alternate: alternate,
)

// then use e.g. the following in your main thesis.typ file
#show: arabic-numbering.with(reset: true, alternate: true)
```

For the appendix, you might want to do something like this in your `thesis.typ`.

```typ
#set heading(numbering: "A", supplement: [Appendix])
#counter(heading).update(0)

= Appendix
#set heading(numbering: "A.1", supplement: [Appendix])
#include "content/appendix/contributions.typ"
#include "content/appendix/proofs.typ"
```

Finally, for the last polish, I try to avoid [widows and orphans](https://en.wikipedia.org/wiki/Widows_and_orphans) by rephrasing some sentences and inserting some (too many ^^) manual layout shifts that hopefully are subtle enough to go unnoticed, e.g. `#v(-0.2em)`. I also moved some figures around and cut paragraphs because I hate it when a sentence finishes 3 pages later (because in-between were only figures). Let your own taste guide you in the process and don't forget to have fun 😊
