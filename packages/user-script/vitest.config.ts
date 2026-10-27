import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Test against sibling sources, not the last-built libs, like the other packages' configs.
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      'quidproquo-webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
      'quidproquo-config-aws': fileURLToPath(new URL('../config-aws/src/index.ts', import.meta.url)),
      'quidproquo-actionprocessor-js': fileURLToPath(new URL('../actionprocessor-js/src/index.ts', import.meta.url)),
      'quidproquo-actionprocessor-node': fileURLToPath(new URL('../actionprocessor-node/src/index.ts', import.meta.url)),
    },
  },
});
