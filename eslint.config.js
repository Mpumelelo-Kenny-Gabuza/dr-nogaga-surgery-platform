// Flat config for ESLint 9 — the devDependencies for this (typescript-eslint,
// eslint-plugin-react-hooks, eslint-plugin-react-refresh) were already in
// package.json from Phase 1, but no config file was ever committed, so
// `npm run lint` has never actually run. This is the standard Vite +
// React + TypeScript setup those packages are meant for, built from the
// two @typescript-eslint packages already declared (rather than adding the
// separate "typescript-eslint" convenience meta-package as a new dependency).
import js from "@eslint/js";
import globals from "globals";
import tseslintPlugin from "@typescript-eslint/eslint-plugin";
import tseslintParser from "@typescript-eslint/parser";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: globals.browser,
      parser: tseslintParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: {
      "@typescript-eslint": tseslintPlugin,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...tseslintPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
      "no-undef": "off", // TS + its own resolver already cover this; avoids JSX false positives
    },
  },
];
