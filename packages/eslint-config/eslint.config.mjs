import simpleImportSort from 'eslint-plugin-simple-import-sort';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import pluginJs from '@eslint/js';

import { overrides } from './config/overrides.mjs';
import { prettierConfigs } from './config/prettier.mjs';
import { reactConfigs } from './config/react.mjs';
import qpqPlugin from './plugin/index.mjs';

// Standalone use, without adopting the whole shared config:
//   import { qpqPlugin } from 'quidproquo-eslint-config';
//   export default [qpqPlugin.configs.recommended];
export { qpqPlugin };

export default [
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
            ['^quidproquo'],
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

  ...reactConfigs,
  ...prettierConfigs,

  overrides,
];
