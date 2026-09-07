---
layout: store
title: TypstRider
title_on_page: TypstRider
tagline: Bring the power of Typst to Cavalry.
code: true
preview_image: TypstRider-preview.jpg
preview_alt: The TypstRider UI panel inside Cavalry
youtube_id: "JHCOSNE2JkU"
video_title: "TypstRider teaser"
price: "18 €"
buy_label: "Buy"
dodo_product_id_test: "pdt_0Nn1eRhajGZz1V6UUPx8F"
dodo_product_id_live: "pdt_0Nn7F12p1FYerNKuKB3JS"
---

<div class="doc-panel" data-doc-panel="overview" markdown="1">

With TypstRider, you get a new UI in [Cavalry](https://cavalry.scenegroup.co/) that
lets you preview [Typst](https://typst.app) formulas (and LaTeX formulas) in real-time, then insert them
into your composition as shape objects. You can click again on formulas to update
their content afterwards. Packages from the
[Typst Universe](https://typst.app/universe/) are also supported.

This project is not affiliated with or endorsed by Typst or Cavalry.
{:.store-disclaimer}

## Main Features

- **Live preview.** Typst is blazing fast. To honor this, you get a preview pane
  where you see the resulting Typst formula as you type.

- **Vector shapes.** The compiled Typst formula is inserted as native Cavalry vector
  layers (grouped together). Every glyph is an editable path you can style, animate
  and deform like any other shape. Insertion usually takes less than a second.

- **Edit formulas in place.** Select a formula you inserted earlier to load it back
  into TypstRider. This way, you can update existing formulas.

- **Typst Universe packages.** `#import "@preview/…"` works, i.e. you can use
  packages from the [Typst Universe](https://typst.app/universe/), yeah ;) A package
  is downloaded once from the official registry, cached on disk, and read locally
  from then on. Cavalry asks for network permission only the first time.

## Convenience Features

- **"Only Math" mode.** If activated, TypstRider assumes your formula is math and
  automatically wraps it in `$ … $`.

- **Color picker.** Pick the fill color for a formula. New formulas start white on a
  dark composition and black on a light one, so text is readable by default.

- **Resolution-aware font size.** Specify the font size in points (pt). The default is
  adjusted to your current composition's resolution, so formulas are legible whether
  your scene is HD or 4K. Selecting several formulas at once lets you re-render them
  all at once with a new font size.

- **Preamble editor.** In the preamble, you can write Typst code that is compiled
  before your formula, e.g. for importing packages you frequently use. The preamble is
  also saved alongside each formula, so each formula is reproducible even if you change
  the global preamble later.

- **Runs locally.** The Typst compiler runs inside Cavalry via WebAssembly and ships
  with Typst's standard fonts, so formulas render exactly as the `typst` command-line
  tool would. No Internet connection is needed (except for downloading packages from
  the Typst Universe the first time you use them).

## Known Limitations

- **Fixed fonts.** Only the fonts Typst bundles by default are available; you can't
  add your own.
- **SVG limitations.** The Cavalry SVG importer is not perfect. TypstRider already
  works around many of its quirks with SVG flattening, but some SVG features may not
  import correctly. Especially gradients and transparency may not render as expected.
- **Big figures.** For large figures with more than 150 flattened paths, TypstRider
  merges paths that share the same style. This is to avoid an unresponsive Cavalry
  interface. This is a trade-off: it is a lot faster, however now some shape objects
  include different parts of the figure, which may make it harder to select and
  animate them individually.

## Acknowledgements

This project wouldn't exist without the amazing work of the
[Typst team](https://typst.app/about/) as well as Myriad Dreamin, who brought Typst
to JavaScript in their [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) project.

</div>

<div class="doc-panel" data-doc-panel="manual" hidden markdown="1">

## Installation

1. Download the `TypstRider.zip` (it is sent to you by email after checkout).
2. In Cavalry navigate to `Scripts > Show Scripts Folder`.
3. Drag the `TypstRider.zip` into the Scripts folder and unzip its contents in-place.<br>
The `TypstRider.js` file should be in the root of the Scripts folder, and the `typstrider_assets` folder should be alongside it. If you want to, you can delete the `TypstRider.zip` now.
4. In Cavalry navigate to `Scripts > TypstRider`.

Upon first use, you may be asked to allow network access. This is needed for downloading packages from the Typst Universe the first time you use them. After that, everything runs locally. You might also want to click on the "Reset" button of TypstRider to ensure that the settings are in a clean state.

## Examples

If you're new to Typst, their [Getting Started](https://typst.app/docs/tutorial/)
guide is a good place to start (and in general the Typst docs are awesome). They also
have a [Guide for LaTeX Users](https://typst.app/docs/guides/for-latex-users/). And if
you really want to write math in LaTeX with TypstRider, check out the
[mitex](https://typst.app/universe/package/mitex/) package from the Typst Universe.

What about some sample formulas to try things out? Activate the `Only Math` mode such
that you don't have to write `$` around your formulas.

```typ
integral_0^oo e^(-x^2) dif x = sqrt(pi) / 2
```

To test the preamble feature, you can use the following example:

```typ
# Put this in the preamble:
#let vec3(a, b, c) = $vec(#a, #b, #c)$
#let R = math.bb("R")

# Put this in the main document:
vec3(x, y, z) in R^3
```

or what about some [Typst Universe packages](https://typst.app/universe/):

```typ
#import "@preview/physica:0.9.8": *
curl vb(E) = - pdv(vb(B), t)
```

```typ
#import "@preview/fletcher:0.5.8" as fletcher: diagram, node, edge
#diagram(cell-size: 15mm, $
    G edge(f, ->) edge("d", pi, ->>) & im(f) \
    G slash ker(f) edge("ur", tilde(f), "hook-->")
$)
```

```typ
#import "@preview/conchord:0.4.0": smart-chord
#box(smart-chord("Am"))
```

</div>

<div class="doc-panel" data-doc-panel="releases" hidden markdown="1">

## Releases

### 1.0.0 — 2026-09-08

- Initial release

</div>
