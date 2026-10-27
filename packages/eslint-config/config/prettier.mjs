import prettierRecommended from 'eslint-plugin-prettier/recommended';

export const prettierConfigs = [
  // Turns off conflicting stylistic rules and reports formatting via
  // prettier/prettier, reading the consuming repo's .prettierrc.
  prettierRecommended,
  {
    rules: {
      'prettier/prettier': [
        'error',
        {
          endOfLine: 'auto',
        },
      ],
    },
  },
];
