import eslint from "@eslint/js";
import html from "@html-eslint/eslint-plugin";
import stylistic from "@stylistic/eslint-plugin";
import globals from "globals";

export default [
  {
    // Globally ignore the following paths
    ignores: [
      "node_modules/",
      "tmp/",
      "notes/",
    ],
  },
  {
    files: ["**/*.js", "**/*.mjs"],
    plugins: {
      "@stylistic": stylistic,
    },
    ...eslint.configs.recommended,
    rules: {
      ...stylistic.configs.customize({
        "indent": 2,
        "jsx": false,
        "quote-props": "always",
        "semi": true,
        "brace-style": "1tbs",
      }).rules,
      "@stylistic/quotes": ["error", "double", { avoidEscape: true }],
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        ...globals.browser,
      },
    },
  },
  {
    files: ["**/*.html"],
    ...html.configs["flat/recommended"],
    plugins: {
      "@html-eslint": html,
      "@stylistic": stylistic,
    },
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
      "@html-eslint/element-newline": ["error", { skip: ["pre", "code"] }, { inline: ["$inline"] }],
      "@html-eslint/id-naming-convention": ["error", "kebab-case"],
      "@html-eslint/indent": ["error", 2, { tagChildrenIndent: { html: 0 } }],
      "@html-eslint/sort-attrs": "error",
      "@html-eslint/no-extra-spacing-attrs": ["error", {
        enforceBeforeSelfClose: true,
        disallowMissing: true,
        disallowTabs: true,
        disallowInAssignment: true,
      }],
    },
  },
];
