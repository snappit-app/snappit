import js from "@eslint/js";
import { Linter } from "eslint";
import prettierConfig from "eslint-config-prettier";
import prettier from "eslint-plugin-prettier";
import importSort from "eslint-plugin-simple-import-sort";
import solid from "eslint-plugin-solid";
import globals from "globals";
import tseslint from "typescript-eslint";

const config = tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended, prettierConfig],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        project: ["./tsconfig.json", "./tsconfig.node.json"],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      solid,
      prettier,
      "import-sort": importSort,
    },
    settings: {
      react: {
        version: "detect",
      },
    },
    rules: {
      ...solid.configs["flat/recommended"].rules,
      "import-sort/imports": "warn",
      "import-sort/exports": "warn",
      "prettier/prettier": [
        "error",
        {
          printWidth: 100,
          tabWidth: 2,
          singleQuote: false,
        },
      ],
    },
  },
) as Linter.Config[];

export default config;
