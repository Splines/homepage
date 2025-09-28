# The Splines/Splience homepage

Build locally

```bash
bundle exec jekyll serve --livereload --incremental
```

or short:
```bash
jekyll s -Il
```

Then, access on [`localhost:4000`](http://localhost:4000) instead of `127.0.0.1:4000` to avoid local CORS errors.

## How to publish drafts for others to review

Add this to the frontmatter of the post:

```
---
draft: true
permalink: /blog/drafts/<your-random-hash>
---
```

## How to add a new language for code blocks

Download [prismjs](https://prismjs.com/download#themes=prism) and place the JS as `vendor/prism.js` to allow for server-side rendering of code blocks. Toggle these languages:

```
JavaScript (needs C-like), HTML (and other markup languages), Ruby, JSON + Web App Manifest, YAML
```
