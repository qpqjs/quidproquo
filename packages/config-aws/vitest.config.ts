import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
  },
  resolve: {
    alias: {
      'quidproquo-core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      'quidproquo-webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
    },
  },
});
