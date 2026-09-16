# Claude Desktop Cavalry MCP

(short link: claude-cavalry-mcp)

Get a helping hand by Claude Desktop for your open Cavalry project.

_This project is not affiliated with or endorsed by Cavalry, nor by Anthropic._

This project provides an MCP server for Claude Desktop. It will automatically install a small bridge in Cavalry such that the agent can get the current scene state and execute JavaScript code in your project. The MCP server comes bundled with a complete knowledge base: information about the Cavalry JavaScript API as well as the complete user docs. But these would be too much context, so the MCP ships many search tools for the agent to quickly find relevant parts of the documentation.

Here are just a few ideas of how you could use this new power:

## Better understand Cavalry

As the extension contains the entire Cavalry user docs, ask about anything and get precise answers instead of hallucinated crap.


```
Use the CavalryMCP. Is there a way in Cavalry to automatically animate text paragraph by paragraph? E.g. some snappy, staggered reveal animation?
```

Answer took ~10s, tested with Sonnet 5 (medium effort)
```
Yes — Cavalry has a built-in behavior made exactly for this: **Auto-Animate**, combined with Text's paragraph/line level splitting. Here's the recipe for a snappy, staggered paragraph-by-paragraph reveal:

## Steps

1. **Create your Text Shape** with each paragraph separated by a blank line (Cavalry treats a paragraph as text separated by an empty line).
2. Select the Text Shape, and click **Auto-Animate** in the Shelf (this auto-checks **Use Levels**, since Text is a sub-mesh).
3. In Auto-Animate's **Animation** tab, set:
   - **Level Mode** → **Custom...** with a **Custom Level Range** targeting **Paragraph** (or use "Text (Lines)" if you want line-by-line instead of paragraph-by-paragraph).
   - **Opacity Mode** → **Fade Up** (or **Visibility Mode** → **Appear**) for a reveal.
   - **Position Mode** → **Drift** or **Slide from Composition Edges** if you want a bit of motion punch, not just a fade.
   - **Scale Mode** → **Scale Up** works well for "snappy" — combine with a fast **Progress** ease.
4. In the **Timing** tab:
   - Check **Time Offset** so each paragraph is staggered automatically (this is the actual "paragraph by paragraph" stagger control).
   - **Timing Mode** → **Normal** (first-to-last) for a straightforward top-to-bottom reveal, or **Middle Out** / **Random** for something less linear.
   - Tune **Animation Time Offset** to control how much overlap/delay exists between paragraphs — smaller offset = snappier, tighter succession.
5. For the "snap," use punchy easing on the **Progress** keyframes (e.g. Cavalry's built-in overshoot/back-ease presets) rather than a linear or purely smooth curve.

## Alternative / more manual control

If you want finer control than Auto-Animate's presets (e.g. custom per-paragraph transforms), use **Sub-Mesh** to target each paragraph individually, and drive its offset/opacity/scale with a **Stagger** behaviour connected to time offset — the [Stagger](nodes/behaviours/stagger) doc's "Using Stagger with Time" section shows the exact formula (`Stagger Value + Current Frame = Time Offset`) for building your own staggered reveal from scratch instead of the Auto-Animate presets.

For most "snappy staggered paragraph reveal" needs, Auto-Animate + Level Mode = Paragraph + Time Offset staggering in the Timing tab is the fastest path and needs almost no manual keyframing.

Want me to actually build this in your open Cavalry scene via the MCP tools?
```


```
Use the CavalryMCP. Unfortunately, I've lost the overview over my scene. Tell me what is going on in all these layers.
```

Answer took ~10s, tested with Sonnet 5 (medium effort)
```
Here's the picture of your scene, reconstructed from the scene graph:

**Concept:** A particle-morphing animation that spells out a sequence of math symbols/words, one morphing into the next — like `sqrt → pi → e → integral → nabla → partial → delta → approx → infty → in → equiv → smaller → bigger → sum`.

**Core building blocks**
- **`basicShape#1` "Particle"** — the single source shape (a dot/particle) used by *every* duplicator below. Its fill color comes from **`colorArray#3` "Colors"**.
- 14 **Duplicators**, one per symbol (`sqrt`, `pi`, `e`, `integral`, `nabla`, `partial`, `delta`, `approx`, `infty`, `in`, `equiv`, `smaller`, `bigger`, `sum`). Each one:
  - Distributes copies of `basicShape#1`
  - Is masked by its own **`editableShape`** (a vector shape of that symbol's glyph) via `generator.masks.0.id`
  - Has its particle scale driven by an **oscillator** (`shapeScale`), giving a lively size-jitter per particle

**The morph chain**
Each duplicator's output feeds into a **`blendSubMeshPositions`** node that blends it toward the *next* duplicator in the sequence (e.g. `blendSubMeshPositions#2 "sqrt -> pi"` blends `duplicator#1 "sqrt"`'s particles into `duplicator#6 "pi"`), which in turn becomes a `deformer` on the next duplicator. This creates one continuous pipeline:

```
sqrt → pi → e → integral → nabla → partial → delta → approx → infty → in → equiv → smaller → bigger → sum
```

Only the final one, `duplicator#21 "sum"`, doesn't feed forward — it's the end of the chain.

**Timing/animation drivers**
- **`stagger#1` "Transition"** feeds `timeOffset`/`shapeTimeOffset` into several of the blend and duplicator nodes (`blendSubMeshPositions#8`, `#2`, and `duplicator#17`), controlling when each morph step kicks in.
- Several **`sequence`** layers (`sequence#12/13/14`) drive their paired oscillators' `stagger` input, offsetting the per-particle scale animation.
- `duplicator#1 "sqrt"` is special: its `shapeScale` comes from a **`math#1` "Math"** node combining two oscillators (`oscillator#9 "ScaleAgain"` and `oscillator#1`) rather than a single oscillator directly — likely a hand-tuned exception for the first symbol.
- A stray **`value#2` "scale sum"** node exists but isn't wired into anything visible in this graph (no outgoing connection listed) — possibly leftover/orphaned.

**Summary:** It's a 14-stage particle text-morph rig, each stage = one masked duplicator + a blend transition to the next, all sharing one particle shape and one color source, with staggers/oscillators layered on top for organic timing and scale variation.

Want me to check current attribute values (e.g. timing/duration settings, or whether `value#2` is actually used anywhere) or render a preview frame to see it visually?
```

## Get unstuck

You're the artist, you have ideas. But they might be hard to carry out in Cavalry, e.g. when you're new to the program or don't know every functionality. Don't stay stuck, prototype more easily. You get a helping hand while remaining in full control.

```
Use the CavalryMCP. I made a path and a blue rectangle. Now I want that the rectangle follows along the path while changing its rotation according to the normal vector of the curve. Do this procedurally such that I can later change the path itself.
```

(show video)

```
Use the CavalryMCP. I have a bouncing ball animation using Forge Dynamics. But right now, the ball only bounces off the ground (composition bottom). Instead, I want it to bounce off the rectangle named "Ground". Fix that and also tell me how I could have achieved that in the UI on my own.
```

(show video)


## Start with a sketch

Claude can read your images. So why not start your new project with a sketch and paper? Then let Claude give you some first working version of your idea in Cavalry.


```
Use the CavalryMCP. Attached is a sketch of an animation I want to create in Cavalry.
```

## Realize your most ambitious projects

TODO


