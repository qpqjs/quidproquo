import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'quidproquo-core': path.resolve(__dirname, '../core/src'),
      'quidproquo-webserver': path.resolve(__dirname, '../webserver/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
    pool: 'threads',
  },
});
