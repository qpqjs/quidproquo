import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@qpqjs/core': path.resolve(__dirname, '../core/src'),
      '@qpqjs/features': path.resolve(__dirname, '../features/src'),
      '@qpqjs/web': path.resolve(__dirname, '../web/src'),
      '@qpqjs/web-react': path.resolve(__dirname, '../web-react/src'),
      '@qpqjs/webserver': path.resolve(__dirname, '../webserver/src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    pool: 'threads',
  },
});
