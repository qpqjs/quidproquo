import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginJs from '@eslint/js';

import { jsdocConfigs } from './config/jsdoc.mjs';
import { overrides } from './config/overrides.mjs';
import { prettierConfigs } from './config/prettier.mjs';
import { reactConfigs } from './config/react.mjs';
import { restrictedSyntaxConfigs } from './config/restrictedSyntax.mjs';
import { testingConfigs } from './config/testing.mjs';
import qpqPlugin from './plugin/index.mjs';

export default [
  // lib/ is always build output (esm, commonjs and the bundled lambda layers).
  { ignores: ['**/dist/**', '**/lib/**', '**/node_modules/**', '**/*.d.ts'] },
  { files: ['**/*.{js,mjs,cjs,jsx,ts,tsx}'] },
  { languageOptions: { globals: { ...globals.browser, ...globals.node } } },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,

  {
    plugins: {
      'simple-import-sort': simpleImportSort,
    },
    rules: {
      'simple-import-sort/imports': [
        'error',
        {
          groups: [
            ['^@qpqjs/', '^quidproquo'],
            [
              '^\\u0000[^.]',
              // Packages. `react`/`react-dom` packages come first.
              '^react(-dom)?$',
              '^prop-types',
              // Internal packages come last.
              '^\\w',
              '^@',
            ],
            [
              // aliases first
              '^[~]',
              '^fixtures',
              // Parent imports. Put `..` last.
              '^\\.\\.(?!/?$)',
              '^\\.\\./?$',
              // Other relative imports. Put same-folder imports and `.` last.
              '^\\./(?=.*/)(?!/?$)',
              '^\\.(?!/?$)',
              '^\\./?$',
              // With Side effect imports
              '^\\u0000\\.',
            ],
          ],
        },
      ],
      'simple-import-sort/exports': 'error',
    },
  },

  qpqPlugin.configs.recommended,
  {
    // Entry handlers are named after their trigger (C1), not ask*.
    files: ['**/entry/**'],
    rules: { 'qpq/ask-prefix-generator-only': 'off' },
  },

  ...reactConfigs,
  ...restrictedSyntaxConfigs,
  ...testingConfigs,
  ...jsdocConfigs,
  ...prettierConfigs,

  ...overrides,
];
