---
layout: page
date: 2026-10-30
title: "AI @ Uni Setup TODO"
code: true
katex:
  enabled: true
excerpt: >
  TODO
---


## All or nothing

I don't like the black & white framing some professors evoke at my university with regards to the usage of AI. "Please don't use any AI when working on exercise sheets. In the exam you also won't have access to it.", they point out. Besides the whole concept of [exams]({% link _blog/2026/exams/index.md %}) being moot in my opinion, I'd argue that one can choose the granularity of "using AI in your work" in $[0,1] \subseteq \mathbb{R}$ (instead of a binary decision) and that the sweet spot is not at the endpoints of this interval.

If you fully embrace the "vibe-coding" spirit and choose the $1$-endpoint, you would tell the agent: "Solve this exercise sheet for me" and then hand in that solution unmodified to your poor tutor, just to get your eligibility points for an exam. I think it's clear that for your personal skills, you won't get much out of this approach.

On the other endpoint, you'd refuse to use the agent at all and solve the exercises completely on your own, trying out approaches that you may have to scrap, then try again until you find a solution. This probably also involves reading parts of the lecture script again to refresh your knowledge on the notation and on the subject matter in general.

The $0$-endpoint would undoubtedly cost you more time, but you would learn a lot more because there is *friction* to the process. You engage with the material, challenge your assumptions and maybe have some "Aha!" moments along the way. And learning naturally takes time: there's a reason professional musicians usually have started playing their instrument when they were very young[^1].


## Friction

I consider friction to be a key element to the learning process. I also think that it naturally arises whenever you engage deeply and playfully with any learning material:

For example, you learn about a new concept that you've never encountered before. Naturally, you try to connect it to things you already know. But these associations can be wrong. So the friction is due to your mental model in your head not matching the reality, and you will stumble upon this whenever you engage more with e.g. a theorem in math that has weird consequences that don't make any sense for you at first sight. Then you update your mental model and you realize: well, the way I thought about it was actually wrong or not well suited for this problem.

You may also learn more about a topic you consider yourself proficient in, just to realize your knowledge still lacks in certain areas and needs deeper digging; again, because your mental modal of something doesn't match reality.

Or you don't understand a step in a proof because some information is missing to you, which was referenced earlier in the script. You read the script, find out about it, and then this step suddenly clicks. Or you don't understand why an assumption is needed in the proof until you find out one subtle steps where it is.

All these points have in common that you take your time to think something through. You don't just skim over a text; no, you try to understand every word, every connection to what was said before, try to visualize what is going on and then maybe work through a related exercise.


## Painful friction

But then you hit a blocker. At least I do frequently when I read lecture scripts. More often than not, it's the tiny things that trip you up: some different unusual notation here that suddenly makes the whole step feel out of place for you. Or some misplaced comma and a grammar mistake there and you don't get what the sentence is trying to tell you. Or just a level of abstraction the script uses, but which assumes you already know all the levels below, even though you don't. Or sometimes real mistakes, missing assumptions or left out (trivial?) steps.

All of this makes learning harder and a lot more time-consuming, which is not inherently bad, see _friction_. But sometimes this friction can become painful. If you frequently don't understand some steps in a proof, maybe you sit down more to try to reason about them. But in the end, time is a scarce commodity and at some point, you have to move on, leaving a bad experience with proofs behind. Next time, you may be even less motivated to understand every single step. And while I talk about proofs here, I feel this is somewhat universal to other problems as well.

## A little bit of AI & Constraints

And this is where I think Large Language Models (LLMs) are so helpful. When used "correctly", they can alleviate the painful friction for you, while still letting you experience the "good" friction necessary for learning. They can create a positive learning environment, pushing you to engage even more with the lecture material and reverse the vicious circle to a positive feedback loop. Because from my experience, continuing with a course is a lot more fun when you have understood the previous lectures, thus letting you more easily build upon that and make connections to previous topics in the next sessions.

Of course, this presumes the agent to be actually helpful. Here is what I mean by that, i.e. the constraints for my agent setup:

