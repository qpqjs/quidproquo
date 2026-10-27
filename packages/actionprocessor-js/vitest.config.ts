import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Alias sibling qpq packages to src so tests run without a build.
    alias: {
      '@qpqjs/core': path.resolve(__dirname, '../core/src'),
      '@qpqjs/webserver': path.resolve(__dirname, '../webserver/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
  },
});
