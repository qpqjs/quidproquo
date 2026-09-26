import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'quidproquo-core': path.resolve(__dirname, '../quidproquo-core/src'),
      'quidproquo-webserver': path.resolve(__dirname, '../quidproquo-webserver/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
