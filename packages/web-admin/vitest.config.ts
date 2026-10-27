import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      'quidproquo-core': path.resolve(__dirname, '../core/src'),
      'quidproquo-features': path.resolve(__dirname, '../features/src'),
      'quidproquo-web': path.resolve(__dirname, '../web/src'),
      'quidproquo-web-react': path.resolve(__dirname, '../web-react/src'),
      'quidproquo-webserver': path.resolve(__dirname, '../webserver/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
  },
});
