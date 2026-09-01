import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Test against core source, not the last-built lib - matches
    // quidproquo-dev-server's and quidproquo-actionprocessor-node's configs.
    // Without this the suite silently tests whatever was built last, so a
    // change to a core type that this package renders (schedules, say) passes
    // or fails depending on whether someone remembered to build.
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../quidproquo-core/src/index.ts', import.meta.url)),
    },
  },
});
