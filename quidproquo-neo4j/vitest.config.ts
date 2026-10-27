import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
  },
  resolve: {
    // Test against core source, not the last-built lib, so tests never
    // depend on a stale build (matches the sibling packages' configs).
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../quidproquo-core/src/index.ts', import.meta.url)),
    },
  },
});
