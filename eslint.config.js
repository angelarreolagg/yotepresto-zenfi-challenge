import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

const BARREL_ONLY = [
  {
    group: ['@/entities/*/**', '@/features/*/**'],
    message: 'Import a slice through its public API: "@/entities/transaction", not internal paths.',
  },
];

const layer = (files, group, message) => ({
  files,
  rules: { 'no-restricted-imports': ['error', { patterns: [...BARREL_ONLY, { group, message }] }] },
});

export default tseslint.config([
  // docs/components is reference-only material vendored for copy-paste into src/ — it is never
  // compiled, linted or bundled. See CODESTYLE.md §9.
  globalIgnores(['dist', 'docs']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: { ecmaVersion: 2022, globals: globals.browser },
  },

  layer(
    ['src/shared/**'],
    ['@/app/**', '@/features/**', '@/entities/**'],
    'shared is the lowest layer: it cannot import app, features or entities.',
  ),
  layer(
    ['src/entities/**'],
    ['@/app/**', '@/features/**'],
    'entities may only import from shared.',
  ),
  layer(
    ['src/features/**'],
    ['@/app/**', '@/features/**'],
    'A feature imports neither app nor another feature. If two need it, move it down.',
  ),
  { files: ['src/app/**'], rules: { 'no-restricted-imports': ['error', { patterns: BARREL_ONLY }] } },

  // Purity of the derivation layer. Uses the typescript-eslint rule id ON PURPOSE: it is a
  // DIFFERENT rule id from the core one above, so both coexist instead of overwriting.
  {
    files: ['src/**/lib/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'zustand',
                'recharts',
                'i18next',
                'react-i18next',
                'posthog-js',
              ],
              message: 'lib/ is pure derivation: no React, no store, no i18n, no analytics.',
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
]);
