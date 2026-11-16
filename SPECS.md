# Project conventions

Notes for agents working on this repository.

## Environment

- Do **not** modify the Ruby or Node.js environment: no `rbenv`/`nvm` installs or version switches, no global gems or npm packages, no `bundle install`/`npm install` to "fix" a mismatch, no edits to shell profiles. The owner manages these manually.
- If something is missing or out of date (e.g. the Ruby version from `.ruby-version` is not installed, or a dependency is outdated), report it and stop instead of working around it.

## Blog posts

- Every post lives in its own folder `_blog/<year>/<slug>/index.md`, with all of its assets (images, videos, CSS, scripts) right next to it. See `_plugins/blog_bundles.rb`.
- Code that is scoped to a single post belongs into that post's folder, **not** into `assets/vite/`. `assets/vite/` is only for project-wide code (layouts, comments, store, ...).
- Drafts: set `draft: true` and a hidden `permalink` (e.g. `/blog/drafts/<random-hex>`), and leave `date:` out until publishing. The post header then says "draft, not yet published" instead of a date. Drafts get no comments section and are left out of the post lists. The one exception is the landing page under `jekyll serve` (e.g. `bin/dev`), which lists drafts with a dashed border so you can preview their excerpt. A `jekyll build` never lists them, and a production build fails if a draft link shows up on the landing page. Published posts must have a `date:`, or the build fails (`BlogDateGuard` in `_plugins/blog_bundles.rb`).
- Post-specific stylesheets: put a `.css` file next to `index.md` and reference it with `custom_css: /blog/<year>/<slug>/<file>.css` in the front matter.
- Post-specific TypeScript: put a `main.ts` entrypoint (plus any modules it imports) next to `index.md` and add `vite_entrypoint: main.ts` to the front matter. Vite picks up every `_blog/**/main.ts` via `additionalEntrypoints` in `config/vite.json`, `_layouts/page.html` emits the script tag, and `_config.yml` keeps the `.ts` sources out of the built site.
- Link previews: add `preview_image: <file>` (a file next to `index.md`, ideally 1200×630) to the front matter to have social media and messengers show that image when a link to the post is shared (Open Graph `og:image` and a large Twitter/X card). Describe it for screen readers with `preview_image_alt:`. Posts without `preview_image` get no image tags. If a script renders the image, keep it next to the post as well; `_config.yml` keeps `_blog/**/*.py` out of the built site (example: `fluid-liouville/preview.py`).
- Table of contents: add `table_of_contents: true` to the front matter (off by default) to show a sticky list of the post's `##` headings to the right of the text on wide screens (see `_plugins/table_of_contents.rb`). If the post has figures that break out of the text column, override `--toc-gap` on `.toc-rail` in the post's CSS and hide the rail below a matching breakpoint (example: `fluid-liouville.css`).

## Checks

```sh
npx eslint --config ./.config/eslint.mjs --max-warnings 0 .
npx tsc --noEmit
bundle exec rspec
```