- The agent uses the notation from the lecture. Especially in maths and physics, where for one concept there are many different possible variable names and different conventions, it is important that the agent talks the language we use in the lecture.

- The agent knows exact section and equation numbers from the script (if there is one), such that I can ask questions like "How to get from equation 2.66 to 2.67?").

- The agent refers to actual literature I care about, and not only the literature implicitly stored as model weights. Especially, when profs even tell you about relevant literature to their course, I want the agent to know it. This way, I can also ask specifically about where notation is different, or which section of the literature deserves a closer look.

- The agent uses correctly formatted $\LaTeX$-like math output, instead of typesetting with weird Unicode symbols that try to mimick $\LaTeX$.

- The agent knows which past questions I have answered and can thus build on my previous knowledge. So agent responses should be persisted for future use.

- The agent should have access to all necessary context on multiple devices.

- The agent should be able to generate figures for me and run its own computer experiments such that its output is based on facts.


## My simple VSCode agent setup for uni

I am sure there are million ways to achieve a good LLM-setup that respects these constraints. And also more sophisticated ones that use knowledge graphs and what not. I intentionally wanted to keep my setup minimal and not invest too much work into it. It is functional, this is what counts to me here as I then want to move on _using_ it, not just _tweaking_ my setup.

The agent having access to all necessary context on multiple devices is easily solved by creating a private GitHub/GitLab/whatever repo (creatively, I have called mine "uni"). This repo is just for me, so I work on the "main" branch and just push commits directly to it (e.g. after a lecture is over where I asked some questions to the agent). In this repo, I put one folder for each course, e.g. `quantum-chemistry/` or `fluid-dynamics/`.

