import pluginJs from "@eslint/js";
import tseslint from "typescript-eslint";

/** @type {import("eslint").Linter.Config[]} */
export default [
    pluginJs.configs.recommended,
    ...tseslint.configs.recommended,
    {
        files: ["**/*.{js,mjs,cjs,ts}"]
    },
    {
        ignores: ["dist/*", "vite.config.js"]
    },
    {
        rules: {
            quotes: ["error", "double", { avoidEscape: true }],
            "max-len": [2, 120, 4],
            "arrow-body-style": "off",
            "import/prefer-default-export": "off",
            "@typescript-eslint/no-non-null-assertion": "off",
            "no-plusplus": "off",
            "no-shadow": "off",
            "@typescript-eslint/no-shadow": ["error"],
            "no-underscore-dangle": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": ["error"],
            "no-await-in-loop": "off",
            "no-useless-concat": "off"
        }
    },
    {
        files: ["**/*.test.ts"],
        rules: {
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/explicit-module-boundary-types": "off",
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-empty-function": "off",
            "max-classes-per-file": "off",
            "no-useless-constructor": "off"
        }
    }
];
