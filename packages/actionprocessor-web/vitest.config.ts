import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // Alias sibling qpq packages to src so tests run without a build.
    alias: {
      '@qpqjs/actionprocessor-js': path.resolve(__dirname, '../actionprocessor-js/src'),
      '@qpqjs/core': path.resolve(__dirname, '../core/src'),
      '@qpqjs/web': path.resolve(__dirname, '../web/src'),
      '@qpqjs/webserver': path.resolve(__dirname, '../webserver/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
  },
});
