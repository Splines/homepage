# The Splines/Splience homepage

```bash
bundle exec jekyll serve --livereload
```

Then, access on `localhost:4000` instead of `127.0.0.1:4000` to avoid CORS errors.


## How to add a new language for code blocks

Download [prismjs](https://prismjs.com/download#themes=prism) and place the JS as `vendor/prism.js` to allow for server-side rendering of code blocks. Toggle these languages:

```
JavaScript (needs C-like), HTML (and other markup languages), Ruby, JSON + Web App Manifest, YAML
```
