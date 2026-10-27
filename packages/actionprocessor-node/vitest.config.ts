import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  },
  resolve: {
    alias: {
      '@qpqjs/actionprocessor-js': fileURLToPath(new URL('../actionprocessor-js/src/index.ts', import.meta.url)),
      '@qpqjs/core': fileURLToPath(new URL('../core/src/index.ts', import.meta.url)),
      '@qpqjs/webserver': fileURLToPath(new URL('../webserver/src/index.ts', import.meta.url)),
    },
  },
});
