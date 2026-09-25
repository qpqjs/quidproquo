import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    // Test against sibling source, not the last-built lib, like the other packages' configs.
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../quidproquo-core/src/index.ts', import.meta.url)),
      'quidproquo-config-aws': fileURLToPath(new URL('../quidproquo-config-aws/src/index.ts', import.meta.url)),
      'quidproquo-webserver': fileURLToPath(new URL('../quidproquo-webserver/src/index.ts', import.meta.url)),
    },
  },
});
