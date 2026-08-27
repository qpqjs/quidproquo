import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'quidproquo-core': path.resolve(__dirname, '../quidproquo-core/src'),
    },
  },
  test: {
    globals: true,
    environment: 'node',
  },
});