Next, for the agent to run its own experiments and generate figures, I set up a Python environment. My go-to Python package/project manager is [`uv`](https://docs.astral.sh/uv/), its blazing fast and easy to use. Just run `uv init` and `uv venv --python <version>` to bootstrap the project including a virtual environment, then `uv add <package>` to add a Python package and lock its version. On another machine, all you need is `uv sync` to get the exact same version. Having a reproducible setup is a blessing.

Furthermore, we need the agent to access the lecture script and literature, which I have available as PDF files. PDF is a versatile document format, but unfortunately with binary content. Yes, modern agents are smart enough to extract the content on their own, but they will use whatever you have available in your OS, and I don't trust this process to accurately preserve math-content. I am sure there are good open-source tools out there to achieve this. So far, I've been using MathPix for that (not at all sponsored). At the beginning of the semester, I usually pay the \$4.99 for one month (don't forget to cancel directly), such that I can extract up to 1000 PDF pages (and get extra usage for \$0.0035 per page). I just find this service to be very reliable and to faithfully extract any math equation and the images of the PDF. I get back a zip file that contains an `images/` folder and the content in a "MathPix Markdown" format, which is plain Markdown, enriched with $\LaTeX$-like syntax, that even preserves section and equation numbering. Here is an excerpt:

```latex
\subsection*{1.5 Joint, marginal and conditional probabilities}

A multidimensional distribution $\vec{x}=\left(x_{1}, \ldots x_{n}\right)$ is called a multivariate distribution, if
$$
p(\vec{x}) \mathrm{d} x_{1} \ldots \mathrm{~d} x_{n} \text { is the probability for } x_{i} \in\left[x_{i}, x_{i}+\mathrm{d} x_{i}\right]
$$
We also speak of a joint distribution.
```

Whatever tool you use, you should get a textual representation of the PDFs. Then, I put them into `knowledge-base/` subfolders. For example, `stat-phys/knowledge-base/`. In there, I usually have subfolders for different books and the lecture script.

Last but not least, we need a way for the agent to communicate its answers including equations. I discovered [Typst](https://typst.app) when [I wrote my Bachelor thesis]({% link _blog/2026/bachelor-thesis-typst/index.md %}), and I call it the "New LaTeX". Besides an easier syntax, the main advantage for our purposes is that I don't need to download 6GB of packages, that the installation is one-click and that documents usually compile in less than 200ms. All I do is install the great [Tinymist Typst](https://marketplace.visualstudio.com/items?itemName=myriad-dreamin.tinymist) VSCode extension and create one `.typ` file for every lecture, e.g. `stat-phys/stat.typ` that the agent can write to.

Finally, tell the agent what to do in an `AGENTS.md` file at the project root, e.g.

```text
Reuse our uv environment, e.g. run Python files via "uv run <file.py>".

Don't compile any Typst documents on your own, just look for problems in the Typst source code at the end via the VSCode problems tab.

Use Typst instead of LaTeX. Note that you have to include a space after subscripts, e.g. "f_a (x)" instead of "f_a(x)".

All answers to questions about statistical physics go into stat-phys/stat.typ (append a new section, separated by a pagebreak). Before answering such a question, read the knowledge base in stat-phys/knowledge-base. Do the same for the other topic folders: answer in that folder's own Typst file and consult its knowledge base if it has one (e.g. machine-learning/knowledge-base, answers in machine-learning/ml.typ).
```

If you're using Claude, put a `CLAUDE.md` file at the project root and write `@AGENTS.md` in it to reference the agents file.

Here is now how the setup can look like. In short, it is basically just giving the agent enough context and telling it to output its answers into a Typst document. As easy as that, yet I find this incredibly useful in day-to-day uni life.

<video controls width="100%">
  <source src="/blog/2026/ai-uni/vscode-uni-setup.mp4" type="video/mp4" />
</video>


## Closing words

Le's come back to our $[0,1]$ interval. Even at the $0$-endpoint, you may use a search engine to look up a mathematical definition on Wikipedia and read through the lecture script again, which can give you a lot of hints and maybe even parts of the solution you need. I don't see why we shouldn't sprinkle in a bit of AI into this process. It can also look up definitions for you, and even recast them to the notation used in the lecture. It can outline totally new connections between topics that you may have never stumbled upon before. It can explain steps to you that the lecture script glazed over or confirm that you indeed found a mistake (so you don't spend 3h trying to reason about something wrong).

While this sounds glorious, there are certainly dangers to this approach. History teaches us how many physics discoveries were made by chance, by randomly stumbling upon something and drawing lines to what you've done before. This process may fall short if an agent can always directly give you an answer, such that you don't even look left or right anymore. I find it very fruitful to still look into books, get to know the author's language, how they describe a phenomenon, what figures they show in their own styles and how they structure their content.

I see LLMs rather as helping hand when you're stuck, e.g. you don't understand a notation and want to see how it relates to the notation used in the lecture. Or when you want to explore more and don't know where to start, e.g. ask the agent to give you some keywords you can look up. Or to generate new learning materials for you, e.g. ask it to create an interactive website allowing you to play around with some parameters of an equation and see visually what changes.

LLMs are a double-sided sword and there are many risk. But there's infinitely many numbers in $[0,1]$: we can choose the granularity with which we make use of it. Not to do everything from start to finish for you, but as a tool to enrich your learning experience. One example, for this choice of granularity is this blog post itself. I refuse to use any LLM when I write text for my blog posts. But I still use LLMs in the process, e.g. for mundane tasks like:

> Where I put "TODO VIDEO", I want to put a video of a screen recording I made. For that purpose, please change the resolution of the /home/splines/Videos/vscode-uni-setup.mp4 video to Full HD instead of 4K, then copy it over into this repo next to the blog post index.md file and include it on the page.

I don't like the approach of profs telling students to "not use LLMs at all". It's just naive. Students will use it anyways, especially when one is overloaded with so many exciting things to learn about, but has too little time besides attending lectures, reviewing them afterwards and answering the exercise sheets. Some profs already adapt and conceive exercise questions where one is even supposed to use the agent in some parts and asked to do it completely on one's own in other parts. As long as we still think for ourselves and engage with the material in some form, I don't see a reason to not use LLMs as a tool that supports me in what I do[^2]. 


[^1]: This is not at all to discourage picking up an instrument at a later age. I've started playing the viola at 23. The argument here is just that they picked it up when they were very young, so they had a lot of time to practice until they played in a professional context.

[^2]: Aside environmental and political reasons of course, but this is not the point of this post.
