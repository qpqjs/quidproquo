// Files that are allowed to write to the console: the CLIs (their output is their UI),
// logger implementations, the log and metric processors, and the lambda log extension.
const consoleAllowed = [
  '**/cli/src/**',
  '**/create-qpq-app/src/**',
  '**/*[Ll]ogger*',
  '**/log/**',
  '**/metric/**',
  '**/lambdaExtensions/**',
  // The console patcher that captures console output into a story's log.
  '**/resolveStoryWithLogs*',
];

// Rules switched on by the code standards (H1). They warn until every package has had
// its autofix pass; a later change flips them to errors.
export const overrides = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'warn',
    },
    rules: {
      // C1 allows a generator that never yields (a story that only composes or returns), so
      // the stock rule stays off; qpq/require-yield-star covers the real mistake.
      'require-yield': 'off',
      'prefer-const': 'warn',
      'no-console': 'warn',
      // Arguments are not checked: processor factories take `qpqConfig` by contract (B1) whether
      // or not a given processor reads it.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],

      // Off by decision: `any` is allowed at variance boundaries with a comment, and
      // `@ts-ignore` is allowed, not just `@ts-expect-error`.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      '@typescript-eslint/no-unnecessary-type-arguments': 'off',
      '@typescript-eslint/no-unnecessary-generics': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
    },
  },
  {
    files: consoleAllowed,
    rules: {
      'no-console': 'off',
    },
  },
];
