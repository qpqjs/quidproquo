import { defineConfig } from 'vitest/config';

// The release and site scripts have no package of their own, so this makes `scripts/` a
// vitest project of the root config, and `npm test` runs their tests with everything else.
export default defineConfig({
  test: {
    name: 'scripts',
    include: ['**/*.test.ts'],
  },
});
