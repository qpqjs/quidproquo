// Files that are allowed to write to the console: logger implementations, the log and metric
// processors and the lambda log extension. Tools whose console output is their user interface
// (the CLIs, the dev server, the bundler) turn the rule off in their own eslint.config.mjs.
const consoleAllowed = [
  '**/*[Ll]ogger*',
  '**/log/**',
  '**/metric/**',
  '**/lambdaExtensions/**',
  // The console-redaction feature's processors write the redacted line to the console on purpose.
  '**/consoleLogRedaction/**',
  // Test-support harnesses silence and restore the console around the runs they drive.
  '**/integration/**',
  // The console patcher that captures console output into a story's log.
  '**/resolveStoryWithLogs*',
];

// Rules switched on by the code standards (H1). A rule is an error once every package is
// clean under it; the rest warn until their cleanup lines land (B9 for no-console).
export const overrides = [
  {
    linterOptions: {
      reportUnusedDisableDirectives: 'error',
    },
    rules: {
      // C1 allows a generator that never yields (a story that only composes or returns), so
      // the stock rule stays off; qpq/require-yield-star covers the real mistake.
      'require-yield': 'off',
      'prefer-const': 'error',
      'no-console': 'warn',
      // Arguments are not checked: processor factories take `qpqConfig` by contract (B1) whether
      // or not a given processor reads it.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { args: 'none', ignoreRestSiblings: true, varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],

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
