# Project conventions

Notes for anyone (human or agent) working on this repository.

## Environment

- Do **not** modify the Ruby or Node.js environment: no `rbenv`/`nvm` installs or version switches, no global gems or npm packages, no `bundle install`/`npm install` to "fix" a mismatch, no edits to shell profiles. The owner manages these manually.
- If something is missing or out of date (e.g. the Ruby version from `.ruby-version` is not installed, or a dependency is outdated), report it and stop instead of working around it.

## Blog posts

- Every post lives in its own folder `_blog/<year>/<slug>/index.md`, with all of its assets (images, videos, CSS, scripts) right next to it. See `_plugins/blog_bundles.rb`.
- Code that is scoped to a single post belongs into that post's folder, **not** into `assets/vite/`. `assets/vite/` is only for project-wide code (layouts, comments, store, ...).
- Post-specific stylesheets: put a `.css` file next to `index.md` and reference it with `custom_css: /blog/<year>/<slug>/<file>.css` in the front matter.
- Post-specific TypeScript: put a `main.ts` entrypoint (plus any modules it imports) next to `index.md` and add `vite_entrypoint: main.ts` to the front matter. Vite picks up every `_blog/**/main.ts` via `additionalEntrypoints` in `config/vite.json`, `_layouts/page.html` emits the script tag, and `_config.yml` keeps the `.ts` sources out of the built site.
- Table of contents: add `table_of_contents: true` to the front matter (off by default) to show a sticky list of the post's `##` headings to the right of the text on wide screens (see `_plugins/table_of_contents.rb`). If the post has figures that break out of the text column, override `--toc-gap` on `.toc-rail` in the post's CSS and hide the rail below a matching breakpoint (example: `fluid-liouville.css`).

## Checks

```sh
npx eslint --config ./.config/eslint.mjs --max-warnings 0 .
npx tsc --noEmit
bundle exec rspec
```
