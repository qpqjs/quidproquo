import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Test against core source, not the last-built lib - matches
    // quidproquo-actionprocessor-node's config and keeps class identity
    // (instanceof) consistent across every module in the test process.
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../quidproquo-core/src/index.ts', import.meta.url)),
      'quidproquo-webserver': fileURLToPath(new URL('../quidproquo-webserver/src/index.ts', import.meta.url)),
      'quidproquo-actionprocessor-node': fileURLToPath(new URL('../quidproquo-actionprocessor-node/src/index.ts', import.meta.url)),
    },
  },
});
