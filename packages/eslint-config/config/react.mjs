import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';

export const reactConfigs = [
  {
    ...react.configs.flat.recommended,
    files: ['**/*.{jsx,tsx}'],
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
  {
    ...jsxA11y.flatConfigs.recommended,
    files: ['**/*.{jsx,tsx}'],
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      // New JSX transform, no React import needed
      'react/react-in-jsx-scope': 'off',

      // TypeScript owns prop shapes
      'react/prop-types': 'off',

      // Keep props readable and diffs stable
      'react/jsx-sort-props': [
        'error',
        {
          ignoreCase: true,
          reservedFirst: true,
        },
      ],

      // I know what i am doing
      'jsx-a11y/click-events-have-key-events': 'off',
      'jsx-a11y/no-static-element-interactions': 'off',
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  {
    // Hooks live in .ts files too (custom hooks), so apply everywhere
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
