import { fileURLToPath } from "node:url";

import css from "@eslint/css";
import eslint from "@eslint/js";
import html from "@html-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig(
  {
    ignores: [
      "node_modules/",
      "vendor/", // vendored JS (prism, katex, ...)
      "assets/katex/", // vendored KaTeX CSS + fonts
      "_site/", // Jekyll build output
      ".jekyll-cache/", // Jekyll + Vite build cache
      "public/vite*/", // Vite build output
      "tmp/",
      "notes/",
    ],
  },
  {
    files: ["**/*.{js,mjs,ts,mts}"],
    extends: [eslint.configs.recommended],
    plugins: { "@stylistic": stylistic },
    rules: {
      ...stylistic.configs.customize({
        indent: 2,
        quotes: "double",
        semi: true,
        jsx: false,
        braceStyle: "1tbs",
      }).rules,
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "@stylistic/max-len": ["error", { code: 100, ignoreUrls: true, ignoreStrings: true }],
      "no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    files: ["**/*.{ts,mts}"],
    extends: [tseslint.configs.strictTypeChecked],
    languageOptions: {
      parserOptions: {
        // https://typescript-eslint.io/blog/project-service
        // vite.config.mts runs in Node and stays out of the browser-only tsconfig.json.
        projectService: { allowDefaultProject: ["vite.config.mts"] },
        tsconfigRootDir: fileURLToPath(new URL("..", import.meta.url)),
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // We control the markup the scripts run against, so `querySelector(...)!` is fine;
      // missing elements are caught while writing the page, not at runtime.
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    // Code that runs in the browser: Vite sources, plain scripts and post-scoped scripts.
    files: ["assets/**/*.{js,ts}", "_blog/**/*.{js,ts}", "_store/**/*.{js,ts}"],
    languageOptions: { globals: globals.browser },
  },
  {
    files: [".config/**/*.{js,mjs,ts,mts}", "vite.config.mts"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["**/*.css"],
    plugins: { css },
    language: "css/css",
    extends: [css.configs.recommended],
    rules: {
      "css/use-baseline": ["error", {
        allowSelectors: ["nesting"],
        // `scrollbar-width` is only "newly" baseline; hiding the scrollbar is a
        // progressive enhancement here, so a visible one is an acceptable fallback.
        allowProperties: ["user-select", "zoom", "resize", "scrollbar-width"],
      }],
      "css/no-invalid-properties": ["error", { allowUnknownVariables: true }],
    },
  },
  {
    files: ["**/*.html"],
    ...html.configs["flat/recommended"],
    plugins: {
      "@html-eslint": html,
      "@stylistic": stylistic,
    },
    // No `templateEngineSyntax` for Liquid here: jekyll-vite needs `{{ }}` nested inside
    // `{% %}` (see _layouts/page.html), which the Nunjucks preset cannot parse.
    rules: {
      "@stylistic/eol-last": ["error", "always"],
      "@stylistic/no-trailing-spaces": "error",
      "@stylistic/no-multiple-empty-lines": ["error", { max: 1, maxEOF: 0 }],
      ...html.configs["flat/recommended"].rules,
      // 🎈 Best Practices
      "@html-eslint/no-extra-spacing-text": "error",
      "@html-eslint/no-script-style-type": "error",
      "@html-eslint/no-target-blank": "error",
      // 🎈 Accessibility
      "@html-eslint/no-abstract-roles": "error",
      "@html-eslint/no-accesskey-attrs": "error",
      "@html-eslint/no-aria-hidden-body": "error",
      "@html-eslint/no-non-scalable-viewport": "error",
      "@html-eslint/no-positive-tabindex": "error",
      "@html-eslint/no-skip-heading-levels": "error",
      // 🎈 Styles
      "@html-eslint/attrs-newline": ["error", {
        closeStyle: "newline",
        ifAttrsMoreThan: 5,
      }],
      "@html-eslint/element-newline": ["error", { skip: ["pre", "code"], inline: ["$inline"] }],
      "@html-eslint/id-naming-convention": ["error", "kebab-case"],
      "@html-eslint/indent": ["error", 2, { tagChildrenIndent: { html: 0 } }],
      "@html-eslint/sort-attrs": "error",
      // Conflicts with `enforceBeforeSelfClose` below (it forbids the space
      // before `/>` that no-extra-spacing-attrs requires), causing circular fixes.
      "@html-eslint/no-extra-spacing-tags": "off",
      "@html-eslint/no-extra-spacing-attrs": ["error", {
        enforceBeforeSelfClose: true,
        disallowMissing: true,
        disallowTabs: true,
        disallowInAssignment: true,
      }],
    },
  },
);
