import vitest from '@vitest/eslint-plugin';

// Test hygiene (T1, T5): every test asserts, nothing is focused, test files are `<subject>.test.ts(x)`.
export const testingConfigs = [
  {
    // `.spec` files are matched on purpose: consistent-test-filename can only report a `.spec` name if the block lints it.
    files: ['**/*.{test,spec}.{ts,tsx,js,mjs}'],
    plugins: { vitest },
    rules: {
      'vitest/expect-expect': 'warn',
      'vitest/no-focused-tests': 'warn',
      'vitest/consistent-test-filename': ['warn', { pattern: '.*\\.test\\.[tj]sx?$', allTestPattern: '.*\\.(test|spec)\\.[tj]sx?$' }],
    },
  },
];
